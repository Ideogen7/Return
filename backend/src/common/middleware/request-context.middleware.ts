import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface RequestStore {
  requestId: string;
  userId?: string;
}

export const requestStorage = new AsyncLocalStorage<RequestStore>();

export function getRequestId(): string {
  return requestStorage.getStore()?.requestId ?? 'no-request-id';
}

export function getUserId(): string | undefined {
  return requestStorage.getStore()?.userId;
}

export function setUserId(userId: string): void {
  const store = requestStorage.getStore();
  if (store) {
    store.userId = userId;
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    Object.defineProperty(req, 'requestId', { value: requestId });
    res.setHeader('X-Request-Id', requestId);

    requestStorage.run({ requestId }, () => {
      next();
    });
  }
}
