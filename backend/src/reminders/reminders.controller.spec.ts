import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ReminderStatus, ReminderType, NotificationChannel } from '@prisma/client';

import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';
import type { ReminderWithLoan } from './reminders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/problem-details.exception.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

// =============================================================================
// Fixtures
// =============================================================================

const LENDER_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440000';
const LOAN_ID = '110e8400-e29b-41d4-a716-446655440000';
const REMINDER_ID = 'aaa00000-e29b-41d4-a716-446655440000';

const MOCK_AUTH_USER: AuthenticatedUser = {
  userId: LENDER_USER_ID,
  email: 'lender@example.com',
  role: 'LENDER',
  jti: 'jti-123',
  tokenExp: Math.floor(Date.now() / 1000) + 900,
};

const MOCK_OTHER_AUTH_USER: AuthenticatedUser = {
  userId: OTHER_USER_ID,
  email: 'other@example.com',
  role: 'LENDER',
  jti: 'jti-456',
  tokenExp: Math.floor(Date.now() / 1000) + 900,
};

const NOW = new Date('2026-04-07T10:00:00.000Z');
const SCHEDULED_FOR = new Date('2026-04-10T00:00:00.000Z');

const MOCK_REMINDER = {
  id: REMINDER_ID,
  loanId: LOAN_ID,
  type: ReminderType.PREVENTIVE,
  status: ReminderStatus.SCHEDULED,
  scheduledFor: SCHEDULED_FOR,
  sentAt: null,
  message: null,
  channel: NotificationChannel.PUSH,
  createdAt: NOW,
  updatedAt: NOW,
};

const MOCK_REMINDER_WITH_LOAN: ReminderWithLoan = {
  ...MOCK_REMINDER,
  loan: { id: LOAN_ID, lenderId: LENDER_USER_ID },
};

const MOCK_SENT_REMINDER_WITH_LOAN: ReminderWithLoan = {
  ...MOCK_REMINDER,
  status: ReminderStatus.SENT,
  sentAt: new Date('2026-04-10T08:00:00.000Z'),
  loan: { id: LOAN_ID, lenderId: LENDER_USER_ID },
};

// =============================================================================
// Test Suite
// =============================================================================

describe('RemindersController', () => {
  let controller: RemindersController;
  let remindersService: DeepMockProxy<RemindersService>;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    remindersService = mockDeep<RemindersService>();
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemindersController],
      providers: [
        { provide: RemindersService, useValue: remindersService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<RemindersController>(RemindersController);
  });

  // ===========================================================================
  // GET /v1/loans/:loanId/reminders
  // ===========================================================================

  describe('findByLoan', () => {
    it('should return all reminders for a loan', async () => {
      prisma.loan.findUnique.mockResolvedValue({
        id: LOAN_ID,
        lenderId: LENDER_USER_ID,
        deletedAt: null,
      } as never);
      remindersService.findByLoanId.mockResolvedValue([MOCK_REMINDER]);

      const mockReq = { user: MOCK_AUTH_USER };
      const result = await controller.findByLoan(LOAN_ID, mockReq as never);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: REMINDER_ID,
        loanId: LOAN_ID,
        type: ReminderType.PREVENTIVE,
        status: ReminderStatus.SCHEDULED,
        scheduledFor: SCHEDULED_FOR.toISOString(),
        sentAt: null,
        message: null,
        channel: NotificationChannel.PUSH,
      });
      expect(remindersService.findByLoanId).toHaveBeenCalledWith(LOAN_ID);
    });

    it('should throw 404 when loan does not exist', async () => {
      prisma.loan.findUnique.mockResolvedValue(null);
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.findByLoan(LOAN_ID, mockReq as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 404 when loan is soft-deleted', async () => {
      prisma.loan.findUnique.mockResolvedValue({
        id: LOAN_ID,
        lenderId: LENDER_USER_ID,
        deletedAt: new Date(),
      } as never);
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.findByLoan(LOAN_ID, mockReq as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when user is not the lender', async () => {
      prisma.loan.findUnique.mockResolvedValue({
        id: LOAN_ID,
        lenderId: LENDER_USER_ID,
        deletedAt: null,
      } as never);
      const mockReq = { user: MOCK_OTHER_AUTH_USER };

      await expect(controller.findByLoan(LOAN_ID, mockReq as never)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ===========================================================================
  // GET /v1/reminders/:reminderId
  // ===========================================================================

  describe('findById', () => {
    it('should return a single reminder', async () => {
      remindersService.findById.mockResolvedValue(MOCK_REMINDER_WITH_LOAN);
      const mockReq = { user: MOCK_AUTH_USER };

      const result = await controller.findById(REMINDER_ID, mockReq as never);

      expect(result).toEqual({
        id: REMINDER_ID,
        loanId: LOAN_ID,
        type: ReminderType.PREVENTIVE,
        status: ReminderStatus.SCHEDULED,
        scheduledFor: SCHEDULED_FOR.toISOString(),
        sentAt: null,
        message: null,
        channel: NotificationChannel.PUSH,
      });
      expect(remindersService.findById).toHaveBeenCalledWith(REMINDER_ID);
    });

    it('should throw 404 when reminder does not exist', async () => {
      remindersService.findById.mockResolvedValue(null);
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.findById(REMINDER_ID, mockReq as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when user is not the lender of the associated loan', async () => {
      remindersService.findById.mockResolvedValue({
        ...MOCK_REMINDER_WITH_LOAN,
        loan: { id: LOAN_ID, lenderId: OTHER_USER_ID },
      });
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.findById(REMINDER_ID, mockReq as never)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ===========================================================================
  // POST /v1/reminders/:reminderId/cancel
  // ===========================================================================

  describe('cancel', () => {
    it('should cancel a SCHEDULED reminder (204)', async () => {
      remindersService.findById.mockResolvedValue(MOCK_REMINDER_WITH_LOAN);
      remindersService.cancel.mockResolvedValue(undefined);
      const mockReq = { user: MOCK_AUTH_USER };

      await controller.cancel(REMINDER_ID, mockReq as never);

      expect(remindersService.cancel).toHaveBeenCalledWith(REMINDER_ID);
    });

    it('should throw 404 when reminder does not exist', async () => {
      remindersService.findById.mockResolvedValue(null);
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.cancel(REMINDER_ID, mockReq as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 403 when user is not the lender', async () => {
      remindersService.findById.mockResolvedValue({
        ...MOCK_REMINDER_WITH_LOAN,
        loan: { id: LOAN_ID, lenderId: OTHER_USER_ID },
      });
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.cancel(REMINDER_ID, mockReq as never)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw 409 when reminder is already SENT', async () => {
      remindersService.findById.mockResolvedValue(MOCK_SENT_REMINDER_WITH_LOAN);
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.cancel(REMINDER_ID, mockReq as never)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw 409 when reminder is FAILED', async () => {
      remindersService.findById.mockResolvedValue({
        ...MOCK_REMINDER_WITH_LOAN,
        status: ReminderStatus.FAILED,
      });
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.cancel(REMINDER_ID, mockReq as never)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw 409 when reminder is already CANCELLED', async () => {
      remindersService.findById.mockResolvedValue({
        ...MOCK_REMINDER_WITH_LOAN,
        status: ReminderStatus.CANCELLED,
      });
      const mockReq = { user: MOCK_AUTH_USER };

      await expect(controller.cancel(REMINDER_ID, mockReq as never)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
