import { Test, TestingModule } from '@nestjs/testing';
import { BorrowerStatsListener } from './borrower-stats.listener.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LOAN_EVENTS } from '../common/events/loan.events.js';
import type {
  LoanCreatedEvent,
  LoanStatusChangedEvent,
  LoanDeletedEvent,
} from '../common/events/loan.events.js';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';

describe('BorrowerStatsListener', () => {
  let listener: BorrowerStatsListener;
  let prisma: DeepMockProxy<PrismaService>;

  const BORROWER_ID = '11111111-1111-1111-1111-111111111111';
  const LOAN_ID = '22222222-2222-2222-2222-222222222222';
  const LENDER_ID = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowerStatsListener,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    listener = module.get<BorrowerStatsListener>(BorrowerStatsListener);
    prisma = module.get(PrismaService);
  });

  // =========================================================================
  // LOAN CREATED
  // =========================================================================
  describe(`@OnEvent(${LOAN_EVENTS.CREATED})`, () => {
    const event: LoanCreatedEvent = {
      loanId: LOAN_ID,
      borrowerId: BORROWER_ID,
      lenderUserId: LENDER_ID,
    };

    it('should increment totalLoans by 1', async () => {
      prisma.borrower.update.mockResolvedValue({} as never);

      await listener.handleLoanCreated(event);

      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { totalLoans: { increment: 1 } },
      });
    });
  });

  // =========================================================================
  // STATUS CHANGED
  // =========================================================================
  describe(`@OnEvent(${LOAN_EVENTS.STATUS_CHANGED})`, () => {
    it('should recalculate trustScore when status changes to RETURNED', async () => {
      const event: LoanStatusChangedEvent = {
        loanId: LOAN_ID,
        borrowerId: BORROWER_ID,
        lenderUserId: LENDER_ID,
        previousStatus: 'AWAITING_RETURN',
        newStatus: 'RETURNED',
      };

      prisma.borrower.findUnique.mockResolvedValue({
        totalLoans: 5,
      } as never);
      prisma.loan.count.mockResolvedValue(3);
      prisma.borrower.update.mockResolvedValue({} as never);

      await listener.handleStatusChanged(event);

      // trustScore = round(3 * 100 / 5) = 60
      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { trustScore: 60 },
      });
    });

    it('should recalculate trustScore when status changes to NOT_RETURNED', async () => {
      const event: LoanStatusChangedEvent = {
        loanId: LOAN_ID,
        borrowerId: BORROWER_ID,
        lenderUserId: LENDER_ID,
        previousStatus: 'ACTIVE',
        newStatus: 'NOT_RETURNED',
      };

      prisma.borrower.findUnique.mockResolvedValue({
        totalLoans: 4,
      } as never);
      prisma.loan.count.mockResolvedValue(1);
      prisma.borrower.update.mockResolvedValue({} as never);

      await listener.handleStatusChanged(event);

      // trustScore = round(1 * 100 / 4) = 25
      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { trustScore: 25 },
      });
    });

    it('should NOT recalculate trustScore for non-terminal status changes', async () => {
      const event: LoanStatusChangedEvent = {
        loanId: LOAN_ID,
        borrowerId: BORROWER_ID,
        lenderUserId: LENDER_ID,
        previousStatus: 'PENDING_CONFIRMATION',
        newStatus: 'ACTIVE',
      };

      await listener.handleStatusChanged(event);

      expect(prisma.borrower.findUnique).not.toHaveBeenCalled();
      expect(prisma.borrower.update).not.toHaveBeenCalled();
    });

    it('should set trustScore to 0 when borrower has 0 totalLoans', async () => {
      const event: LoanStatusChangedEvent = {
        loanId: LOAN_ID,
        borrowerId: BORROWER_ID,
        lenderUserId: LENDER_ID,
        previousStatus: 'ACTIVE',
        newStatus: 'RETURNED',
      };

      prisma.borrower.findUnique.mockResolvedValue({
        totalLoans: 0,
      } as never);
      prisma.borrower.update.mockResolvedValue({} as never);

      await listener.handleStatusChanged(event);

      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { trustScore: 0 },
      });
    });

    it('should set trustScore to 100 when all loans are returned', async () => {
      const event: LoanStatusChangedEvent = {
        loanId: LOAN_ID,
        borrowerId: BORROWER_ID,
        lenderUserId: LENDER_ID,
        previousStatus: 'AWAITING_RETURN',
        newStatus: 'RETURNED',
      };

      prisma.borrower.findUnique.mockResolvedValue({
        totalLoans: 3,
      } as never);
      prisma.loan.count.mockResolvedValue(3);
      prisma.borrower.update.mockResolvedValue({} as never);

      await listener.handleStatusChanged(event);

      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { trustScore: 100 },
      });
    });
  });

  // =========================================================================
  // LOAN DELETED
  // =========================================================================
  describe(`@OnEvent(${LOAN_EVENTS.DELETED})`, () => {
    const event: LoanDeletedEvent = {
      loanId: LOAN_ID,
      borrowerId: BORROWER_ID,
      lenderUserId: LENDER_ID,
      lastStatus: 'ACTIVE',
    };

    it('should decrement totalLoans and recalculate trustScore', async () => {
      prisma.borrower.findUnique
        .mockResolvedValueOnce({ totalLoans: 3 } as never) // first call: check > 0
        .mockResolvedValueOnce({ totalLoans: 2 } as never); // second call: recalculate
      prisma.borrower.update.mockResolvedValue({} as never);
      prisma.loan.count.mockResolvedValue(1);

      await listener.handleLoanDeleted(event);

      // First update: decrement
      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { totalLoans: { decrement: 1 } },
      });

      // Second update: trustScore = round(1 * 100 / 2) = 50
      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { trustScore: 50 },
      });
    });

    it('should NOT decrement when totalLoans is already 0', async () => {
      prisma.borrower.findUnique.mockResolvedValue({
        totalLoans: 0,
      } as never);

      await listener.handleLoanDeleted(event);

      expect(prisma.borrower.update).not.toHaveBeenCalled();
    });

    it('should NOT decrement when borrower is not found', async () => {
      prisma.borrower.findUnique.mockResolvedValue(null);

      await listener.handleLoanDeleted(event);

      expect(prisma.borrower.update).not.toHaveBeenCalled();
    });
  });
});
