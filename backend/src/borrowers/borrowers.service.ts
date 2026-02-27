import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/problem-details.exception.js';
import {
  DEFAULT_BORROWER_STATISTICS,
  type BorrowerResponse,
  type BorrowerStatistics,
  type PaginatedBorrowersResponse,
} from './interfaces/borrower-response.interface.js';
import type { CreateBorrowerDto } from './dto/create-borrower.dto.js';
import type { UpdateBorrowerDto } from './dto/update-borrower.dto.js';
import type { Borrower, LoanStatus } from '@prisma/client';

// =============================================================================
// BorrowersService — Logique métier du module Borrowers
// =============================================================================

/** Statuses where a loan is considered "active" (borrower cannot be deleted) */
const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  'PENDING_CONFIRMATION',
  'ACTIVE',
  'ACTIVE_BY_DEFAULT',
  'AWAITING_RETURN',
] as LoanStatus[];

@Injectable()
export class BorrowersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(lenderUserId: string, dto: CreateBorrowerDto): Promise<BorrowerResponse> {
    try {
      const borrower = await this.prisma.borrower.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phoneNumber: dto.phoneNumber ?? null,
          lenderUserId,
        },
      });

      return this.toBorrowerResponse(borrower);
    } catch (error: unknown) {
      this.handleUniqueConstraintError(error, '/v1/borrowers');
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // FIND ALL (paginated)
  // ---------------------------------------------------------------------------

  async findAll(
    lenderUserId: string,
    query: { sortBy: string; sortOrder: string; page: number; limit: number },
  ): Promise<PaginatedBorrowersResponse> {
    const { sortBy, sortOrder, page, limit } = query;
    const skip = (page - 1) * limit;

    const [borrowers, totalItems] = await Promise.all([
      this.prisma.borrower.findMany({
        where: { lenderUserId },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.borrower.count({ where: { lenderUserId } }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
      data: borrowers.map((b) => this.toBorrowerResponse(b)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // GET STATISTICS
  // ---------------------------------------------------------------------------

  async getStatistics(borrowerId: string, lenderUserId: string): Promise<BorrowerStatistics> {
    const borrower = await this.findBorrowerOrFail(borrowerId);
    this.assertOwnership(borrower, lenderUserId, `/v1/borrowers/${borrowerId}/statistics`);

    return {
      ...DEFAULT_BORROWER_STATISTICS,
      trustScore: borrower.trustScore,
      totalLoans: borrower.totalLoans,
    };
  }

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------

  async findById(borrowerId: string, lenderUserId: string): Promise<BorrowerResponse> {
    const borrower = await this.findBorrowerOrFail(borrowerId);
    this.assertOwnership(borrower, lenderUserId, `/v1/borrowers/${borrowerId}`);

    return this.toBorrowerResponse(borrower);
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    borrowerId: string,
    lenderUserId: string,
    dto: UpdateBorrowerDto,
  ): Promise<BorrowerResponse> {
    const borrower = await this.findBorrowerOrFail(borrowerId);
    this.assertOwnership(borrower, lenderUserId, `/v1/borrowers/${borrowerId}`);

    try {
      const updated = await this.prisma.borrower.update({
        where: { id: borrowerId },
        data: dto,
      });

      return this.toBorrowerResponse(updated);
    } catch (error: unknown) {
      this.handleUniqueConstraintError(error, `/v1/borrowers/${borrowerId}`);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(borrowerId: string, lenderUserId: string): Promise<void> {
    const borrower = await this.findBorrowerOrFail(borrowerId);
    this.assertOwnership(borrower, lenderUserId, `/v1/borrowers/${borrowerId}`);

    // LOAN-038: Cannot delete a borrower with active loans
    const activeLoanCount = await this.prisma.loan.count({
      where: {
        borrowerId,
        status: { in: ACTIVE_LOAN_STATUSES },
        deletedAt: null,
      },
    });
    if (activeLoanCount > 0) {
      throw new ConflictException(
        'active-loans-exist',
        'Active Loans Exist',
        'Cannot delete a borrower who has active loans.',
        `/v1/borrowers/${borrowerId}`,
      );
    }

    await this.prisma.borrower.delete({ where: { id: borrowerId } });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async findBorrowerOrFail(borrowerId: string): Promise<Borrower> {
    const borrower = await this.prisma.borrower.findUnique({
      where: { id: borrowerId },
    });

    if (!borrower) {
      throw new NotFoundException('Borrower', borrowerId, `/v1/borrowers/${borrowerId}`);
    }

    return borrower;
  }

  private assertOwnership(borrower: Borrower, lenderUserId: string, path: string): void {
    if (borrower.lenderUserId !== lenderUserId) {
      throw new ForbiddenException(
        'forbidden',
        'Forbidden',
        'You do not have permission to access this borrower.',
        path,
      );
    }
  }

  private handleUniqueConstraintError(error: unknown, path: string): void {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as Error & { code: string }).code === 'P2002'
    ) {
      throw new ConflictException(
        'borrower-already-exists',
        'Borrower Already Exists',
        'A contact with this email already exists in your list.',
        path,
      );
    }
  }

  private toBorrowerResponse(borrower: Borrower): BorrowerResponse {
    return {
      id: borrower.id,
      firstName: borrower.firstName,
      lastName: borrower.lastName,
      email: borrower.email,
      phoneNumber: borrower.phoneNumber,
      userId: borrower.userId,
      statistics: {
        ...DEFAULT_BORROWER_STATISTICS,
        trustScore: borrower.trustScore,
        totalLoans: borrower.totalLoans,
      },
    };
  }
}
