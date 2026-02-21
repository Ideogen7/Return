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
      response.status(body.status).setHeader('Content-Type', 'application/problem+json').json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle class-validator errors (Bad Request with structured error details)
      // Le exceptionFactory custom dans main.ts envoie un tableau d'objets
      // { field, code, message } au lieu de simples strings.
      const messages =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as Record<string, unknown>).message
          : undefined;

      if (status === 400 && Array.isArray(messages)) {
        // Supporte les deux formats : string[] (legacy) et { field, code, message }[] (custom factory)
        const errors = messages.map((entry: unknown) => {
          if (typeof entry === 'object' && entry !== null && 'field' in entry) {
            // Format structuré du exceptionFactory custom
            const structured = entry as { field: string; code: string; message: string };
            return {
              field: structured.field,
              code: structured.code,
              message: structured.message,
            };
          }
          // Fallback legacy : essai d'extraction par regex
          const msg = String(entry);
          const match = /^(\w+)\s/.exec(msg);
          return {
            field: match?.[1] ?? 'unknown',
            code: 'VALIDATION_ERROR',
            message: msg,
          };
        });
        const body: ProblemDetails = {
          type: 'https://api.return.app/errors/validation-failed',
          title: 'Validation Failed',
          status,
          detail: errors.map((e) => e.message).join('; '),
          instance: request.url,
          timestamp: new Date().toISOString(),
          requestId: getRequestId(),
          errors,
        };

        response.status(status).setHeader('Content-Type', 'application/problem+json').json(body);
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

      response.status(status).setHeader('Content-Type', 'application/problem+json').json(body);
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

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .setHeader('Content-Type', 'application/problem+json')
      .json(body);
  }
}
