import { IsEnum, IsInt, IsString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  API_PREFIX: string = 'v1';

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL: string = 'redis://localhost:6379';

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_ACCESS_EXPIRATION: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRATION: string = '30d';

  @IsString()
  LOG_LEVEL: string = 'info';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:8081';
}
