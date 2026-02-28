import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  RateLimitException,
} from '../common/exceptions/problem-details.exception.js';
import { LOAN_EVENTS } from '../common/events/loan.events.js';
import { isValidTransition, isAllowedForRole } from './loan-status-machine.js';
import type { LoanRole } from './loan-status-machine.js';
import { CreateLoanDto } from './dto/create-loan.dto.js';
import type { UpdateLoanDto } from './dto/update-loan.dto.js';
import type { ContestLoanDto } from './dto/contest-loan.dto.js';
import type { CreateItemDto } from '../items/dto/create-item.dto.js';
import type { CreateBorrowerDto } from '../borrowers/dto/create-borrower.dto.js';
import type {
  LoanResponse,
  LoanItemResponse,
  LoanLenderResponse,
  LoanBorrowerResponse,
  PaginatedLoansResponse,
} from './interfaces/loan-response.interface.js';
import type { PhotoResponse } from '../items/interfaces/photo-response.interface.js';
import type {
  LoanCreatedEvent,
  LoanStatusChangedEvent,
  LoanDeletedEvent,
} from '../common/events/loan.events.js';
import {
  LoanStatus,
  type Loan,
  type Item,
  type Photo,
  type User,
  type Borrower,
} from '@prisma/client';

const MAX_LOANS_PER_DAY = 15;

/** Archived statuses that are excluded from default listing */
const ARCHIVED_STATUSES: LoanStatus[] = [
  LoanStatus.RETURNED,
  LoanStatus.NOT_RETURNED,
  LoanStatus.ABANDONED,
  LoanStatus.CONTESTED,
];

type LoanWithRelations = Loan & {
  item: Item & { photos: Photo[] };
  lender: User;
  borrower: Borrower;
};

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // =========================================================================
  // CREATE
  // =========================================================================

  async create(lenderId: string, dto: CreateLoanDto): Promise<LoanResponse> {
    // Rate limit: 15 loans/day
    await this.checkDailyRateLimit(lenderId);

    // Validate returnDate if provided
    if (dto.returnDate) {
      const returnDate = new Date(dto.returnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (returnDate < today) {
        throw new BadRequestException(
          'invalid-return-date',
          'Invalid Return Date',
          'Return date must be in the future.',
          '/v1/loans',
        );
      }
    }

    // Resolve item: UUID string → existing, object → create inline
    const itemId = await this.resolveItem(dto.item, lenderId);

    // Resolve borrower: UUID string → existing, object → create inline
    const borrowerId = await this.resolveBorrower(dto.borrower, lenderId);

    const loan = await this.prisma.loan.create({
      data: {
        itemId,
        lenderId,
        borrowerId,
        status: LoanStatus.PENDING_CONFIRMATION,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : null,
        notes: dto.notes ?? null,
      },
      include: {
        item: { include: { photos: true } },
        lender: true,
        borrower: true,
      },
    });

    // Increment daily counter
    await this.incrementDailyCount(lenderId);

    // Emit event for inter-module communication
    const event: LoanCreatedEvent = {
      loanId: loan.id,
      borrowerId: loan.borrowerId,
      lenderUserId: lenderId,
    };
    this.eventEmitter.emit(LOAN_EVENTS.CREATED, event);

    return this.toLoanResponse(loan);
  }

  // =========================================================================
  // READ
  // =========================================================================

  async findAll(
    lenderId: string,
    query: {
      status?: LoanStatus[];
      borrowerId?: string;
      includeArchived?: boolean;
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: string;
    },
  ): Promise<PaginatedLoansResponse> {
    const { page, limit, sortBy, sortOrder, borrowerId, includeArchived } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      lenderId,
      deletedAt: null,
    };

    // Status filter
    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    } else if (!includeArchived) {
      // By default, exclude archived statuses
      where.status = { notIn: ARCHIVED_STATUSES };
    }

    if (borrowerId) {
      where.borrowerId = borrowerId;
    }

    const [loans, totalItems] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        include: {
          item: { include: { photos: true } },
          lender: true,
          borrower: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.loan.count({ where }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
      data: loans.map((loan) => this.toLoanResponse(loan as LoanWithRelations)),
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

  async findById(loanId: string, lenderId: string): Promise<LoanResponse> {
    const loan = await this.findLoanOrFail(loanId);
    this.assertOwnership(loan, lenderId, `/v1/loans/${loanId}`);
    return this.toLoanResponse(loan);
  }

  // =========================================================================
  // UPDATE
  // =========================================================================

  async update(loanId: string, lenderId: string, dto: UpdateLoanDto): Promise<LoanResponse> {
    const loan = await this.findLoanOrFail(loanId);
    this.assertOwnership(loan, lenderId, `/v1/loans/${loanId}`);

    const data: Record<string, unknown> = {};
    if (dto.returnDate !== undefined) {
      data.returnDate = dto.returnDate ? new Date(dto.returnDate) : null;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data,
      include: {
        item: { include: { photos: true } },
        lender: true,
        borrower: true,
      },
    });

    return this.toLoanResponse(updated as LoanWithRelations);
  }

  // =========================================================================
  // DELETE (soft)
  // =========================================================================

  async delete(loanId: string, lenderId: string): Promise<void> {
    const loan = await this.findLoanOrFail(loanId);
    this.assertOwnership(loan, lenderId, `/v1/loans/${loanId}`);

    if (loan.status === LoanStatus.RETURNED) {
      throw new ConflictException(
        'loan-already-returned',
        'Cannot Delete Returned Loan',
        'You cannot delete a loan that has already been returned.',
        `/v1/loans/${loanId}`,
      );
    }

    await this.prisma.loan.update({
      where: { id: loanId },
      data: { deletedAt: new Date() },
    });

    const event: LoanDeletedEvent = {
      loanId,
      borrowerId: loan.borrowerId,
      lenderUserId: lenderId,
      lastStatus: loan.status,
    };
    this.eventEmitter.emit(LOAN_EVENTS.DELETED, event);
  }

  // =========================================================================
  // STATUS TRANSITIONS
  // =========================================================================

  async updateStatus(
    loanId: string,
    userId: string,
    newStatus: LoanStatus,
    notes?: string | null,
  ): Promise<LoanResponse> {
    const loan = await this.findLoanOrFail(loanId);

    // Determine user role relative to this loan (lender or borrower)
    const role = this.resolveUserRole(loan, userId, `/v1/loans/${loanId}/status`);

    if (!isValidTransition(loan.status, newStatus)) {
      throw new ConflictException(
        'invalid-status-transition',
        'Invalid Status Transition',
        `Cannot transition from ${loan.status} to ${newStatus}.`,
        `/v1/loans/${loanId}/status`,
      );
    }

    if (!isAllowedForRole(loan.status, newStatus, role)) {
      throw new ForbiddenException(
        'forbidden-status-transition',
        'Forbidden Status Transition',
        'This status transition is not allowed for your role.',
        `/v1/loans/${loanId}/status`,
      );
    }

    const data: Record<string, unknown> = { status: newStatus };
    if (notes !== undefined && notes !== null) {
      data.notes = notes;
    }

    // Set confirmation/returned dates based on transition
    if (newStatus === LoanStatus.ACTIVE || newStatus === LoanStatus.ACTIVE_BY_DEFAULT) {
      data.confirmationDate = new Date();
    }
    if (newStatus === LoanStatus.RETURNED) {
      data.returnedDate = new Date();
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data,
      include: {
        item: { include: { photos: true } },
        lender: true,
        borrower: true,
      },
    });

    const event: LoanStatusChangedEvent = {
      loanId,
      borrowerId: loan.borrowerId,
      lenderUserId: loan.lenderId,
      previousStatus: loan.status,
      newStatus,
    };
    this.eventEmitter.emit(LOAN_EVENTS.STATUS_CHANGED, event);

    return this.toLoanResponse(updated as LoanWithRelations);
  }

  async confirm(loanId: string, userId: string): Promise<LoanResponse> {
    const loan = await this.findLoanOrFail(loanId);
    this.assertBorrowerRole(loan, userId, `/v1/loans/${loanId}/confirm`);

    if (!isValidTransition(loan.status, LoanStatus.ACTIVE)) {
      throw new ConflictException(
        'invalid-status-transition',
        'Invalid Status Transition',
        `Cannot transition from ${loan.status} to ACTIVE.`,
        `/v1/loans/${loanId}/confirm`,
      );
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.ACTIVE,
        confirmationDate: new Date(),
      },
      include: {
        item: { include: { photos: true } },
        lender: true,
        borrower: true,
      },
    });

    const event: LoanStatusChangedEvent = {
      loanId,
      borrowerId: loan.borrowerId,
      lenderUserId: loan.lenderId,
      previousStatus: loan.status,
      newStatus: LoanStatus.ACTIVE,
    };
    this.eventEmitter.emit(LOAN_EVENTS.STATUS_CHANGED, event);

    return this.toLoanResponse(updated as LoanWithRelations);
  }

  async contest(loanId: string, userId: string, dto: ContestLoanDto): Promise<LoanResponse> {
    const loan = await this.findLoanOrFail(loanId);
    this.assertBorrowerRole(loan, userId, `/v1/loans/${loanId}/contest`);

    if (!isValidTransition(loan.status, LoanStatus.CONTESTED)) {
      throw new ConflictException(
        'invalid-status-transition',
        'Invalid Status Transition',
        `Cannot transition from ${loan.status} to CONTESTED.`,
        `/v1/loans/${loanId}/contest`,
      );
    }

    const updated = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.CONTESTED,
        contestReason: dto.reason,
      },
      include: {
        item: { include: { photos: true } },
        lender: true,
        borrower: true,
      },
    });

    const event: LoanStatusChangedEvent = {
      loanId,
      borrowerId: loan.borrowerId,
      lenderUserId: loan.lenderId,
      previousStatus: loan.status,
      newStatus: LoanStatus.CONTESTED,
    };
    this.eventEmitter.emit(LOAN_EVENTS.STATUS_CHANGED, event);

    return this.toLoanResponse(updated as LoanWithRelations);
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private async resolveItem(itemInput: string | CreateItemDto, lenderId: string): Promise<string> {
    // UUID string → reference existing item
    if (typeof itemInput === 'string') {
      const item = await this.prisma.item.findUnique({
        where: { id: itemInput },
      });
      if (!item) {
        throw new NotFoundException('Item', itemInput, '/v1/loans');
      }
      if (item.userId !== lenderId) {
        throw new ForbiddenException(
          'forbidden',
          'Forbidden',
          'You do not have permission to use this item.',
          '/v1/loans',
        );
      }
      return item.id;
    }

    // Object → create inline
    const dto = itemInput;

    if (
      dto.category === 'MONEY' &&
      (dto.estimatedValue === undefined || dto.estimatedValue === null)
    ) {
      throw new BadRequestException(
        'estimated-value-required',
        'Estimated Value Required',
        'estimatedValue is required when category is MONEY.',
        '/v1/loans',
      );
    }

    const item = await this.prisma.item.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        category: dto.category,
        estimatedValue: dto.estimatedValue ?? null,
        userId: lenderId,
      },
    });
    return item.id;
  }

  private async resolveBorrower(
    borrowerInput: string | CreateBorrowerDto,
    lenderId: string,
  ): Promise<string> {
    // UUID string → reference existing borrower
    if (typeof borrowerInput === 'string') {
      const borrower = await this.prisma.borrower.findUnique({
        where: { id: borrowerInput },
      });
      if (!borrower) {
        throw new NotFoundException('Borrower', borrowerInput, '/v1/loans');
      }
      if (borrower.lenderUserId !== lenderId) {
        throw new ForbiddenException(
          'forbidden',
          'Forbidden',
          'You do not have permission to use this borrower.',
          '/v1/loans',
        );
      }
      return borrower.id;
    }

    // Object → create inline
    const dto = borrowerInput;

    // Check uniqueness (lenderUserId + email)
    const existing = await this.prisma.borrower.findUnique({
      where: {
        lenderUserId_email: {
          lenderUserId: lenderId,
          email: dto.email,
        },
      },
    });

    if (existing) {
      // Reuse existing borrower with same email for this lender
      return existing.id;
    }

    const borrower = await this.prisma.borrower.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber ?? null,
        lenderUserId: lenderId,
      },
    });
    return borrower.id;
  }

  private async checkDailyRateLimit(lenderId: string): Promise<void> {
    const key = `loan-rate:${lenderId}:${this.getTodayKey()}`;
    const client = this.redis.getClient();
    const count = await client.get(key);
    if (count !== null && parseInt(count, 10) >= MAX_LOANS_PER_DAY) {
      throw new RateLimitException(
        `You have reached the maximum of ${MAX_LOANS_PER_DAY} loans per day.`,
        '/v1/loans',
      );
    }
  }

  private async incrementDailyCount(lenderId: string): Promise<void> {
    const key = `loan-rate:${lenderId}:${this.getTodayKey()}`;
    const client = this.redis.getClient();
    const newCount = await client.incr(key);
    if (newCount === 1) {
      // Set TTL to expire at end of day (max 24h)
      await client.expire(key, 86400);
    }
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private async findLoanOrFail(loanId: string): Promise<LoanWithRelations> {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        item: { include: { photos: true } },
        lender: true,
        borrower: true,
      },
    });

    if (!loan || loan.deletedAt !== null) {
      throw new NotFoundException('Loan', loanId, `/v1/loans/${loanId}`);
    }

    return loan as LoanWithRelations;
  }

  private assertOwnership(loan: LoanWithRelations, lenderId: string, path: string): void {
    if (loan.lenderId !== lenderId) {
      throw new ForbiddenException(
        'forbidden',
        'Forbidden',
        'You can only access or modify loans you created.',
        path,
      );
    }
  }

  /**
   * Determines the user's role relative to a loan.
   * Throws 403 if the user is neither the lender nor the borrower.
   */
  private resolveUserRole(loan: LoanWithRelations, userId: string, path: string): LoanRole {
    if (loan.lenderId === userId) return 'lender';
    if (loan.borrower.userId === userId) return 'borrower';

    throw new ForbiddenException(
      'forbidden',
      'Forbidden',
      'You do not have permission to change this loan status.',
      path,
    );
  }

  /**
   * Asserts the calling user is the borrower linked to this loan.
   * Used for confirm/contest (emprunteur uniquement per OpenAPI).
   */
  private assertBorrowerRole(loan: LoanWithRelations, userId: string, path: string): void {
    if (loan.borrower.userId !== userId) {
      throw new ForbiddenException(
        'forbidden-status-transition',
        'Forbidden Status Transition',
        'Only the borrower can confirm or contest a loan.',
        path,
      );
    }
  }

  private toLoanResponse(loan: LoanWithRelations): LoanResponse {
    return {
      id: loan.id,
      item: this.toItemResponse(loan.item),
      lender: this.toLenderResponse(loan.lender),
      borrower: this.toBorrowerResponse(loan.borrower),
      returnDate: loan.returnDate ? loan.returnDate.toISOString().slice(0, 10) : null,
      status: loan.status,
      confirmationDate: loan.confirmationDate?.toISOString() ?? null,
      returnedDate: loan.returnedDate?.toISOString() ?? null,
      notes: loan.notes,
      contestReason: loan.contestReason,
      createdAt: loan.createdAt.toISOString(),
      updatedAt: loan.updatedAt.toISOString(),
    };
  }

  private toItemResponse(item: Item & { photos: Photo[] }): LoanItemResponse {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      estimatedValue: item.estimatedValue,
      photos: item.photos.map((p) => this.toPhotoResponse(p)),
      createdAt: item.createdAt.toISOString(),
    };
  }

  private toPhotoResponse(photo: Photo): PhotoResponse {
    return {
      id: photo.id,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      uploadedAt: photo.uploadedAt.toISOString(),
    };
  }

  private toLenderResponse(user: User): LoanLenderResponse {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
    };
  }

  private toBorrowerResponse(borrower: Borrower): LoanBorrowerResponse {
    return {
      id: borrower.id,
      firstName: borrower.firstName,
      lastName: borrower.lastName,
      email: borrower.email,
      phoneNumber: borrower.phoneNumber,
      userId: borrower.userId,
      statistics: {
        totalLoans: borrower.totalLoans,
        returnedOnTime: borrower.returnedOnTime,
        returnedLate: borrower.returnedLate,
        notReturned: borrower.notReturned,
        averageReturnDelay: borrower.averageReturnDelay,
        trustScore: borrower.trustScore,
      },
    };
  }
}
