import { Test, TestingModule } from '@nestjs/testing';
import { BorrowerLinkingListener } from './borrower-linking.listener.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { USER_EVENTS } from '../common/events/user.events.js';
import type { UserRegisteredEvent } from '../common/events/user.events.js';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';

describe('BorrowerLinkingListener', () => {
  let listener: BorrowerLinkingListener;
  let prisma: DeepMockProxy<PrismaService>;

  const USER_ID = '11111111-1111-1111-1111-111111111111';
  const LENDER_1_ID = '22222222-2222-2222-2222-222222222222';
  const LENDER_2_ID = '33333333-3333-3333-3333-333333333333';
  const BORROWER_1_ID = '44444444-4444-4444-4444-444444444444';
  const BORROWER_2_ID = '55555555-5555-5555-5555-555555555555';
  const EMAIL = 'alice@example.com';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowerLinkingListener,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    listener = module.get<BorrowerLinkingListener>(BorrowerLinkingListener);
    prisma = module.get(PrismaService);
  });

  // =========================================================================
  // INTEG-001 : user.registered → Borrower.userId peuplé
  // =========================================================================
  describe(`@OnEvent(${USER_EVENTS.REGISTERED})`, () => {
    const event: UserRegisteredEvent = {
      userId: USER_ID,
      email: EMAIL,
    };

    it('should update Borrower.userId for all Borrowers with matching email', async () => {
      // Arrange
      prisma.borrower.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await listener.handleUserRegistered(event);

      // Assert
      expect(prisma.borrower.updateMany).toHaveBeenCalledWith({
        where: {
          email: EMAIL,
          userId: null,
        },
        data: {
          userId: USER_ID,
        },
      });
    });

    // =========================================================================
    // INTEG-003 : Aucun Borrower ne matche → pas d'erreur
    // =========================================================================
    it('should do nothing when no Borrower matches the email (no error)', async () => {
      // Arrange
      prisma.borrower.updateMany.mockResolvedValue({ count: 0 });

      // Act & Assert — should not throw
      await expect(listener.handleUserRegistered(event)).resolves.toBeUndefined();

      expect(prisma.borrower.updateMany).toHaveBeenCalledWith({
        where: {
          email: EMAIL,
          userId: null,
        },
        data: {
          userId: USER_ID,
        },
      });
    });

    // =========================================================================
    // INTEG-004 : Plusieurs Borrower avec le même email → tous reçoivent userId
    // =========================================================================
    it('should update ALL Borrowers with matching email (multiple lenders)', async () => {
      // Arrange — 2 Borrowers from different lenders, same email
      prisma.borrower.updateMany.mockResolvedValue({ count: 2 });

      // Act
      await listener.handleUserRegistered(event);

      // Assert — updateMany is called once and updates all matches
      expect(prisma.borrower.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.borrower.updateMany).toHaveBeenCalledWith({
        where: {
          email: EMAIL,
          userId: null,
        },
        data: {
          userId: USER_ID,
        },
      });
    });

    it('should only update Borrowers with userId = null (not already linked)', async () => {
      // Arrange
      prisma.borrower.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await listener.handleUserRegistered(event);

      // Assert — WHERE clause includes userId: null
      expect(prisma.borrower.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: null,
          }),
        }),
      );
    });
  });
});
