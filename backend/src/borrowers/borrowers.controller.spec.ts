import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BorrowersController } from './borrowers.controller.js';
import { BorrowersService } from './borrowers.service.js';
import { LoansService } from '../loans/loans.service.js';
import type {
  BorrowerResponse,
  BorrowerStatistics,
  PaginatedBorrowersResponse,
} from './interfaces/borrower-response.interface.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

// =============================================================================
// Fixtures
// =============================================================================

const LENDER_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const BORROWER_ID = '770e8400-e29b-41d4-a716-446655440000';

const MOCK_AUTH_USER: AuthenticatedUser = {
  userId: LENDER_USER_ID,
  email: 'lender@example.com',
  role: 'LENDER',
  jti: 'jti-123',
  tokenExp: Math.floor(Date.now() / 1000) + 900,
};

const MOCK_BORROWER_RESPONSE: BorrowerResponse = {
  id: BORROWER_ID,
  firstName: 'Marie',
  lastName: 'Dupont',
  email: 'marie.dupont@example.com',
  phoneNumber: '+33612345678',
  userId: null,
  statistics: {
    totalLoans: 0,
    returnedOnTime: 0,
    returnedLate: 0,
    notReturned: 0,
    averageReturnDelay: null,
    trustScore: 0,
  },
};

const MOCK_PAGINATED: PaginatedBorrowersResponse = {
  data: [MOCK_BORROWER_RESPONSE],
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

describe('BorrowersController', () => {
  let controller: BorrowersController;
  let service: DeepMockProxy<BorrowersService>;

  beforeEach(async () => {
    service = mockDeep<BorrowersService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BorrowersController],
      providers: [
        { provide: BorrowersService, useValue: service },
        { provide: LoansService, useValue: mockDeep<LoansService>() },
      ],
    }).compile();

    controller = module.get<BorrowersController>(BorrowersController);
  });

  // ===========================================================================
  // POST /v1/borrowers
  // ===========================================================================

  describe('create', () => {
    it('should create a borrower and set the Location header', async () => {
      service.create.mockResolvedValue(MOCK_BORROWER_RESPONSE);

      const mockRes = {
        setHeader: jest.fn(),
      };

      const mockReq = {
        user: MOCK_AUTH_USER,
        protocol: 'http',
        headers: { host: 'localhost:3000' },
      };

      const result = await controller.create(
        mockReq as never,
        {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie.dupont@example.com',
          phoneNumber: '+33612345678',
        },
        mockRes as never,
      );

      expect(result).toEqual(MOCK_BORROWER_RESPONSE);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Location',
        `http://localhost:3000/v1/borrowers/${BORROWER_ID}`,
      );
      expect(service.create).toHaveBeenCalledWith(LENDER_USER_ID, {
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@example.com',
        phoneNumber: '+33612345678',
      });
    });
  });

  // ===========================================================================
  // GET /v1/borrowers
  // ===========================================================================

  describe('findAll', () => {
    it('should return paginated borrowers', async () => {
      service.findAll.mockResolvedValue(MOCK_PAGINATED);

      const result = await controller.findAll({ user: MOCK_AUTH_USER }, {
        sortBy: undefined,
        sortOrder: undefined,
        page: undefined,
        limit: undefined,
      } as never);

      expect(result).toEqual(MOCK_PAGINATED);
      expect(service.findAll).toHaveBeenCalledWith(LENDER_USER_ID, {
        sortBy: 'firstName',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });
    });
  });

  // ===========================================================================
  // GET /v1/borrowers/:borrowerId/statistics
  // ===========================================================================

  describe('getStatistics', () => {
    it('should return borrower statistics', async () => {
      const mockStats: BorrowerStatistics = {
        totalLoans: 5,
        returnedOnTime: 3,
        returnedLate: 1,
        notReturned: 1,
        averageReturnDelay: 2,
        trustScore: 70,
      };
      service.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics({ user: MOCK_AUTH_USER }, BORROWER_ID);

      expect(result).toEqual(mockStats);
      expect(service.getStatistics).toHaveBeenCalledWith(BORROWER_ID, LENDER_USER_ID);
    });
  });

  // ===========================================================================
  // GET /v1/borrowers/:borrowerId
  // ===========================================================================

  describe('findById', () => {
    it('should return the borrower', async () => {
      service.findById.mockResolvedValue(MOCK_BORROWER_RESPONSE);

      const result = await controller.findById({ user: MOCK_AUTH_USER }, BORROWER_ID);

      expect(result).toEqual(MOCK_BORROWER_RESPONSE);
      expect(service.findById).toHaveBeenCalledWith(BORROWER_ID, LENDER_USER_ID);
    });
  });

  // ===========================================================================
  // PATCH /v1/borrowers/:borrowerId
  // ===========================================================================

  describe('update', () => {
    it('should update and return the borrower', async () => {
      const updated = { ...MOCK_BORROWER_RESPONSE, firstName: 'Marie-Claire' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update({ user: MOCK_AUTH_USER }, BORROWER_ID, {
        firstName: 'Marie-Claire',
      });

      expect(result.firstName).toBe('Marie-Claire');
      expect(service.update).toHaveBeenCalledWith(BORROWER_ID, LENDER_USER_ID, {
        firstName: 'Marie-Claire',
      });
    });
  });

  // ===========================================================================
  // DELETE /v1/borrowers/:borrowerId
  // ===========================================================================

  describe('delete', () => {
    it('should delete the borrower (204)', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete({ user: MOCK_AUTH_USER }, BORROWER_ID);

      expect(service.delete).toHaveBeenCalledWith(BORROWER_ID, LENDER_USER_ID);
    });
  });
});
