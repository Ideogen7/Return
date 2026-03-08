import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContactInvitationsCronService } from './contact-invitations-cron.service.js';
import { InvitationStatus } from '@prisma/client';

// =============================================================================
// Test Suite
// =============================================================================

describe('ContactInvitationsCronService', () => {
  let cron: ContactInvitationsCronService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactInvitationsCronService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    cron = module.get<ContactInvitationsCronService>(ContactInvitationsCronService);
  });

  describe('handleExpiredInvitations', () => {
    it('should transition PENDING invitations with past expiresAt to EXPIRED', async () => {
      prisma.contactInvitation.updateMany.mockResolvedValue({ count: 3 });

      await cron.handleExpiredInvitations();

      expect(prisma.contactInvitation.updateMany).toHaveBeenCalledWith({
        where: {
          status: InvitationStatus.PENDING,
          expiresAt: { lt: expect.any(Date) },
        },
        data: {
          status: InvitationStatus.EXPIRED,
        },
      });
    });

    it('should not fail when no invitations are expired', async () => {
      prisma.contactInvitation.updateMany.mockResolvedValue({ count: 0 });

      await cron.handleExpiredInvitations();

      expect(prisma.contactInvitation.updateMany).toHaveBeenCalled();
    });
  });
});
