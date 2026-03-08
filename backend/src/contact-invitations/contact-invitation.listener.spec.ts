import { Test, TestingModule } from '@nestjs/testing';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactInvitationListener],
    }).compile();

    listener = module.get<ContactInvitationListener>(ContactInvitationListener);
  });

  describe('handleUserRegistered', () => {
    it('should be a no-op in Sprint 4.6 (recipientUserId is non-nullable)', async () => {
      const event: UserRegisteredEvent = { userId: USER_ID, email: EMAIL };

      // Should complete without error or side effects
      await expect(listener.handleUserRegistered(event)).resolves.toBeUndefined();
    });
  });
});
