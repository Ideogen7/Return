import { HttpException, HttpStatus } from '@nestjs/common';
import { getRequestId } from '../middleware/request-context.middleware.js';

export interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  requestId: string;
  errors?: ErrorDetail[];
}

export class ProblemDetailsException extends HttpException {
  constructor(
    status: HttpStatus,
    type: string,
    title: string,
    detail: string,
    instance: string,
    errors?: ErrorDetail[],
  ) {
    const body: ProblemDetails = {
      type: `https://api.return.app/errors/${type}`,
      title,
      status,
      detail,
      instance,
      timestamp: new Date().toISOString(),
      requestId: getRequestId(),
      errors,
    };
    super(body, status);
  }
}

// --- Concrete exception classes ---

export class NotFoundException extends ProblemDetailsException {
  constructor(resource: string, id: string, path: string) {
    super(
      HttpStatus.NOT_FOUND,
      `${resource.toLowerCase()}-not-found`,
      `${resource} Not Found`,
      `The ${resource.toLowerCase()} with ID '${id}' does not exist or you don't have access to it.`,
      path,
      [{ field: `${resource.toLowerCase()}Id`, code: 'NOT_FOUND', message: `${resource} does not exist` }],
    );
  }
}

export class ConflictException extends ProblemDetailsException {
  constructor(type: string, detail: string, path: string) {
    super(HttpStatus.CONFLICT, type, 'Conflict', detail, path);
  }
}

export class ForbiddenException extends ProblemDetailsException {
  constructor(type: string, detail: string, path: string) {
    super(HttpStatus.FORBIDDEN, type, 'Forbidden', detail, path);
  }
}

export class UnauthorizedException extends ProblemDetailsException {
  constructor(type: string, detail: string, path: string) {
    super(HttpStatus.UNAUTHORIZED, type, 'Unauthorized', detail, path);
  }
}

export class RateLimitException extends ProblemDetailsException {
  constructor(detail: string, path: string) {
    super(HttpStatus.TOO_MANY_REQUESTS, 'too-many-requests', 'Too Many Requests', detail, path);
  }
}
