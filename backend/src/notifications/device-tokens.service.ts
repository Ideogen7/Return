import { Injectable, Logger } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '../common/exceptions/problem-details.exception.js';

@Injectable()
export class DeviceTokensService {
  private readonly logger = new Logger(DeviceTokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, token: string, platform: DevicePlatform): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });

    this.logger.log(`Registered or updated device token for user ${userId}`);
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    const existing = await this.prisma.deviceToken.findFirst({
      where: { userId, token },
    });

    if (!existing) {
      throw new NotFoundException('DeviceToken', token, '/v1/notifications/device-token');
    }

    await this.prisma.deviceToken.delete({
      where: { id: existing.id },
    });

    this.logger.log(`Unregistered device token for user ${userId}`);
  }
}
