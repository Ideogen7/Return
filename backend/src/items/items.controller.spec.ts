import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import type { ItemResponse, PaginatedItemsResponse } from './interfaces/item-response.interface.js';
import type { PhotoResponse } from './interfaces/photo-response.interface.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

// =============================================================================
// Fixtures
// =============================================================================

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const ITEM_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PHOTO_ID = 'pppppppp-pppp-pppp-pppp-pppppppppppp';

const MOCK_AUTH_USER: AuthenticatedUser = {
  userId: USER_ID,
  email: 'lender@example.com',
  role: 'LENDER',
  jti: 'jti-123',
  tokenExp: Math.floor(Date.now() / 1000) + 900,
};

const MOCK_ITEM_RESPONSE: ItemResponse = {
  id: ITEM_ID,
  name: 'Perceuse Bosch',
  description: 'Perceuse sans fil 18V',
  category: 'TOOLS',
  estimatedValue: 129.99,
  photos: [],
  createdAt: '2026-02-08T14:00:00.000Z',
};

const MOCK_PHOTO_RESPONSE: PhotoResponse = {
  id: PHOTO_ID,
  url: 'http://localhost:3000/uploads/items/test/photo1.jpg',
  thumbnailUrl: null,
  uploadedAt: '2026-02-08T14:05:00.000Z',
};

const MOCK_PAGINATED: PaginatedItemsResponse = {
  data: [MOCK_ITEM_RESPONSE],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 1,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

// =============================================================================
// Test Suite
// =============================================================================

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: DeepMockProxy<ItemsService>;

  beforeEach(async () => {
    service = mockDeep<ItemsService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [{ provide: ItemsService, useValue: service }],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
  });

  // ===========================================================================
  // POST /v1/items
  // ===========================================================================

  describe('create', () => {
    it('should create an item and set Location header', async () => {
      service.create.mockResolvedValue(MOCK_ITEM_RESPONSE);

      const mockRes = { setHeader: jest.fn() };
      const mockReq = {
        user: MOCK_AUTH_USER,
        protocol: 'http',
        headers: { host: 'localhost:3000' },
      };

      const result = await controller.create(
        mockReq as never,
        {
          name: 'Perceuse Bosch',
          description: 'Perceuse sans fil 18V',
          category: 'TOOLS' as never,
          estimatedValue: 129.99,
        },
        mockRes as never,
      );

      expect(result).toEqual(MOCK_ITEM_RESPONSE);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Location',
        `http://localhost:3000/v1/items/${ITEM_ID}`,
      );
      expect(service.create).toHaveBeenCalledWith(USER_ID, {
        name: 'Perceuse Bosch',
        description: 'Perceuse sans fil 18V',
        category: 'TOOLS',
        estimatedValue: 129.99,
      });
    });
  });

  // ===========================================================================
  // GET /v1/items
  // ===========================================================================

  describe('findAll', () => {
    it('should return paginated items with default query', async () => {
      service.findAll.mockResolvedValue(MOCK_PAGINATED);

      const result = await controller.findAll({ user: MOCK_AUTH_USER }, {
        page: undefined,
        limit: undefined,
      } as never);

      expect(result).toEqual(MOCK_PAGINATED);
      expect(service.findAll).toHaveBeenCalledWith(USER_ID, {
        category: undefined,
        available: undefined,
        page: 1,
        limit: 20,
      });
    });
  });

  // ===========================================================================
  // GET /v1/items/:itemId
  // ===========================================================================

  describe('findById', () => {
    it('should return the item', async () => {
      service.findById.mockResolvedValue(MOCK_ITEM_RESPONSE);

      const result = await controller.findById({ user: MOCK_AUTH_USER }, ITEM_ID);

      expect(result).toEqual(MOCK_ITEM_RESPONSE);
      expect(service.findById).toHaveBeenCalledWith(ITEM_ID, USER_ID);
    });
  });

  // ===========================================================================
  // PATCH /v1/items/:itemId
  // ===========================================================================

  describe('update', () => {
    it('should update and return the item', async () => {
      const updated = { ...MOCK_ITEM_RESPONSE, name: 'Perceuse Bosch Pro' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update({ user: MOCK_AUTH_USER }, ITEM_ID, {
        name: 'Perceuse Bosch Pro',
      });

      expect(result.name).toBe('Perceuse Bosch Pro');
      expect(service.update).toHaveBeenCalledWith(ITEM_ID, USER_ID, {
        name: 'Perceuse Bosch Pro',
      });
    });
  });

  // ===========================================================================
  // DELETE /v1/items/:itemId
  // ===========================================================================

  describe('delete', () => {
    it('should delete the item (204)', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete({ user: MOCK_AUTH_USER }, ITEM_ID);

      expect(service.delete).toHaveBeenCalledWith(ITEM_ID, USER_ID);
    });
  });

  // ===========================================================================
  // POST /v1/items/:itemId/photos
  // ===========================================================================

  describe('addPhoto', () => {
    it('should upload a photo and set Location header', async () => {
      service.addPhoto.mockResolvedValue(MOCK_PHOTO_RESPONSE);

      const mockFile = {
        buffer: Buffer.from('fake-image'),
        originalname: 'photo.jpg',
      };
      const mockRes = { setHeader: jest.fn() };
      const mockReq = {
        user: MOCK_AUTH_USER,
        protocol: 'http',
        headers: { host: 'localhost:3000' },
      };

      const result = await controller.addPhoto(
        mockReq as never,
        ITEM_ID,
        mockFile as never,
        mockRes as never,
      );

      expect(result).toEqual(MOCK_PHOTO_RESPONSE);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Location',
        `http://localhost:3000/v1/items/${ITEM_ID}/photos/${PHOTO_ID}`,
      );
      expect(service.addPhoto).toHaveBeenCalledWith(ITEM_ID, USER_ID, mockFile.buffer, 'photo.jpg');
    });
  });

  // ===========================================================================
  // DELETE /v1/items/:itemId/photos/:photoId
  // ===========================================================================

  describe('deletePhoto', () => {
    it('should call service.deletePhoto with correct params (204)', async () => {
      service.deletePhoto.mockResolvedValue(undefined);

      await controller.deletePhoto({ user: MOCK_AUTH_USER }, ITEM_ID, PHOTO_ID);

      expect(service.deletePhoto).toHaveBeenCalledWith(ITEM_ID, PHOTO_ID, USER_ID);
    });
  });
});
