import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const responseMessage = (
          exceptionResponse as {
            message: string | string[];
          }
        ).message;
        message = Array.isArray(responseMessage)
          ? responseMessage.join(', ')
          : responseMessage;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          break;

        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          break;

        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid related resource';
          break;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
