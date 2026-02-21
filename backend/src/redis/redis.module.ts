import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Module Redis — Global pour être accessible partout sans import explicite.
 *
 * Fournit RedisService pour :
 * - Sprint 1 : Blacklist JWT (accès depuis AuthModule)
 * - Sprint 4 : BullMQ queue de rappels
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
