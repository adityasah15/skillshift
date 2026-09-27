import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<
    T,
    { data: T; meta: Record<string, unknown> } | T
  >
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ data: T; meta: Record<string, unknown> } | T> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return data as { data: T; meta: Record<string, unknown> };
        }

        return {
          data,
          meta: {},
        };
      }),
    );
  }
}