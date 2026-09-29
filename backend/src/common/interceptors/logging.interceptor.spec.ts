import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log request information after handling', (done) => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          originalUrl: '/services',
          user: {
            id: 'user-123',
          },
        }),
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of({ data: 'test' }),
    };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringMatching(/GET \/services 200 - \d+ms - userId=user-123/),
        );

        loggerSpy.mockRestore();
        done();
      },
    });
  });
});
