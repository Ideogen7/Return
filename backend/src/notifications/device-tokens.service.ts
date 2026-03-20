import { Injectable, Logger } from '@nestjs/common';
import type { DevicePlatform } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '../common/exceptions/problem-details.exception.js';

@Injectable()
export class DeviceTokensService {
  private readonly logger = new Logger(DeviceTokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: string, token: string, platform: DevicePlatform): Promise<void> {
    const existing = await this.prisma.deviceToken.findFirst({
      where: { userId, token },
    });

    if (existing) {
      await this.prisma.deviceToken.update({
        where: { id: existing.id },
        data: { platform },
      });
      this.logger.log(`Updated device token for user ${userId}`);
    } else {
      await this.prisma.deviceToken.create({
        data: { userId, token, platform },
      });
      this.logger.log(`Registered new device token for user ${userId}`);
    }
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
