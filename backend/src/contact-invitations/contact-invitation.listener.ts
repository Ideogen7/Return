import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { USER_EVENTS } from '../common/events/user.events.js';
import type { UserRegisteredEvent } from '../common/events/user.events.js';

/**
 * Forward-compatible listener for user registration events.
 *
 * In Sprint 4.6, recipientUserId is always set at invitation creation time
 * (because only registered users can receive invitations). This listener is
 * a no-op for current invitations.
 *
 * In Sprint 5+, when invitations to external (non-registered) users are
 * supported, this listener will link PENDING invitations to newly registered
 * users by matching their email.
 *
 * Ref: CINV-014
 */
@Injectable()
export class ContactInvitationListener {
  /**
   * When a new user registers, find all PENDING invitations sent to their
   * email that don't yet have a recipientUserId, and link them.
   *
   * In Sprint 4.6 this is a no-op (recipientUserId is always set).
   * Prepared for Sprint 5+ external invitations.
   */
  @OnEvent(USER_EVENTS.REGISTERED)
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    const { userId, email } = event;

    // Sprint 4.6: intentional no-op.
    // recipientUserId is non-nullable in the current schema, so we must NOT
    // issue a query that filters on recipientUserId = NULL (Prisma would
    // reject it or return 0 rows).
    //
    // Sprint 5+: when invitations to external (non-registered) users are
    // supported and recipientUserId becomes nullable, replace the early
    // return with a Prisma updateMany():
    //   - find PENDING invitations where:
    //     - recipientEmail matches the newly registered user's email (case-insensitive)
    //     - recipientUserId IS NULL
    //   - set recipientUserId = userId
    //
    // The implementation is deferred to avoid invalid Prisma filters.
    void userId;
    void email;
  }
}
