import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UserRole } from '@prisma/client';
import type { SafeUser } from '../auth/interfaces/auth-response.interface.js';
import type { UserSettings } from './users.service.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

// =============================================================================
// Fixtures
// =============================================================================

const MOCK_SAFE_USER: SafeUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.LENDER,
  profilePicture: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  lastLoginAt: null,
};

const MOCK_SETTINGS: UserSettings = {
  pushNotificationsEnabled: true,
  reminderEnabled: true,
  language: 'fr',
  timezone: 'Europe/Paris',
};

const MOCK_AUTH_USER: AuthenticatedUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  email: 'john@example.com',
  jti: 'mock-jti',
  tokenExp: Math.floor(Date.now() / 1000) + 600,
};

const mockRequest = { user: MOCK_AUTH_USER };

// =============================================================================
// Test Suite
// =============================================================================

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
    deleteAccount: jest.Mock;
    changePassword: jest.Mock;
    getSettings: jest.Mock;
    updateSettings: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    usersService = {
      getProfile: jest.fn().mockResolvedValue(MOCK_SAFE_USER),
      updateProfile: jest.fn().mockResolvedValue(MOCK_SAFE_USER),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
      changePassword: jest.fn().mockResolvedValue(undefined),
      getSettings: jest.fn().mockResolvedValue(MOCK_SETTINGS),
      updateSettings: jest.fn().mockResolvedValue(MOCK_SETTINGS),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  // ===========================================================================
  // GET /users/me
  // ===========================================================================

  describe('getProfile', () => {
    it('should delegate to UsersService.getProfile with userId from JWT', async () => {
      const result = await controller.getProfile(mockRequest);

      expect(usersService.getProfile).toHaveBeenCalledWith(
        MOCK_AUTH_USER.userId,
      );
      expect(result).toEqual(MOCK_SAFE_USER);
    });
  });

  // ===========================================================================
  // PATCH /users/me
  // ===========================================================================

  describe('updateProfile', () => {
    it('should delegate to UsersService.updateProfile', async () => {
      const dto = { firstName: 'Jane' };

      const result = await controller.updateProfile(mockRequest, dto);

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        MOCK_AUTH_USER.userId,
        dto,
      );
      expect(result).toEqual(MOCK_SAFE_USER);
    });
  });

  // ===========================================================================
  // DELETE /users/me
  // ===========================================================================

  describe('deleteAccount', () => {
    it('should delegate to UsersService.deleteAccount and return void', async () => {
      const dto = {
        password: 'StrongPass1!',
        confirmationText: 'DELETE MY ACCOUNT' as const,
      };

      const result = await controller.deleteAccount(mockRequest, dto);

      expect(usersService.deleteAccount).toHaveBeenCalledWith(
        MOCK_AUTH_USER.userId,
        dto,
      );
      expect(result).toBeUndefined();
    });
  });

  // ===========================================================================
  // PATCH /users/me/password
  // ===========================================================================

  describe('changePassword', () => {
    it('should delegate to UsersService.changePassword and return void', async () => {
      const dto = { oldPassword: 'StrongPass1!', newPassword: 'NewPass1!' };

      const result = await controller.changePassword(mockRequest, dto);

      expect(usersService.changePassword).toHaveBeenCalledWith(
        MOCK_AUTH_USER.userId,
        dto,
      );
      expect(result).toBeUndefined();
    });
  });

  // ===========================================================================
  // GET /users/me/settings
  // ===========================================================================

  describe('getSettings', () => {
    it('should return user settings', async () => {
      const result = await controller.getSettings(mockRequest);

      expect(usersService.getSettings).toHaveBeenCalledWith(
        MOCK_AUTH_USER.userId,
      );
      expect(result).toEqual(MOCK_SETTINGS);
    });
  });

  // ===========================================================================
  // PATCH /users/me/settings
  // ===========================================================================

  describe('updateSettings', () => {
    it('should delegate to UsersService.updateSettings', async () => {
      const dto = { language: 'en' };

      const result = await controller.updateSettings(mockRequest, dto);

      expect(usersService.updateSettings).toHaveBeenCalledWith(
        MOCK_AUTH_USER.userId,
        dto,
      );
      expect(result).toEqual(MOCK_SETTINGS);
    });
  });
});
