import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from './config/config.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { HealthModule } from './health/health.module.js';
import { BorrowersModule } from './borrowers/borrowers.module.js';
import { ItemsModule } from './items/items.module.js';
import { LoansModule } from './loans/loans.module.js';
import { ContactInvitationsModule } from './contact-invitations/contact-invitations.module.js';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware.js';

@Module({
  imports: [
    // --- Infrastructure ---
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,

    // --- Auth ---
    AuthModule,

    // --- Features ---
    UsersModule,
    HealthModule,
    BorrowersModule,
    ItemsModule,
    LoansModule,
    ContactInvitationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
