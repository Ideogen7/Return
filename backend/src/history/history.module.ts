import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { HistoryService } from './history.service.js';
import { HistoryController } from './history.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
