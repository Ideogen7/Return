import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { loggerConfig } from './common/logger/winston.config.js';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter.js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
  });

  const config = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_PROVIDER);

  // Security
  app.use(helmet());
  app.enableCors();

  // Global prefix
  const prefix = config.get<string>('API_PREFIX', 'v1');
  app.setGlobalPrefix(prefix, {
    exclude: ['health', 'health/ready'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Start
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  logger.info(`Return API running on port ${port}`, {
    prefix,
    environment: config.get<string>('NODE_ENV'),
  });
}

bootstrap();
