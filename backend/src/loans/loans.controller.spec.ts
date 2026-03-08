import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { LoansController } from './loans.controller.js';
import { LoansService } from './loans.service.js';
import { LoanStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import type { LoanResponse, PaginatedLoansResponse } from './interfaces/loan-response.interface.js';

// =============================================================================
// Fixtures
// =============================================================================

const LENDER_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const LOAN_ID = '110e8400-e29b-41d4-a716-446655440000';

const MOCK_AUTH_USER: AuthenticatedUser = {
  userId: LENDER_USER_ID,
  email: 'lender@example.com',
  role: 'LENDER',
  jti: 'jti-123',
  tokenExp: Math.floor(Date.now() / 1000) + 900,
};

const MOCK_LOAN_RESPONSE: LoanResponse = {
  id: LOAN_ID,
  item: {
    id: '220e8400-e29b-41d4-a716-446655440000',
    name: 'Perceuse',
    description: 'Perceuse Bosch',
    category: 'TOOLS',
    estimatedValue: 150,
    photos: [],
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  lender: {
    id: LENDER_USER_ID,
    firstName: 'John',
    lastName: 'Doe',
    profilePicture: null,
  },
  borrower: {
    id: '330e8400-e29b-41d4-a716-446655440000',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie@example.com',
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
  },
  returnDate: '2025-06-01',
  status: LoanStatus.PENDING_CONFIRMATION,
  confirmationDate: null,
  returnedDate: null,
  notes: 'Test loan',
  contestReason: null,
  createdAt: '2025-02-27T12:00:00.000Z',
  updatedAt: '2025-02-27T12:00:00.000Z',
};

const MOCK_PAGINATED: PaginatedLoansResponse = {
  data: [MOCK_LOAN_RESPONSE],
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

describe('LoansController', () => {
  let controller: LoansController;
  let service: DeepMockProxy<LoansService>;

  beforeEach(async () => {
    service = mockDeep<LoansService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansController],
      providers: [{ provide: LoansService, useValue: service }],
    }).compile();

    controller = module.get<LoansController>(LoansController);
  });

  // ===========================================================================
  // POST /v1/loans
  // ===========================================================================

  describe('create', () => {
    it('should create a loan and set Location header', async () => {
      service.create.mockResolvedValue(MOCK_LOAN_RESPONSE);

      const mockRes = { setHeader: jest.fn() };
      const mockReq = {
        user: MOCK_AUTH_USER,
        protocol: 'http',
        headers: { host: 'localhost:3000' },
      };

      const result = await controller.create(
        { item: 'item-id', borrowerId: 'borrower-id', returnDate: '2025-06-01' },
        mockReq as never,
        mockRes as never,
      );

      expect(result).toEqual(MOCK_LOAN_RESPONSE);
      expect(service.create).toHaveBeenCalledWith(LENDER_USER_ID, {
        item: 'item-id',
        borrowerId: 'borrower-id',
        returnDate: '2025-06-01',
      });
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Location',
        `http://localhost:3000/v1/loans/${LOAN_ID}`,
      );
    });
  });

  // ===========================================================================
  // GET /v1/loans
  // ===========================================================================

  describe('findAll', () => {
    it('should return paginated loans', async () => {
      service.findAll.mockResolvedValue(MOCK_PAGINATED);

      const mockReq = { user: MOCK_AUTH_USER };
      const result = await controller.findAll({}, mockReq as never);

      expect(result).toEqual(MOCK_PAGINATED);
      expect(service.findAll).toHaveBeenCalledWith(LENDER_USER_ID, expect.any(Object));
    });
  });

  // ===========================================================================
  // GET /v1/loans/:loanId
  // ===========================================================================

  describe('findById', () => {
    it('should return a single loan', async () => {
      service.findById.mockResolvedValue(MOCK_LOAN_RESPONSE);
      const mockReq = { user: MOCK_AUTH_USER };

      const result = await controller.findById(LOAN_ID, mockReq as never);

      expect(result).toEqual(MOCK_LOAN_RESPONSE);
      expect(service.findById).toHaveBeenCalledWith(LOAN_ID, LENDER_USER_ID);
    });
  });

  // ===========================================================================
  // PATCH /v1/loans/:loanId
  // ===========================================================================

  describe('update', () => {
    it('should update and return the loan', async () => {
      service.update.mockResolvedValue({ ...MOCK_LOAN_RESPONSE, notes: 'Updated' });
      const mockReq = { user: MOCK_AUTH_USER };

      const result = await controller.update(LOAN_ID, { notes: 'Updated' }, mockReq as never);

      expect(result.notes).toBe('Updated');
      expect(service.update).toHaveBeenCalledWith(LOAN_ID, LENDER_USER_ID, { notes: 'Updated' });
    });
  });

  // ===========================================================================
  // DELETE /v1/loans/:loanId
  // ===========================================================================

  describe('delete', () => {
    it('should call service.delete', async () => {
      service.delete.mockResolvedValue(undefined);
      const mockReq = { user: MOCK_AUTH_USER };

      await controller.delete(LOAN_ID, mockReq as never);

      expect(service.delete).toHaveBeenCalledWith(LOAN_ID, LENDER_USER_ID);
    });
  });

  // ===========================================================================
  // PATCH /v1/loans/:loanId/status
  // ===========================================================================

  describe('updateStatus', () => {
    it('should update status and return the loan', async () => {
      service.updateStatus.mockResolvedValue({
        ...MOCK_LOAN_RESPONSE,
        status: LoanStatus.ACTIVE,
      });
      const mockReq = { user: MOCK_AUTH_USER };

      const result = await controller.updateStatus(
        LOAN_ID,
        { status: LoanStatus.ACTIVE },
        mockReq as never,
      );

      expect(result.status).toBe(LoanStatus.ACTIVE);
      expect(service.updateStatus).toHaveBeenCalledWith(
        LOAN_ID,
        LENDER_USER_ID,
        LoanStatus.ACTIVE,
        undefined,
      );
    });
  });

  // ===========================================================================
  // POST /v1/loans/:loanId/confirm
  // ===========================================================================

  describe('confirm', () => {
    it('should confirm and return the loan', async () => {
      service.confirm.mockResolvedValue({
        ...MOCK_LOAN_RESPONSE,
        status: LoanStatus.ACTIVE,
      });
      const mockReq = { user: MOCK_AUTH_USER };

      const result = await controller.confirm(LOAN_ID, mockReq as never);

      expect(result.status).toBe(LoanStatus.ACTIVE);
      expect(service.confirm).toHaveBeenCalledWith(LOAN_ID, LENDER_USER_ID);
    });
  });

  // ===========================================================================
  // POST /v1/loans/:loanId/contest
  // ===========================================================================

  describe('contest', () => {
    it('should contest and return the loan', async () => {
      service.contest.mockResolvedValue({
        ...MOCK_LOAN_RESPONSE,
        status: LoanStatus.CONTESTED,
      });
      const mockReq = { user: MOCK_AUTH_USER };

      const result = await controller.contest(
        LOAN_ID,
        { reason: 'This is not a valid loan because I never lent this item.' },
        mockReq as never,
      );

      expect(result.status).toBe(LoanStatus.CONTESTED);
      expect(service.contest).toHaveBeenCalledWith(LOAN_ID, LENDER_USER_ID, {
        reason: 'This is not a valid loan because I never lent this item.',
      });
    });
  });
});
