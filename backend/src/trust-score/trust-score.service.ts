import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Global trust score of a user acting as a borrower, aggregated across every
 * lender who has a contact (Borrower) record pointing at that user.
 */
export interface GlobalTrustScore {
  trustScore: number;
  totalLoans: number;
  returnedOnTime: number;
  returnedLate: number;
  notReturned: number;
}

/**
 * FIX-15: single source of truth for a user's trust score.
 *
 * The per-relation `trustScore` denormalized on each Borrower record is local to
 * one lender. A user borrowing from several lenders has several Borrower records,
 * each with its own score. This service aggregates the (linear) denormalized
 * counters across all of them to produce one global score, used both on the
 * user's own profile (GET /users/me/trust-score) and on a contact sheet
 * (GET /borrowers/{id}/statistics).
 */
@Injectable()
export class TrustScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async computeGlobalTrustScore(userId: string): Promise<GlobalTrustScore> {
    const { _sum } = await this.prisma.borrower.aggregate({
      where: { userId },
      _sum: {
        totalLoans: true,
        returnedOnTime: true,
        returnedLate: true,
        notReturned: true,
      },
    });

    const totalLoans = _sum.totalLoans ?? 0;
    const returnedOnTime = _sum.returnedOnTime ?? 0;
    const returnedLate = _sum.returnedLate ?? 0;
    const notReturned = _sum.notReturned ?? 0;

    // Same formula as the per-relation score, applied to the aggregated counters.
    const trustScore =
      totalLoans > 0
        ? Math.round(((returnedOnTime * 100 + returnedLate * 50) / totalLoans) * 10) / 10
        : 0;

    return { trustScore, totalLoans, returnedOnTime, returnedLate, notReturned };
  }
}
