import { Module } from '@nestjs/common';
import { BorrowersController } from './borrowers.controller.js';
import { BorrowersService } from './borrowers.service.js';
import { BorrowerStatsListener } from './borrower-stats.listener.js';
import { BorrowerLinkingListener } from './borrower-linking.listener.js';
import { LoansModule } from '../loans/loans.module.js';

@Module({
  imports: [LoansModule],
  controllers: [BorrowersController],
  providers: [BorrowersService, BorrowerStatsListener, BorrowerLinkingListener],
  exports: [BorrowersService],
})
export class BorrowersModule {}
