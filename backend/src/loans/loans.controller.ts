import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { LoansService } from './loans.service.js';
import { CreateLoanDto } from './dto/create-loan.dto.js';
import { UpdateLoanDto } from './dto/update-loan.dto.js';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto.js';
import { ContestLoanDto } from './dto/contest-loan.dto.js';
import { ListLoansQueryDto } from './dto/list-loans-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import type { LoanResponse, PaginatedLoansResponse } from './interfaces/loan-response.interface.js';

// =============================================================================
// LoansController — Endpoints CRUD loans + status transitions
// =============================================================================
// Tous les endpoints requièrent un Bearer token (JwtAuthGuard).
// Le userId est TOUJOURS extrait du JWT (req.user.userId).
//
// Routes (préfixe global /v1 + prefix 'loans') :
//   POST   /v1/loans                       → 201 Created + Location
//   GET    /v1/loans                       → 200 OK + PaginatedLoansResponse
//   GET    /v1/loans/:loanId               → 200 OK | 403 | 404
//   PATCH  /v1/loans/:loanId               → 200 OK | 400 | 403 | 404
//   DELETE /v1/loans/:loanId               → 204 No Content | 403 | 404 | 409
//   PATCH  /v1/loans/:loanId/status        → 200 OK | 403 | 404 | 409
//   POST   /v1/loans/:loanId/confirm       → 200 OK | 403 | 404 | 409
//   POST   /v1/loans/:loanId/contest       → 200 OK | 403 | 404 | 409
// =============================================================================

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  /**
   * POST /v1/loans
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateLoanDto,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoanResponse> {
    const loan = await this.loansService.create(req.user.userId, dto);
    res.setHeader('Location', `/v1/loans/${loan.id}`);
    return loan;
  }

  /**
   * GET /v1/loans
   */
  @Get()
  async findAll(
    @Query() query: ListLoansQueryDto,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<PaginatedLoansResponse> {
    return this.loansService.findAll(req.user.userId, {
      status: query.status,
      borrowerId: query.borrowerId,
      includeArchived: query.includeArchived ?? false,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
  }

  /**
   * GET /v1/loans/:loanId
   */
  @Get(':loanId')
  async findById(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<LoanResponse> {
    return this.loansService.findById(loanId, req.user.userId);
  }

  /**
   * PATCH /v1/loans/:loanId
   */
  @Patch(':loanId')
  async update(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() dto: UpdateLoanDto,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<LoanResponse> {
    return this.loansService.update(loanId, req.user.userId, dto);
  }

  /**
   * DELETE /v1/loans/:loanId
   */
  @Delete(':loanId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<void> {
    return this.loansService.delete(loanId, req.user.userId);
  }

  /**
   * PATCH /v1/loans/:loanId/status
   */
  @Patch(':loanId/status')
  async updateStatus(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() dto: UpdateLoanStatusDto,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<LoanResponse> {
    return this.loansService.updateStatus(loanId, req.user.userId, dto.status, dto.notes);
  }

  /**
   * POST /v1/loans/:loanId/confirm
   */
  @Post(':loanId/confirm')
  async confirm(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<LoanResponse> {
    return this.loansService.confirm(loanId, req.user.userId);
  }

  /**
   * POST /v1/loans/:loanId/contest
   */
  @Post(':loanId/contest')
  async contest(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() dto: ContestLoanDto,
    @Request() req: ExpressRequest & { user: AuthenticatedUser },
  ): Promise<LoanResponse> {
    return this.loansService.contest(loanId, req.user.userId, dto);
  }
}
