import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProblemDetailsException, ProblemDetails } from './problem-details.exception.js';
import { getRequestId } from '../middleware/request-context.middleware.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof ProblemDetailsException) {
      const body = exception.getResponse() as ProblemDetails;
      response.status(body.status).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle class-validator errors
      if (typeof exceptionResponse === 'object' && 'message' in (exceptionResponse as Record<string, unknown>)) {
        const messages = (exceptionResponse as Record<string, unknown>).message;
        const errors = Array.isArray(messages)
          ? messages.map((msg: string) => ({
              field: 'unknown',
              code: 'VALIDATION_ERROR',
              message: msg,
            }))
          : undefined;

        const body: ProblemDetails = {
          type: 'https://api.return.app/errors/validation-error',
          title: 'Validation Error',
          status,
          detail: Array.isArray(messages) ? messages.join('; ') : String(messages),
          instance: request.url,
          timestamp: new Date().toISOString(),
          requestId: getRequestId(),
          errors,
        };

        response.status(status).json(body);
        return;
      }

      const body: ProblemDetails = {
        type: `https://api.return.app/errors/${status === 404 ? 'not-found' : 'http-error'}`,
        title: exception.message,
        status,
        detail: exception.message,
        instance: request.url,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(),
      };

      response.status(status).json(body);
      return;
    }

    // Unhandled exception
    this.logger.error(
      `Unhandled exception on ${request.url}: ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: ProblemDetails = {
      type: 'https://api.return.app/errors/internal-server-error',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred',
      instance: request.url,
      timestamp: new Date().toISOString(),
      requestId: getRequestId(),
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
