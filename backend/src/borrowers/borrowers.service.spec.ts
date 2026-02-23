import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma/prisma.service.js';
import { BorrowersService } from './borrowers.service.js';
import type { ProblemDetails } from '../common/exceptions/problem-details.exception.js';
import type { Borrower } from '@prisma/client';

// =============================================================================
// Fixtures
// =============================================================================

const LENDER_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440000';
const BORROWER_ID = '770e8400-e29b-41d4-a716-446655440000';

const MOCK_BORROWER: Borrower = {
  id: BORROWER_ID,
  firstName: 'Marie',
  lastName: 'Dupont',
  email: 'marie.dupont@example.com',
  phoneNumber: '+33612345678',
  userId: null,
  lenderUserId: LENDER_USER_ID,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

const MOCK_BORROWER_2: Borrower = {
  id: '880e8400-e29b-41d4-a716-446655440000',
  firstName: 'Jean',
  lastName: 'Martin',
  email: 'jean.martin@example.com',
  phoneNumber: null,
  userId: null,
  lenderUserId: LENDER_USER_ID,
  createdAt: new Date('2025-01-02T00:00:00Z'),
  updatedAt: new Date('2025-01-02T00:00:00Z'),
};

// =============================================================================
// Test Suite
// =============================================================================

describe('BorrowersService', () => {
  let service: BorrowersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BorrowersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<BorrowersService>(BorrowersService);
  });

  // ===========================================================================
  // CREATE
  // ===========================================================================

  describe('create', () => {
    it('should create a borrower and return it with default statistics', async () => {
      prisma.borrower.create.mockResolvedValue(MOCK_BORROWER);

      const result = await service.create(LENDER_USER_ID, {
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@example.com',
        phoneNumber: '+33612345678',
      });

      expect(result).toEqual({
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
          trustScore: 100,
        },
      });

      expect(prisma.borrower.create).toHaveBeenCalledWith({
        data: {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie.dupont@example.com',
          phoneNumber: '+33612345678',
          lenderUserId: LENDER_USER_ID,
        },
      });
    });

    it('should throw 409 Conflict if borrower email already exists for this lender', async () => {
      const prismaError = new Error('Unique constraint failed') as Error & {
        code: string;
        meta?: { target?: string[] };
      };
      prismaError.code = 'P2002';
      prismaError.meta = { target: ['lender_user_id', 'email'] };
      prisma.borrower.create.mockRejectedValue(prismaError);

      try {
        await service.create(LENDER_USER_ID, {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie.dupont@example.com',
        });
        fail('Expected ConflictException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.CONFLICT);
        expect(body.type).toBe('https://api.return.app/errors/borrower-already-exists');
        expect(body.title).toBe('Borrower Already Exists');
        expect(body.detail).toBe('A contact with this email already exists in your list.');
      }
    });
  });

  // ===========================================================================
  // FIND ALL (paginated)
  // ===========================================================================

  describe('findAll', () => {
    it('should return paginated borrowers with default statistics', async () => {
      prisma.borrower.findMany.mockResolvedValue([MOCK_BORROWER, MOCK_BORROWER_2]);
      prisma.borrower.count.mockResolvedValue(2);

      const result = await service.findAll(LENDER_USER_ID, {
        sortBy: 'firstName',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].firstName).toBe('Marie');
      expect(result.data[0].statistics).toEqual({
        totalLoans: 0,
        returnedOnTime: 0,
        returnedLate: 0,
        notReturned: 0,
        averageReturnDelay: null,
        trustScore: 100,
      });
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(prisma.borrower.findMany).toHaveBeenCalledWith({
        where: { lenderUserId: LENDER_USER_ID },
        orderBy: { firstName: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle second page correctly', async () => {
      prisma.borrower.findMany.mockResolvedValue([MOCK_BORROWER_2]);
      prisma.borrower.count.mockResolvedValue(21);

      const result = await service.findAll(LENDER_USER_ID, {
        sortBy: 'lastName',
        sortOrder: 'desc',
        page: 2,
        limit: 20,
      });

      expect(result.pagination).toEqual({
        currentPage: 2,
        totalPages: 2,
        totalItems: 21,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: true,
      });

      expect(prisma.borrower.findMany).toHaveBeenCalledWith({
        where: { lenderUserId: LENDER_USER_ID },
        orderBy: { lastName: 'desc' },
        skip: 20,
        take: 20,
      });
    });

    it('should return empty data when no borrowers exist', async () => {
      prisma.borrower.findMany.mockResolvedValue([]);
      prisma.borrower.count.mockResolvedValue(0);

      const result = await service.findAll(LENDER_USER_ID, {
        sortBy: 'firstName',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // ===========================================================================
  // FIND BY ID
  // ===========================================================================

  describe('findById', () => {
    it('should return the borrower with default statistics', async () => {
      prisma.borrower.findUnique.mockResolvedValue(MOCK_BORROWER);

      const result = await service.findById(BORROWER_ID, LENDER_USER_ID);

      expect(result.id).toBe(BORROWER_ID);
      expect(result.firstName).toBe('Marie');
      expect(result.statistics.totalLoans).toBe(0);
    });

    it('should throw 404 if borrower does not exist', async () => {
      prisma.borrower.findUnique.mockResolvedValue(null);

      try {
        await service.findById('nonexistent-id', LENDER_USER_ID);
        fail('Expected NotFoundException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
        expect(body.type).toContain('not-found');
      }
    });

    it('should throw 403 if borrower belongs to another user', async () => {
      prisma.borrower.findUnique.mockResolvedValue(MOCK_BORROWER);

      try {
        await service.findById(BORROWER_ID, OTHER_USER_ID);
        fail('Expected ForbiddenException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.FORBIDDEN);
        expect(body.type).toContain('forbidden');
      }
    });
  });

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  describe('update', () => {
    it('should update and return the borrower', async () => {
      prisma.borrower.findUnique.mockResolvedValue(MOCK_BORROWER);
      const updatedBorrower = { ...MOCK_BORROWER, firstName: 'Marie-Claire' };
      prisma.borrower.update.mockResolvedValue(updatedBorrower);

      const result = await service.update(BORROWER_ID, LENDER_USER_ID, {
        firstName: 'Marie-Claire',
      });

      expect(result.firstName).toBe('Marie-Claire');
      expect(prisma.borrower.update).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
        data: { firstName: 'Marie-Claire' },
      });
    });

    it('should throw 404 if borrower does not exist', async () => {
      prisma.borrower.findUnique.mockResolvedValue(null);

      try {
        await service.update('nonexistent-id', LENDER_USER_ID, { firstName: 'X' });
        fail('Expected NotFoundException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw 403 if borrower belongs to another user', async () => {
      prisma.borrower.findUnique.mockResolvedValue(MOCK_BORROWER);

      try {
        await service.update(BORROWER_ID, OTHER_USER_ID, { firstName: 'X' });
        fail('Expected ForbiddenException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.FORBIDDEN);
      }
    });

    it('should throw 409 if updated email already exists for this lender', async () => {
      prisma.borrower.findUnique.mockResolvedValue(MOCK_BORROWER);
      const prismaError = new Error('Unique constraint failed') as Error & {
        code: string;
        meta?: { target?: string[] };
      };
      prismaError.code = 'P2002';
      prismaError.meta = { target: ['lender_user_id', 'email'] };
      prisma.borrower.update.mockRejectedValue(prismaError);

      try {
        await service.update(BORROWER_ID, LENDER_USER_ID, {
          email: 'jean.martin@example.com',
        });
        fail('Expected ConflictException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.CONFLICT);
        expect(body.type).toBe('https://api.return.app/errors/borrower-already-exists');
      }
    });
  });

  // ===========================================================================
  // DELETE
  // ===========================================================================

  describe('delete', () => {
    it('should delete the borrower (204 scenario)', async () => {
      prisma.borrower.findUnique.mockResolvedValue(MOCK_BORROWER);
      prisma.borrower.delete.mockResolvedValue(MOCK_BORROWER);

      await service.delete(BORROWER_ID, LENDER_USER_ID);

      expect(prisma.borrower.delete).toHaveBeenCalledWith({
        where: { id: BORROWER_ID },
      });
    });

    it('should throw 404 if borrower does not exist', async () => {
      prisma.borrower.findUnique.mockResolvedValue(null);

      try {
        await service.delete('nonexistent-id', LENDER_USER_ID);
        fail('Expected NotFoundException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw 403 if borrower belongs to another user', async () => {
      prisma.borrower.findUnique.mockResolvedValue(MOCK_BORROWER);

      try {
        await service.delete(BORROWER_ID, OTHER_USER_ID);
        fail('Expected ForbiddenException');
      } catch (error: unknown) {
        const body = (error as { getResponse: () => ProblemDetails }).getResponse();
        expect(body.status).toBe(HttpStatus.FORBIDDEN);
      }
    });

    // NOTE: 409 active-loans-exist test will be added when Loans module is implemented.
    // For Sprint 2, borrowers have no active loans (no Loan model yet).
  });
});
