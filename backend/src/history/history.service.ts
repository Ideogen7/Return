import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { HistoryLoansQueryDto } from './dto/history-loans-query.dto.js';
import { TERMINAL_STATUSES } from './dto/history-loans-query.dto.js';
import type {
  LoanResponse,
  PaginatedLoansResponse,
} from '../loans/interfaces/loan-response.interface.js';
import type { PhotoResponse } from '../items/interfaces/photo-response.interface.js';
import type {
  LoanItemResponse,
  LoanLenderResponse,
  LoanBorrowerResponse,
} from '../loans/interfaces/loan-response.interface.js';
import {
  LoanStatus,
  type Loan,
  type Item,
  type Photo,
  type User,
  type Borrower,
} from '@prisma/client';

// =========================================================================
// Types
// =========================================================================

type LoanWithRelations = Loan & {
  item: Item & { photos: Photo[] };
  lender: User;
  borrower: Borrower;
};

/** Active statuses used for overview counting */
const ACTIVE_STATUSES: LoanStatus[] = [
  LoanStatus.ACTIVE,
  LoanStatus.ACTIVE_BY_DEFAULT,
  LoanStatus.AWAITING_RETURN,
  LoanStatus.PENDING_CONFIRMATION,
];

// =========================================================================
// Response interfaces for statistics
// =========================================================================

export interface HistoryOverview {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  notReturnedLoans: number;
  contestedLoans: number;
  averageReturnDelay: number | null;
}

export interface CategoryStats {
  category: string;
  count: number;
  totalValue: number | null;
}

export interface TopBorrower {
  borrower: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
  loanCount: number;
  trustScore: number;
}

export interface MostLoanedItem {
  item: {
    id: string;
    name: string;
    category: string;
    photos: PhotoResponse[];
  };
  loanCount: number;
}

export interface HistoryStatistics {
  overview: HistoryOverview;
  byCategory: CategoryStats[];
  topBorrowers: TopBorrower[];
  mostLoanedItems: MostLoanedItem[];
}

// =========================================================================
// Service
// =========================================================================

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  // =======================================================================
  // GET /history/loans — Archived loans with filters & pagination
  // =======================================================================

  async getArchivedLoans(
    userId: string,
    query: HistoryLoansQueryDto,
  ): Promise<PaginatedLoansResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      lenderId: userId,
      deletedAt: null,
    };

    // Restrict to terminal statuses; optionally narrow further
    if (query.status && query.status.length > 0) {
      // Only allow terminal statuses that are also in the user's filter
      const filtered = query.status.filter((s) => (TERMINAL_STATUSES as string[]).includes(s));
      where.status = { in: filtered.length > 0 ? filtered : TERMINAL_STATUSES };
    } else {
      where.status = { in: TERMINAL_STATUSES };
    }

    if (query.borrowerId) {
      where.borrowerId = query.borrowerId;
    }

    // Date range filter on createdAt
    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {};
      if (query.startDate) {
        createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        createdAt.lte = new Date(query.endDate);
      }
      where.createdAt = createdAt;
    }

    const [loans, totalItems] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        include: {
          item: { include: { photos: true } },
          lender: true,
          borrower: true,
        },
        orderBy: { createdAt: 'desc' },
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

  // =======================================================================
  // GET /history/statistics — Aggregated statistics for current user
  // =======================================================================

  async getStatistics(userId: string): Promise<HistoryStatistics> {
    const [overview, byCategory, topBorrowers, mostLoanedItems] = await Promise.all([
      this.computeOverview(userId),
      this.computeByCategory(userId),
      this.computeTopBorrowers(userId),
      this.computeMostLoanedItems(userId),
    ]);

    return { overview, byCategory, topBorrowers, mostLoanedItems };
  }

  // =======================================================================
  // Private: Overview
  // =======================================================================

  private async computeOverview(userId: string): Promise<HistoryOverview> {
    const baseWhere = { lenderId: userId, deletedAt: null };

    const [
      totalLoans,
      activeLoans,
      returnedLoans,
      notReturnedLoans,
      contestedLoans,
      returnedLoansData,
    ] = await Promise.all([
      this.prisma.loan.count({ where: baseWhere }),
      this.prisma.loan.count({
        where: { ...baseWhere, status: { in: ACTIVE_STATUSES } },
      }),
      this.prisma.loan.count({
        where: { ...baseWhere, status: LoanStatus.RETURNED },
      }),
      this.prisma.loan.count({
        where: { ...baseWhere, status: LoanStatus.NOT_RETURNED },
      }),
      this.prisma.loan.count({
        where: { ...baseWhere, status: LoanStatus.CONTESTED },
      }),
      // Fetch returned loans to compute average delay
      this.prisma.loan.findMany({
        where: { ...baseWhere, status: LoanStatus.RETURNED, returnDate: { not: null } },
        select: { returnDate: true, returnedDate: true },
      }),
    ]);

    let averageReturnDelay: number | null = null;
    if (returnedLoansData.length > 0) {
      let totalDays = 0;
      let validCount = 0;

      for (const loan of returnedLoansData) {
        if (loan.returnDate && loan.returnedDate) {
          const returnDate = new Date(loan.returnDate);
          const returnedDate = new Date(loan.returnedDate);
          const diffMs = returnedDate.getTime() - returnDate.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          totalDays += diffDays;
          validCount++;
        }
      }

      if (validCount > 0) {
        averageReturnDelay = Math.round(totalDays / validCount);
      }
    }

    return {
      totalLoans,
      activeLoans,
      returnedLoans,
      notReturnedLoans,
      contestedLoans,
      averageReturnDelay,
    };
  }

  // =======================================================================
  // Private: By Category
  // =======================================================================

  private async computeByCategory(userId: string): Promise<CategoryStats[]> {
    const loans = await this.prisma.loan.findMany({
      where: { lenderId: userId, deletedAt: null },
      include: { item: true },
    });

    const categoryMap = new Map<string, { count: number; totalValue: number | null }>();

    for (const loan of loans) {
      const category = loan.item.category;
      const existing = categoryMap.get(category);

      if (existing) {
        existing.count++;
        if (loan.item.estimatedValue !== null) {
          existing.totalValue = (existing.totalValue ?? 0) + loan.item.estimatedValue;
        }
      } else {
        categoryMap.set(category, {
          count: 1,
          totalValue: loan.item.estimatedValue,
        });
      }
    }

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      totalValue: stats.totalValue,
    }));
  }

  // =======================================================================
  // Private: Top Borrowers
  // =======================================================================

  private async computeTopBorrowers(userId: string): Promise<TopBorrower[]> {
    const loans = await this.prisma.loan.findMany({
      where: { lenderId: userId, deletedAt: null },
      include: {
        borrower: {
          include: { user: true },
        },
      },
    });

    const borrowerMap = new Map<
      string,
      {
        borrower: Borrower & { user: User | null };
        count: number;
      }
    >();

    for (const loan of loans) {
      const existing = borrowerMap.get(loan.borrowerId);
      if (existing) {
        existing.count++;
      } else {
        borrowerMap.set(loan.borrowerId, {
          borrower: loan.borrower as Borrower & { user: User | null },
          count: 1,
        });
      }
    }

    const sorted = Array.from(borrowerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return sorted.map(({ borrower, count }) => ({
      borrower: {
        id: borrower.id,
        firstName: borrower.user?.firstName ?? borrower.firstName,
        lastName: borrower.user?.lastName ?? borrower.lastName,
        profilePicture: borrower.user?.profilePicture ?? null,
      },
      loanCount: count,
      trustScore: borrower.trustScore,
    }));
  }

  // =======================================================================
  // Private: Most Loaned Items
  // =======================================================================

  private async computeMostLoanedItems(userId: string): Promise<MostLoanedItem[]> {
    const loans = await this.prisma.loan.findMany({
      where: { lenderId: userId, deletedAt: null },
      include: {
        item: { include: { photos: true } },
      },
    });

    const itemMap = new Map<
      string,
      {
        item: Item & { photos: Photo[] };
        count: number;
      }
    >();

    for (const loan of loans) {
      const existing = itemMap.get(loan.itemId);
      if (existing) {
        existing.count++;
      } else {
        itemMap.set(loan.itemId, {
          item: loan.item as Item & { photos: Photo[] },
          count: 1,
        });
      }
    }

    const sorted = Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return sorted.map(({ item, count }) => ({
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        photos: item.photos.map((p) => this.toPhotoResponse(p)),
      },
      loanCount: count,
    }));
  }

  // =======================================================================
  // Private: Response mapping (same pattern as LoansService)
  // =======================================================================

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
