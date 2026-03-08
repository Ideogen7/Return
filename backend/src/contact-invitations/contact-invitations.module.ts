import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ContactInvitationsController } from './contact-invitations.controller.js';
import { ContactInvitationsService } from './contact-invitations.service.js';
import { ContactInvitationsCronService } from './contact-invitations-cron.service.js';
import { ContactInvitationListener } from './contact-invitation.listener.js';

@Module({
  imports: [PrismaModule],
  controllers: [ContactInvitationsController],
  providers: [ContactInvitationsService, ContactInvitationsCronService, ContactInvitationListener],
  exports: [ContactInvitationsService],
})
export class ContactInvitationsModule {}
