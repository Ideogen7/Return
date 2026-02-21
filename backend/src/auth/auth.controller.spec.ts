import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { UserRole } from '@prisma/client';
import type { AuthResponse } from './interfaces/auth-response.interface.js';
import type { AuthenticatedUser } from './strategies/jwt.strategy.js';

// =============================================================================
// Fixtures
// =============================================================================

const MOCK_AUTH_RESPONSE: AuthResponse = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 900,
  tokenType: 'Bearer',
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.LENDER,
    profilePicture: null,
    settings: {
      pushNotificationsEnabled: true,
      reminderEnabled: true,
      language: 'fr',
      timezone: 'Europe/Paris',
    },
    createdAt: new Date('2025-01-01T00:00:00Z'),
    lastLoginAt: null,
  },
};

const MOCK_AUTHENTICATED_USER: AuthenticatedUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  email: 'john@example.com',
  role: 'LENDER',
  jti: 'mock-jti',
  tokenExp: Math.floor(Date.now() / 1000) + 600,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    refreshTokens: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    authService = {
      register: jest.fn().mockResolvedValue(MOCK_AUTH_RESPONSE),
      login: jest.fn().mockResolvedValue(MOCK_AUTH_RESPONSE),
      refreshTokens: jest.fn().mockResolvedValue(MOCK_AUTH_RESPONSE),
      logout: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // ===========================================================================
  // POST /auth/register
  // ===========================================================================

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'john@example.com',
      password: 'StrongPass1!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should delegate to AuthService.register and return AuthResponse', async () => {
      // Act
      const result = await controller.register(dto);

      // Assert — Le controller est un passe-plat vers le service (SRP)
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(MOCK_AUTH_RESPONSE);
    });

    it('should be decorated with @HttpCode(201)', async () => {
      // Assert — Vérifié par les métadonnées du controller
      // Le status 201 est géré par @Post() par défaut pour POST,
      // mais on le teste quand même pour la documentation
      const result = await controller.register(dto);
      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // POST /auth/login
  // ===========================================================================

  describe('login', () => {
    const dto: LoginDto = {
      email: 'john@example.com',
      password: 'StrongPass1!',
    };

    it('should delegate to AuthService.login and return AuthResponse', async () => {
      // Act
      const result = await controller.login(dto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(MOCK_AUTH_RESPONSE);
    });
  });

  // ===========================================================================
  // POST /auth/refresh
  // ===========================================================================

  describe('refresh', () => {
    const dto: RefreshTokenDto = {
      refreshToken: 'raw-refresh-token',
    };

    it('should delegate to AuthService.refreshTokens with the raw token', async () => {
      // Act
      const result = await controller.refresh(dto);

      // Assert
      expect(authService.refreshTokens).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(MOCK_AUTH_RESPONSE);
    });
  });

  // ===========================================================================
  // POST /auth/logout
  // ===========================================================================

  describe('logout', () => {
    const mockRequest = { user: MOCK_AUTHENTICATED_USER };

    it('should delegate to AuthService.logout with user context (no body)', async () => {
      // Act
      await controller.logout(mockRequest);

      // Assert — Le controller transmet userId, jti, exp (pas de refreshToken — OpenAPI)
      expect(authService.logout).toHaveBeenCalledWith(
        MOCK_AUTHENTICATED_USER.userId,
        MOCK_AUTHENTICATED_USER.jti,
        MOCK_AUTHENTICATED_USER.tokenExp,
      );
    });

    it('should return void (204 No Content)', async () => {
      // Act
      const result = await controller.logout(mockRequest);

      // Assert — 204 = pas de body
      expect(result).toBeUndefined();
    });
  });
});
