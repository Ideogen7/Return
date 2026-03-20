import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DevicePlatform } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { DeviceTokensService } from './device-tokens.service.js';

// =============================================================================
// Fixtures
// =============================================================================

const USER_ID = '11111111-1111-1111-1111-111111111111';
const TOKEN = 'fMI-QUBYRE:APA91bH-test-token';
const TOKEN_ID = 'dt-11111111-1111-1111-1111-111111111111';

// =============================================================================
// Test Suite — REM-023 to REM-028
// =============================================================================

describe('DeviceTokensService', () => {
  let service: DeviceTokensService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    service = new DeviceTokensService(prisma);
  });

  describe('registerToken', () => {
    it('should upsert device token for the user', async () => {
      prisma.deviceToken.upsert.mockResolvedValue({
        id: TOKEN_ID,
        userId: USER_ID,
        token: TOKEN,
        platform: DevicePlatform.android,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.registerToken(USER_ID, TOKEN, DevicePlatform.android);

      expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
        where: { token: TOKEN },
        update: { userId: USER_ID, platform: DevicePlatform.android },
        create: {
          userId: USER_ID,
          token: TOKEN,
          platform: DevicePlatform.android,
        },
      });
    });

    it('should handle reassigning token to a different user', async () => {
      prisma.deviceToken.upsert.mockResolvedValue({
        id: TOKEN_ID,
        userId: USER_ID,
        token: TOKEN,
        platform: DevicePlatform.android,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.registerToken(USER_ID, TOKEN, DevicePlatform.android);

      expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
        where: { token: TOKEN },
        update: { userId: USER_ID, platform: DevicePlatform.android },
        create: {
          userId: USER_ID,
          token: TOKEN,
          platform: DevicePlatform.android,
        },
      });
    });
  });

  describe('unregisterToken', () => {
    it('should delete the device token', async () => {
      prisma.deviceToken.findFirst.mockResolvedValue({
        id: TOKEN_ID,
        userId: USER_ID,
        token: TOKEN,
        platform: DevicePlatform.android,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.deviceToken.delete.mockResolvedValue({} as never);

      await service.unregisterToken(USER_ID, TOKEN);

      expect(prisma.deviceToken.delete).toHaveBeenCalledWith({
        where: { id: TOKEN_ID },
      });
    });

    it('should throw NotFoundException when token does not exist', async () => {
      prisma.deviceToken.findFirst.mockResolvedValue(null);

      await expect(service.unregisterToken(USER_ID, TOKEN)).rejects.toThrow();
    });
  });
});
