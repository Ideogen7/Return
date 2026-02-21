import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import { getRequestId, getUserId } from '../middleware/request-context.middleware.js';

const injectContext = winston.format((info) => {
  info['requestId'] = getRequestId();
  const userId = getUserId();
  if (userId) info['userId'] = userId;
  return info;
});

export const loggerConfig = WinstonModule.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    injectContext(),
    process.env['NODE_ENV'] === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp as string} [${level}] ${message as string}${metaStr}`;
          }),
        ),
  ),
  defaultMeta: {
    service: 'return-api',
    environment: process.env['NODE_ENV'],
  },
  transports: [new winston.transports.Console()],
});
