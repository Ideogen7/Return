import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { HistoryService } from './history.service.js';
import type { HistoryStatistics } from './history.service.js';
import { HistoryLoansQueryDto } from './dto/history-loans-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import type { PaginatedLoansResponse } from '../loans/interfaces/loan-response.interface.js';

// =============================================================================
// HistoryController — Archived loans & statistics
// =============================================================================
// All endpoints require a Bearer token (JwtAuthGuard).
// The userId is ALWAYS extracted from the JWT (req.user.userId).
//
// Routes (global prefix /v1 + prefix 'history'):
//   GET /v1/history/loans       → 200 OK + PaginatedLoansResponse
//   GET /v1/history/statistics   → 200 OK + HistoryStatistics
// =============================================================================

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * GET /v1/history/loans
   * Returns archived loans (terminal statuses) with optional filters and pagination.
   */
  @Get('loans')
  async getArchivedLoans(
    @Query() query: HistoryLoansQueryDto,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<PaginatedLoansResponse> {
    return this.historyService.getArchivedLoans(req.user.userId, query);
  }

  /**
   * GET /v1/history/statistics
   * Returns aggregated statistics for the current user (lender).
   */
  @Get('statistics')
  async getStatistics(
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<HistoryStatistics> {
    return this.historyService.getStatistics(req.user.userId);
  }
}
