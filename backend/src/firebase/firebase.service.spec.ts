import { ConfigService } from '@nestjs/config';

import { FirebaseService } from './firebase.service.js';

// =============================================================================
// Fixtures
// =============================================================================

const DEVICE_TOKEN = 'fMI-QUBYRE:APA91bH-test-token';
const TITLE = 'Rappel jour J';
const BODY = 'Vous avez un rappel concernant un objet emprunté.';

// =============================================================================
// Test Suite — Firebase Service
// =============================================================================

describe('FirebaseService', () => {
  let service: FirebaseService;
  let configService: { get: jest.Mock };
  let mockSend: jest.Mock;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    mockSend = jest.fn().mockResolvedValue('message-id-123');

    service = new FirebaseService(configService as unknown as ConfigService);
  });

  /** Helper: simulate a fully initialized service with mocked messaging */
  function initializeWithMockMessaging(): void {
    service['messaging'] = { send: mockSend } as never;
  }

  describe('isAvailable', () => {
    it('should return false when Firebase is not configured', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('should return true when messaging is initialized', () => {
      initializeWithMockMessaging();
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('onModuleInit', () => {
    it('should keep service unavailable when FIREBASE_SERVICE_ACCOUNT_BASE64 is not set', () => {
      service.onModuleInit();
      expect(service.isAvailable()).toBe(false);
    });

    it('should keep service unavailable when invalid base64/JSON is provided', () => {
      configService.get.mockReturnValue('not-valid-json-base64');
      service = new FirebaseService(configService as unknown as ConfigService);

      service.onModuleInit();

      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('sendPushNotification', () => {
    it('should not throw when Firebase is not configured (graceful degradation)', async () => {
      await expect(service.sendPushNotification(DEVICE_TOKEN, TITLE, BODY)).resolves.not.toThrow();
    });

    it('should call messaging.send when Firebase is configured', async () => {
      initializeWithMockMessaging();

      await service.sendPushNotification(DEVICE_TOKEN, TITLE, BODY);

      expect(mockSend).toHaveBeenCalledWith({
        token: DEVICE_TOKEN,
        notification: { title: TITLE, body: BODY },
      });
    });

    it('should call messaging.send with data payload when provided', async () => {
      initializeWithMockMessaging();

      await service.sendPushNotification(DEVICE_TOKEN, TITLE, BODY, {
        loanId: 'loan-123',
      });

      expect(mockSend).toHaveBeenCalledWith({
        token: DEVICE_TOKEN,
        notification: { title: TITLE, body: BODY },
        data: { loanId: 'loan-123' },
      });
    });

    it('should not throw when messaging.send fails (log only)', async () => {
      service['messaging'] = {
        send: jest.fn().mockRejectedValue(new Error('FCM unavailable')),
      } as never;

      await expect(service.sendPushNotification(DEVICE_TOKEN, TITLE, BODY)).resolves.not.toThrow();
    });
  });

  describe('sendToMultipleTokens', () => {
    it('should call send for each token', async () => {
      initializeWithMockMessaging();
      const tokens = ['token-1', 'token-2', 'token-3'];

      await service.sendToMultipleTokens(tokens, TITLE, BODY);

      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should not throw when no tokens provided', async () => {
      await expect(service.sendToMultipleTokens([], TITLE, BODY)).resolves.not.toThrow();
    });
  });
});
