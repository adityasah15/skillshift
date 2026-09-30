import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      throw new Error('REDIS_URL is not configured');
    }
    this.redis = new Redis(url);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl !== undefined) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  async incrWithTtl(key: string, ttl: number): Promise<number> {
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, ttl);
    }

    return count;
  }

  async trackPresence(
    userId: string,
    socketId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const onlineKey = `user:${userId}:online`;
    const socketsKey = `chat:presence:${userId}:sockets`;
    const result = await this.redis.eval(
      `
        local now = tonumber(ARGV[1])
        local ttl = tonumber(ARGV[2])
        redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now)
        local wasOnline = redis.call('ZCARD', KEYS[2]) > 0
        redis.call('ZADD', KEYS[2], now + ttl * 1000, ARGV[3])
        redis.call('EXPIRE', KEYS[2], ttl)
        redis.call('SET', KEYS[1], 'true', 'EX', ttl)
        if wasOnline then return 0 else return 1 end
      `,
      2,
      onlineKey,
      socketsKey,
      Date.now().toString(),
      ttlSeconds.toString(),
      socketId,
    );

    return Number(result) === 1;
  }

  async removePresence(userId: string, socketId: string): Promise<boolean> {
    const onlineKey = `user:${userId}:online`;
    const socketsKey = `chat:presence:${userId}:sockets`;
    const result = await this.redis.eval(
      `
        local now = tonumber(ARGV[1])
        redis.call('ZREM', KEYS[2], ARGV[2])
        redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now)
        local remaining = redis.call('ZCARD', KEYS[2])
        if remaining == 0 then
          redis.call('DEL', KEYS[1], KEYS[2])
          return 1
        end
        local latest = redis.call('ZREVRANGE', KEYS[2], 0, 0, 'WITHSCORES')
        local ttl = math.max(1, tonumber(latest[2]) - now)
        redis.call('SET', KEYS[1], 'true', 'PX', ttl)
        return 0
      `,
      2,
      onlineKey,
      socketsKey,
      Date.now().toString(),
      socketId,
    );

    return Number(result) === 1;
  }
}
