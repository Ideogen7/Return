import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { UsersService } from './users.service.js';
import { UserRole } from '@prisma/client';
import type { ProblemDetails } from '../common/exceptions/problem-details.exception.js';

// =============================================================================
// Mock bcrypt
// =============================================================================

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as {
  hash: jest.Mock;
  compare: jest.Mock;
};

// =============================================================================
// Fixtures
// =============================================================================

const MOCK_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'john@example.com',
  password: '$2b$12$hashedPasswordValue',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.LENDER,
  profilePicture: null,
  pushNotificationsEnabled: true,
  reminderEnabled: true,
  language: 'fr',
  timezone: 'Europe/Paris',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  lastLoginAt: null,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;
  let redisService: {
    blacklistToken: jest.Mock;
    isTokenBlacklisted: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = mockDeep<PrismaService>();
    redisService = {
      blacklistToken: jest.fn().mockResolvedValue(undefined),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ===========================================================================
  // GET /users/me — getProfile
  // ===========================================================================

  describe('getProfile', () => {
    it('should return SafeUser without password, with nested settings', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);

      // Act
      const result = await service.getProfile(MOCK_USER.id);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: MOCK_USER.id,
          email: MOCK_USER.email,
          firstName: MOCK_USER.firstName,
          lastName: MOCK_USER.lastName,
          settings: expect.objectContaining({
            pushNotificationsEnabled: true,
            reminderEnabled: true,
            language: 'fr',
            timezone: 'Europe/Paris',
          }),
        }),
      );
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.getProfile('non-existent-id');
        fail('Should have thrown');
      } catch (error) {
        const exception = error as {
          getStatus: () => number;
          getResponse: () => ProblemDetails;
        };
        expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  // ===========================================================================
  // PATCH /users/me — updateProfile
  // ===========================================================================

  describe('updateProfile', () => {
    it('should update firstName and lastName', async () => {
      // Arrange
      const updated = { ...MOCK_USER, firstName: 'Jane', lastName: 'Smith' };
      prisma.user.update.mockResolvedValue(updated);

      // Act
      const result = await service.updateProfile(MOCK_USER.id, {
        firstName: 'Jane',
        lastName: 'Smith',
      });

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: MOCK_USER.id },
        data: { firstName: 'Jane', lastName: 'Smith' },
      });
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should update email if unique', async () => {
      // Arrange
      const updated = { ...MOCK_USER, email: 'new@example.com' };
      prisma.user.update.mockResolvedValue(updated);

      // Act
      const result = await service.updateProfile(MOCK_USER.id, {
        email: 'new@example.com',
      });

      // Assert
      expect(result.email).toBe('new@example.com');
    });

    it('should throw ConflictException (409) if email already taken', async () => {
      // Arrange — Prisma unique constraint violation
      const prismaError = new Error('Unique constraint failed') as Error & {
        code: string;
        meta: { target: string[] };
      };
      prismaError.code = 'P2002';
      prismaError.meta = { target: ['email'] };
      prisma.user.update.mockRejectedValue(prismaError);

      // Act & Assert
      try {
        await service.updateProfile(MOCK_USER.id, {
          email: 'taken@example.com',
        });
        fail('Should have thrown');
      } catch (error) {
        const exception = error as {
          getStatus: () => number;
          getResponse: () => ProblemDetails;
        };
        expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);

        const body = exception.getResponse();
        expect(body.type).toContain('email-already-exists');
      }
    });

    it('should not update if dto is empty', async () => {
      // Arrange
      prisma.user.update.mockResolvedValue(MOCK_USER);

      // Act
      await service.updateProfile(MOCK_USER.id, {});

      // Assert — Prisma est quand même appelé, data sera un objet vide
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: MOCK_USER.id },
        data: {},
      });
    });
  });

  // ===========================================================================
  // DELETE /users/me — deleteAccount
  // ===========================================================================

  describe('deleteAccount', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      bcrypt.compare.mockResolvedValue(true);
    });

    it('should verify password and delete user', async () => {
      // Act
      await service.deleteAccount(MOCK_USER.id, {
        password: 'StrongPass1!',
        confirmationText: 'DELETE MY ACCOUNT',
      });

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('StrongPass1!', MOCK_USER.password);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: MOCK_USER.id },
      });
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      try {
        await service.deleteAccount(MOCK_USER.id, {
          password: 'wrong',
          confirmationText: 'DELETE MY ACCOUNT',
        });
        fail('Should have thrown');
      } catch (error) {
        const exception = error as {
          getStatus: () => number;
          getResponse: () => ProblemDetails;
        };
        expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);

        const body = exception.getResponse();
        expect(body.type).toContain('invalid-current-password');
      }
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.deleteAccount('non-existent-id', {
          password: 'StrongPass1!',
          confirmationText: 'DELETE MY ACCOUNT',
        });
        fail('Should have thrown');
      } catch (error) {
        const exception = error as {
          getStatus: () => number;
        };
        expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  // ===========================================================================
  // PATCH /users/me/password — changePassword
  // ===========================================================================

  describe('changePassword', () => {
    const JTI = 'mock-jti-uuid';
    const TOKEN_EXP = Math.floor(Date.now() / 1000) + 600;

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('$2b$12$newHashedPassword');
    });

    it('should verify current password, hash new one, and update', async () => {
      // Act
      await service.changePassword(
        MOCK_USER.id,
        { currentPassword: 'StrongPass1!', newPassword: 'NewPass1!' },
        JTI,
        TOKEN_EXP,
      );

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('StrongPass1!', MOCK_USER.password);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1!', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: MOCK_USER.id },
        data: { password: '$2b$12$newHashedPassword' },
      });
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      try {
        await service.changePassword(
          MOCK_USER.id,
          { currentPassword: 'wrong', newPassword: 'NewPass1!' },
          JTI,
          TOKEN_EXP,
        );
        fail('Should have thrown');
      } catch (error) {
        const exception = error as {
          getStatus: () => number;
          getResponse: () => ProblemDetails;
        };
        expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);

        const body = exception.getResponse();
        expect(body.type).toContain('invalid-current-password');
      }
    });

    it('should revoke ALL tokens after password change (ADR-004)', async () => {
      // Act
      await service.changePassword(
        MOCK_USER.id,
        { currentPassword: 'StrongPass1!', newPassword: 'NewPass1!' },
        JTI,
        TOKEN_EXP,
      );

      // Assert — Blacklist du jti courant dans Redis
      expect(redisService.blacklistToken).toHaveBeenCalledWith(JTI, expect.any(Number));
      // Assert — Suppression de TOUS les refresh tokens
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER.id },
      });
    });
  });

  // ===========================================================================
  // GET /users/me/settings — getSettings
  // ===========================================================================

  describe('getSettings', () => {
    it('should return user settings fields only', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(MOCK_USER);

      // Act
      const result = await service.getSettings(MOCK_USER.id);

      // Assert — Seuls les champs de préférences, pas le profil complet
      expect(result).toEqual({
        pushNotificationsEnabled: true,
        reminderEnabled: true,
        language: 'fr',
        timezone: 'Europe/Paris',
      });
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.getSettings('non-existent-id');
        fail('Should have thrown');
      } catch (error) {
        const exception = error as { getStatus: () => number };
        expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  // ===========================================================================
  // PATCH /users/me/settings — updateSettings
  // ===========================================================================

  describe('updateSettings', () => {
    it('should update settings fields and return updated settings', async () => {
      // Arrange
      const updated = {
        ...MOCK_USER,
        language: 'en',
        pushNotificationsEnabled: false,
      };
      prisma.user.update.mockResolvedValue(updated);

      // Act
      const result = await service.updateSettings(MOCK_USER.id, {
        language: 'en',
        pushNotificationsEnabled: false,
      });

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: MOCK_USER.id },
        data: { language: 'en', pushNotificationsEnabled: false },
      });
      expect(result).toEqual({
        pushNotificationsEnabled: false,
        reminderEnabled: true,
        language: 'en',
        timezone: 'Europe/Paris',
      });
    });
  });
});
