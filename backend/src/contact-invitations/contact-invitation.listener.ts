import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service.js';
import { USER_EVENTS } from '../common/events/user.events.js';
import type { UserRegisteredEvent } from '../common/events/user.events.js';
import { InvitationStatus } from '@prisma/client';

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
  private readonly logger = new Logger(ContactInvitationListener.name);

  constructor(private readonly prisma: PrismaService) {}

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

    const result = await this.prisma.contactInvitation.updateMany({
      where: {
        recipientEmail: { equals: email, mode: 'insensitive' },
        recipientUserId: { equals: undefined as unknown as string },
        status: InvitationStatus.PENDING,
      },
      data: {
        recipientUserId: userId,
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Linked ${result.count} pending invitation(s) to newly registered User ${userId}`,
      );
    }
  }
}
