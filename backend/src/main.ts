import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { loggerConfig } from './common/logger/winston.config.js';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter.js';

// =============================================================================
// class-validator constraint name → OpenAPI-compatible error code mapping
// =============================================================================
const CONSTRAINT_CODE_MAP: Record<string, string> = {
  isEmail: 'INVALID_EMAIL',
  isNotEmpty: 'REQUIRED',
  isString: 'INVALID_TYPE',
  isInt: 'INVALID_TYPE',
  isNumber: 'INVALID_TYPE',
  isBoolean: 'INVALID_TYPE',
  isEnum: 'INVALID_ENUM',
  isIn: 'INVALID_ENUM',
  isUuid: 'INVALID_UUID',
  minLength: 'TOO_SHORT',
  maxLength: 'TOO_LONG',
  min: 'TOO_SMALL',
  max: 'TOO_LARGE',
  matches: 'INVALID_FORMAT',
  equals: 'INVALID_VALUE',
  isOptional: 'VALIDATION_ERROR',
  whitelistValidation: 'UNKNOWN_FIELD',
};

function constraintToCode(constraintName: string): string {
  return CONSTRAINT_CODE_MAP[constraintName] ?? 'VALIDATION_ERROR';
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:8081'),
    credentials: true,
  });

  // Global prefix
  const prefix = config.get<string>('API_PREFIX', 'v1');
  app.setGlobalPrefix(prefix);

  // Validation — avec exceptionFactory pour conserver les noms de champs structurés
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        // Transforme les ValidationError class-validator en tableau structuré
        // pour que AllExceptionsFilter puisse extraire `field` proprement
        const details = errors.flatMap((err) => {
          const constraints = err.constraints ?? {};
          return Object.entries(constraints).map(([key, message]) => ({
            field: err.property,
            code: constraintToCode(key),
            message,
          }));
        });
        return new BadRequestException({ message: details, error: 'Validation Failed' });
      },
    }),
  );

  // Exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Start
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(
    `Return API running on port ${port} [${config.get<string>('NODE_ENV')}] prefix=/${prefix}`,
  );
}

void bootstrap();
