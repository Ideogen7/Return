import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { NotificationsService } from './notifications.service.js';
import { DeviceTokensService } from './device-tokens.service.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto.js';
import { UnregisterDeviceTokenDto } from './dto/unregister-device-token.dto.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import type { PaginatedNotifications } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokensService: DeviceTokensService,
  ) {}

  @Get()
  async listNotifications(
    @Request() req: Express.Request,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedNotifications> {
    const user = (req as unknown as { user: AuthenticatedUser }).user;
    return this.notificationsService.findAllByUser(user.userId, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      unreadOnly: query.unreadOnly ?? false,
    });
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    @Request() req: Express.Request,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ): Promise<void> {
    const user = (req as unknown as { user: AuthenticatedUser }).user;
    await this.notificationsService.markAsRead(notificationId, user.userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Request() req: Express.Request): Promise<void> {
    const user = (req as unknown as { user: AuthenticatedUser }).user;
    await this.notificationsService.markAllAsRead(user.userId);
  }

  @Post('device-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerDeviceToken(
    @Request() req: Express.Request,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<void> {
    const user = (req as unknown as { user: AuthenticatedUser }).user;
    await this.deviceTokensService.registerToken(user.userId, dto.token, dto.platform);
  }

  @Delete('device-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterDeviceToken(
    @Request() req: Express.Request,
    @Body() dto: UnregisterDeviceTokenDto,
  ): Promise<void> {
    const user = (req as unknown as { user: AuthenticatedUser }).user;
    await this.deviceTokensService.unregisterToken(user.userId, dto.token);
  }
}
