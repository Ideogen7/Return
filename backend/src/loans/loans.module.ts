import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { LoansService } from './loans.service.js';
import { LoansController } from './loans.controller.js';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
