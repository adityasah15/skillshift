import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const mockRedisEval = jest.fn();
const mockRedisQuit = jest.fn();

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    eval: mockRedisEval,
    quit: mockRedisQuit,
  })),
}));

describe('RedisService presence leases', () => {
  let service: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RedisService({
      get: jest.fn().mockReturnValue('redis://localhost:6379'),
    } as unknown as ConfigService);
  });

  it('tracks a socket lease and reports first-online transition', async () => {
    mockRedisEval.mockResolvedValue(1);

    await expect(service.trackPresence('user-1', 'socket-1', 30)).resolves.toBe(
      true,
    );
    expect(mockRedisEval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('ZADD'"),
      2,
      'user:user-1:online',
      'chat:presence:user-1:sockets',
      expect.any(String),
      '30',
      'socket-1',
    );
  });

  it('removes a socket lease and reports last-offline transition', async () => {
    mockRedisEval.mockResolvedValue(1);

    await expect(service.removePresence('user-1', 'socket-1')).resolves.toBe(
      true,
    );
    expect(mockRedisEval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('ZREM'"),
      2,
      'user:user-1:online',
      'chat:presence:user-1:sockets',
      expect.any(String),
      'socket-1',
    );
  });
});
