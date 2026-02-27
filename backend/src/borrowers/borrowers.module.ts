import { Module } from '@nestjs/common';
import { BorrowersController } from './borrowers.controller.js';
import { BorrowersService } from './borrowers.service.js';
import { BorrowerStatsListener } from './borrower-stats.listener.js';

@Module({
  controllers: [BorrowersController],
  providers: [BorrowersService, BorrowerStatsListener],
  exports: [BorrowersService],
})
export class BorrowersModule {}
