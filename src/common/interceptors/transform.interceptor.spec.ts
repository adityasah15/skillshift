import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap the response in data and meta', (done) => {
    const context = {} as ExecutionContext;

    const next: CallHandler = {
      handle: () => of({ id: '123', title: 'Test Service' }),
    };

    interceptor.intercept(context, next).subscribe({
      next: (result) => {
        expect(result).toEqual({
          data: {
            id: '123',
            title: 'Test Service',
          },
          meta: {},
        });

        done();
      },
    });
  });
  it('should not double-wrap an already transformed response', (done) => {
    const context = {} as ExecutionContext;

    const response = {
      data: [{ id: '123' }],
      meta: { cursor: 'abc' },
    };

    const next: CallHandler = {
      handle: () => of(response),
    };

    interceptor.intercept(context, next).subscribe({
      next: (result) => {
        expect(result).toEqual(response);
        done();
      },
    });
  });
});
