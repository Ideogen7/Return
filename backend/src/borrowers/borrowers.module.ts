import { Module } from '@nestjs/common';
import { BorrowersController } from './borrowers.controller.js';
import { BorrowersService } from './borrowers.service.js';

@Module({
  controllers: [BorrowersController],
  providers: [BorrowersService],
  exports: [BorrowersService],
})
export class BorrowersModule {}
