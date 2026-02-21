import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { loggerConfig } from './common/logger/winston.config.js';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter.js';

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
  app.setGlobalPrefix(prefix, {
    exclude: ['health', 'health/ready'],
  });

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
          return Object.values(constraints).map((message) => ({
            field: err.property,
            code: 'VALIDATION_ERROR',
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
