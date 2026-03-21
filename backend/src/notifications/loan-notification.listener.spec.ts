import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { NotificationType, LoanStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from './notifications.service.js';
import { LoanNotificationListener } from './loan-notification.listener.js';
import { LOAN_EVENTS } from '../common/events/loan.events.js';
import type { LoanCreatedEvent, LoanStatusChangedEvent } from '../common/events/loan.events.js';

// =============================================================================
// Fixtures
// =============================================================================

const LOAN_ID = '11111111-1111-1111-1111-111111111111';
const BORROWER_ID = '22222222-2222-2222-2222-222222222222';
const LENDER_USER_ID = '33333333-3333-3333-3333-333333333333';
const BORROWER_USER_ID = '44444444-4444-4444-4444-444444444444';

const createdEvent: LoanCreatedEvent = {
  loanId: LOAN_ID,
  borrowerId: BORROWER_ID,
  lenderUserId: LENDER_USER_ID,
  returnDate: new Date('2026-04-10'),
  createdAt: new Date('2026-03-20'),
};

const statusChangedEvent: LoanStatusChangedEvent = {
  loanId: LOAN_ID,
  borrowerId: BORROWER_ID,
  lenderUserId: LENDER_USER_ID,
  previousStatus: LoanStatus.PENDING_CONFIRMATION,
  newStatus: LoanStatus.ACTIVE,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('LoanNotificationListener', () => {
  let listener: LoanNotificationListener;
  let prisma: DeepMockProxy<PrismaService>;
  let notificationsService: { sendPushToUsers: jest.Mock };

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    notificationsService = {
      sendPushToUsers: jest.fn().mockResolvedValue(undefined),
    };
    listener = new LoanNotificationListener(
      prisma,
      notificationsService as unknown as NotificationsService,
    );
  });

  // ===========================================================================
  // LOAN_CREATED
  // ===========================================================================

  describe(`@OnEvent(${LOAN_EVENTS.CREATED})`, () => {
    it('should create a notification for the borrower', async () => {
      prisma.borrower.findUnique.mockResolvedValue({
        userId: BORROWER_USER_ID,
      } as never);

      await listener.handleLoanCreated(createdEvent);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: BORROWER_USER_ID,
          type: NotificationType.LOAN_CREATED,
          title: 'Nouveau prêt',
          body: 'Un nouveau prêt a été enregistré pour vous.',
          relatedLoanId: LOAN_ID,
        },
      });
    });

    it('should call sendPushToUsers with the borrower userId after creating the notification', async () => {
      prisma.borrower.findUnique.mockResolvedValue({ userId: BORROWER_USER_ID } as never);
      prisma.notification.create.mockResolvedValue({} as never);

      await listener.handleLoanCreated(createdEvent);

      expect(notificationsService.sendPushToUsers).toHaveBeenCalledWith(
        [BORROWER_USER_ID],
        'Nouveau prêt',
        'Un nouveau prêt a été enregistré pour vous.',
        expect.objectContaining({ loanId: LOAN_ID, type: 'LOAN_CREATED' }),
      );
    });

    it('should not create a notification if borrower has no userId', async () => {
      prisma.borrower.findUnique.mockResolvedValue({
        userId: null,
      } as never);

      await listener.handleLoanCreated(createdEvent);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should not call sendPushToUsers when borrower has no userId', async () => {
      prisma.borrower.findUnique.mockResolvedValue({ userId: null } as never);

      await listener.handleLoanCreated(createdEvent);

      expect(notificationsService.sendPushToUsers).not.toHaveBeenCalled();
    });

    it('should still create the in-app notification when sendPushToUsers rejects', async () => {
      prisma.borrower.findUnique.mockResolvedValue({ userId: BORROWER_USER_ID } as never);
      prisma.notification.create.mockResolvedValue({} as never);
      notificationsService.sendPushToUsers.mockRejectedValue(new Error('FCM unavailable'));

      await expect(listener.handleLoanCreated(createdEvent)).resolves.not.toThrow();

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: NotificationType.LOAN_CREATED }),
      });
    });
  });

  // ===========================================================================
  // STATUS_CHANGED
  // ===========================================================================

  describe(`@OnEvent(${LOAN_EVENTS.STATUS_CHANGED})`, () => {
    it('should notify the lender when loan is confirmed (ACTIVE)', async () => {
      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        newStatus: LoanStatus.ACTIVE,
      };

      await listener.handleStatusChanged(event);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: LENDER_USER_ID,
          type: NotificationType.LOAN_CONFIRMED,
          title: 'Prêt confirmé',
          body: "L'emprunteur a confirmé le prêt.",
          relatedLoanId: LOAN_ID,
        },
      });
    });

    it('should call sendPushToUsers for the lender when status changes to ACTIVE', async () => {
      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        newStatus: LoanStatus.ACTIVE,
      };
      prisma.notification.create.mockResolvedValue({} as never);

      await listener.handleStatusChanged(event);

      expect(notificationsService.sendPushToUsers).toHaveBeenCalledWith(
        [LENDER_USER_ID],
        'Prêt confirmé',
        "L'emprunteur a confirmé le prêt.",
        expect.objectContaining({ loanId: LOAN_ID, type: 'LOAN_CONFIRMED' }),
      );
    });

    it('should notify both lender and borrower when auto-confirmed (ACTIVE_BY_DEFAULT)', async () => {
      prisma.borrower.findUnique.mockResolvedValue({
        userId: BORROWER_USER_ID,
      } as never);

      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        newStatus: LoanStatus.ACTIVE_BY_DEFAULT,
      };

      await listener.handleStatusChanged(event);

      expect(prisma.notification.create).toHaveBeenCalledTimes(2);

      // Lender notification
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: LENDER_USER_ID,
          type: NotificationType.LOAN_AUTO_CONFIRMED,
          title: 'Prêt confirmé automatiquement',
          body: 'Le prêt a été confirmé automatiquement après 48h sans réponse.',
          relatedLoanId: LOAN_ID,
        },
      });

      // Borrower notification
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: BORROWER_USER_ID,
          type: NotificationType.LOAN_AUTO_CONFIRMED,
          title: 'Prêt confirmé automatiquement',
          body: 'Le prêt a été confirmé automatiquement après 48h sans réponse.',
          relatedLoanId: LOAN_ID,
        },
      });
    });

    it('should notify the lender when loan is contested (CONTESTED)', async () => {
      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        newStatus: LoanStatus.CONTESTED,
      };

      await listener.handleStatusChanged(event);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: LENDER_USER_ID,
          type: NotificationType.LOAN_CONTESTED,
          title: 'Prêt contesté',
          body: "L'emprunteur a contesté le prêt.",
          relatedLoanId: LOAN_ID,
        },
      });
    });

    it('should notify the borrower when loan is returned (RETURNED)', async () => {
      prisma.borrower.findUnique.mockResolvedValue({
        userId: BORROWER_USER_ID,
      } as never);

      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        previousStatus: LoanStatus.AWAITING_RETURN,
        newStatus: LoanStatus.RETURNED,
      };

      await listener.handleStatusChanged(event);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: BORROWER_USER_ID,
          type: NotificationType.LOAN_RETURNED,
          title: 'Objet rendu',
          body: 'Le prêteur a confirmé le retour de votre objet.',
          relatedLoanId: LOAN_ID,
        },
      });
    });

    it('should call sendPushToUsers for the borrower when status changes to RETURNED', async () => {
      prisma.borrower.findUnique.mockResolvedValue({ userId: BORROWER_USER_ID } as never);
      prisma.notification.create.mockResolvedValue({} as never);

      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        previousStatus: LoanStatus.AWAITING_RETURN,
        newStatus: LoanStatus.RETURNED,
      };

      await listener.handleStatusChanged(event);

      expect(notificationsService.sendPushToUsers).toHaveBeenCalledWith(
        [BORROWER_USER_ID],
        'Objet rendu',
        'Le prêteur a confirmé le retour de votre objet.',
        expect.objectContaining({ loanId: LOAN_ID, type: 'LOAN_RETURNED' }),
      );
    });

    it('should not create a notification for unhandled status (AWAITING_RETURN)', async () => {
      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        newStatus: LoanStatus.AWAITING_RETURN,
      };

      await listener.handleStatusChanged(event);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should not call sendPushToUsers for unhandled status (AWAITING_RETURN)', async () => {
      const event: LoanStatusChangedEvent = {
        ...statusChangedEvent,
        newStatus: LoanStatus.AWAITING_RETURN,
      };

      await listener.handleStatusChanged(event);

      expect(notificationsService.sendPushToUsers).not.toHaveBeenCalled();
    });
  });
});
