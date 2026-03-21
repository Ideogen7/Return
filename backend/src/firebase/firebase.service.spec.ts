import { ConfigService } from '@nestjs/config';

import { FirebaseService } from './firebase.service.js';

// =============================================================================
// Fixtures
// =============================================================================

const TITLE = 'Rappel jour J';
const BODY = 'Vous avez un rappel concernant un objet emprunté.';

const TOKEN_1 = 'token-aaaaaa-valid-1';
const TOKEN_2 = 'token-bbbbbb-valid-2';
const TOKEN_3 = 'token-cccccc-invalid-3';

// =============================================================================
// Test Suite — Firebase Service
// =============================================================================

describe('FirebaseService', () => {
  let service: FirebaseService;
  let configService: { get: jest.Mock };
  let mockSendEachForMulticast: jest.Mock;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    mockSendEachForMulticast = jest.fn().mockResolvedValue({
      successCount: 0,
      failureCount: 0,
      responses: [],
    });

    service = new FirebaseService(configService as unknown as ConfigService);
  });

  /** Helper: simulate a fully initialized service with mocked messaging */
  function initializeWithMockMessaging(): void {
    service['messaging'] = {
      sendEachForMulticast: mockSendEachForMulticast,
    } as never;
  }

  /** Helper: build a successful multicast response for N tokens */
  function buildSuccessResponse(count: number) {
    return {
      successCount: count,
      failureCount: 0,
      responses: Array.from({ length: count }, () => ({ success: true, error: undefined })),
    };
  }

  /** Helper: build a multicast response with one invalid token at a given index */
  function buildResponseWithInvalidToken(
    tokens: string[],
    invalidIndex: number,
    errorCode: string,
  ) {
    return {
      successCount: tokens.length - 1,
      failureCount: 1,
      responses: tokens.map((_, idx) =>
        idx === invalidIndex
          ? { success: false, error: { code: errorCode, message: 'Token not registered' } }
          : { success: true, error: undefined },
      ),
    };
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

  describe('sendToMultipleTokens', () => {
    it('should call sendEachForMulticast once with all tokens (not one send per token)', async () => {
      initializeWithMockMessaging();
      const tokens = [TOKEN_1, TOKEN_2, TOKEN_3];
      mockSendEachForMulticast.mockResolvedValue(buildSuccessResponse(3));

      await service.sendToMultipleTokens(tokens, TITLE, BODY);

      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        tokens,
        notification: { title: TITLE, body: BODY },
      });
    });

    it('should return empty array when all tokens are valid', async () => {
      initializeWithMockMessaging();
      const tokens = [TOKEN_1, TOKEN_2];
      mockSendEachForMulticast.mockResolvedValue(buildSuccessResponse(2));

      const result = await service.sendToMultipleTokens(tokens, TITLE, BODY);

      expect(result).toEqual([]);
    });

    it('should return invalid tokens when sendEachForMulticast reports messaging/registration-token-not-registered', async () => {
      initializeWithMockMessaging();
      const tokens = [TOKEN_1, TOKEN_2, TOKEN_3];
      mockSendEachForMulticast.mockResolvedValue(
        buildResponseWithInvalidToken(tokens, 2, 'messaging/registration-token-not-registered'),
      );

      const result = await service.sendToMultipleTokens(tokens, TITLE, BODY);

      expect(result).toEqual([TOKEN_3]);
    });

    it('should return invalid tokens when sendEachForMulticast reports messaging/invalid-registration-token', async () => {
      initializeWithMockMessaging();
      const tokens = [TOKEN_1, TOKEN_2];
      mockSendEachForMulticast.mockResolvedValue(
        buildResponseWithInvalidToken(tokens, 0, 'messaging/invalid-registration-token'),
      );

      const result = await service.sendToMultipleTokens(tokens, TITLE, BODY);

      expect(result).toEqual([TOKEN_1]);
    });

    it('should not include tokens that failed with a non-invalid error code', async () => {
      initializeWithMockMessaging();
      const tokens = [TOKEN_1, TOKEN_2];
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true, error: undefined },
          { success: false, error: { code: 'messaging/internal-error', message: 'Server error' } },
        ],
      });

      const result = await service.sendToMultipleTokens(tokens, TITLE, BODY);

      // transient error: token should NOT be cleaned up
      expect(result).toEqual([]);
    });

    it('should return empty array when messaging is not initialized', async () => {
      // messaging stays null (no initializeWithMockMessaging)
      const result = await service.sendToMultipleTokens([TOKEN_1], TITLE, BODY);

      expect(result).toEqual([]);
    });

    it('should return empty array when tokens list is empty', async () => {
      initializeWithMockMessaging();

      const result = await service.sendToMultipleTokens([], TITLE, BODY);

      expect(result).toEqual([]);
      expect(mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it('should pass data payload to sendEachForMulticast when provided', async () => {
      initializeWithMockMessaging();
      const tokens = [TOKEN_1];
      mockSendEachForMulticast.mockResolvedValue(buildSuccessResponse(1));

      await service.sendToMultipleTokens(tokens, TITLE, BODY, { loanId: 'loan-42' });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        tokens,
        notification: { title: TITLE, body: BODY },
        data: { loanId: 'loan-42' },
      });
    });

    it('should return empty array when sendEachForMulticast throws', async () => {
      initializeWithMockMessaging();
      mockSendEachForMulticast.mockRejectedValue(new Error('Network error'));

      const result = await service.sendToMultipleTokens([TOKEN_1], TITLE, BODY);

      expect(result).toEqual([]);
    });

    it('should split 501 tokens into two batches and call sendEachForMulticast twice', async () => {
      initializeWithMockMessaging();
      // 501 tokens: first batch of 500, second batch of 1
      const tokens = Array.from({ length: 501 }, (_, i) => `token-${i}`);
      mockSendEachForMulticast
        .mockResolvedValueOnce(buildSuccessResponse(500))
        .mockResolvedValueOnce(buildSuccessResponse(1));

      await service.sendToMultipleTokens(tokens, TITLE, BODY);

      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(2);
      expect(mockSendEachForMulticast).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ tokens: tokens.slice(0, 500) }),
      );
      expect(mockSendEachForMulticast).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ tokens: tokens.slice(500) }),
      );
    });
  });
});
