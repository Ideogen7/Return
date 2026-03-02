import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoansCronService } from './loans-cron.service.js';
import { LOAN_EVENTS } from '../common/events/loan.events.js';
import { LoanStatus } from '@prisma/client';

// =============================================================================
// Fixtures
// =============================================================================

const LENDER_ID = '550e8400-e29b-41d4-a716-446655440000';
const BORROWER_ID = '330e8400-e29b-41d4-a716-446655440000';
const LOAN_ID_1 = '110e8400-e29b-41d4-a716-446655440001';
const LOAN_ID_2 = '110e8400-e29b-41d4-a716-446655440002';

// =============================================================================
// Test Suite — LOAN-022 / LOAN-023
// =============================================================================

describe('LoansCronService', () => {
  let cronService: LoansCronService;
  let prisma: DeepMockProxy<PrismaService>;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansCronService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    cronService = module.get<LoansCronService>(LoansCronService);
  });

  describe('handlePendingTimeout', () => {
    it('should auto-confirm loans pending > 48h to ACTIVE_BY_DEFAULT', async () => {
      const expiredLoans = [
        { id: LOAN_ID_1, borrowerId: BORROWER_ID, lenderId: LENDER_ID },
        { id: LOAN_ID_2, borrowerId: BORROWER_ID, lenderId: LENDER_ID },
      ];

      prisma.loan.findMany.mockResolvedValue(expiredLoans as never);
      prisma.loan.updateMany.mockResolvedValue({ count: 2 });

      await cronService.handlePendingTimeout();

      // Should query for PENDING_CONFIRMATION loans older than 48h
      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: {
          status: LoanStatus.PENDING_CONFIRMATION,
          createdAt: { lt: expect.any(Date) },
          deletedAt: null,
        },
        select: { id: true, borrowerId: true, lenderId: true },
      });

      // Should batch update to ACTIVE_BY_DEFAULT
      expect(prisma.loan.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [LOAN_ID_1, LOAN_ID_2] },
        },
        data: {
          status: LoanStatus.ACTIVE_BY_DEFAULT,
          confirmationDate: expect.any(Date),
        },
      });

      // Should emit STATUS_CHANGED for each loan
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith(LOAN_EVENTS.STATUS_CHANGED, {
        loanId: LOAN_ID_1,
        borrowerId: BORROWER_ID,
        lenderUserId: LENDER_ID,
        previousStatus: LoanStatus.PENDING_CONFIRMATION,
        newStatus: LoanStatus.ACTIVE_BY_DEFAULT,
      });
    });

    it('should do nothing when no expired loans exist', async () => {
      prisma.loan.findMany.mockResolvedValue([]);

      await cronService.handlePendingTimeout();

      expect(prisma.loan.updateMany).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should use 48h cutoff date', async () => {
      prisma.loan.findMany.mockResolvedValue([]);

      const before = Date.now();
      await cronService.handlePendingTimeout();
      const after = Date.now();

      const call = prisma.loan.findMany.mock.calls[0][0] as {
        where: { createdAt: { lt: Date } };
      };
      const cutoffTime = call.where.createdAt.lt.getTime();
      const expected48h = 48 * 60 * 60 * 1000;

      // Cutoff should be roughly 48h ago (within 1 second tolerance)
      expect(before - cutoffTime).toBeGreaterThanOrEqual(expected48h - 1000);
      expect(after - cutoffTime).toBeLessThanOrEqual(expected48h + 1000);
    });
  });
});
