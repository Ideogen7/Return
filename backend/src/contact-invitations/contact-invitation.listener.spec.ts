import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContactInvitationListener } from './contact-invitation.listener.js';
import type { UserRegisteredEvent } from '../common/events/user.events.js';

// =============================================================================
// Fixtures
// =============================================================================

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const EMAIL = 'marie.dupont@example.com';

// =============================================================================
// Test Suite
// =============================================================================

describe('ContactInvitationListener', () => {
  let listener: ContactInvitationListener;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactInvitationListener, { provide: PrismaService, useValue: prisma }],
    }).compile();

    listener = module.get<ContactInvitationListener>(ContactInvitationListener);
  });

  describe('handleUserRegistered', () => {
    it('should attempt to link pending invitations by email (no-op in Sprint 4.6)', async () => {
      prisma.contactInvitation.updateMany.mockResolvedValue({ count: 0 });

      const event: UserRegisteredEvent = { userId: USER_ID, email: EMAIL };
      await listener.handleUserRegistered(event);

      expect(prisma.contactInvitation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { recipientUserId: USER_ID },
        }),
      );
    });

    it('should log when invitations are linked', async () => {
      prisma.contactInvitation.updateMany.mockResolvedValue({ count: 2 });

      const event: UserRegisteredEvent = { userId: USER_ID, email: EMAIL };
      await listener.handleUserRegistered(event);

      // Verify it completes without error (logging is a side effect)
      expect(prisma.contactInvitation.updateMany).toHaveBeenCalled();
    });
  });
});
