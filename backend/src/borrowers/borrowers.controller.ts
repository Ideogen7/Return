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
import type { Response } from 'express';
import { BorrowersService } from './borrowers.service.js';
import { CreateBorrowerDto } from './dto/create-borrower.dto.js';
import { UpdateBorrowerDto } from './dto/update-borrower.dto.js';
import {
  ListBorrowersQueryDto,
  BorrowerSortBy,
  SortOrder,
} from './dto/list-borrowers-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import type {
  BorrowerResponse,
  PaginatedBorrowersResponse,
} from './interfaces/borrower-response.interface.js';

// =============================================================================
// BorrowersController — Endpoints CRUD contacts (emprunteurs)
// =============================================================================
// Tous les endpoints requièrent un Bearer token (JwtAuthGuard).
// Le lenderUserId est TOUJOURS extrait du JWT (req.user.userId).
//
// Routes (préfixe global /v1 + prefix 'borrowers') :
//   GET    /v1/borrowers           → 200 OK + PaginatedBorrowersResponse
//   POST   /v1/borrowers           → 201 Created + Location header + BorrowerResponse
//   GET    /v1/borrowers/:id       → 200 OK | 403 | 404
//   PATCH  /v1/borrowers/:id       → 200 OK | 403 | 404 | 409
//   DELETE /v1/borrowers/:id       → 204 No Content | 403 | 404 | 409
// =============================================================================

@Controller('borrowers')
@UseGuards(JwtAuthGuard)
export class BorrowersController {
  constructor(private readonly borrowersService: BorrowersService) {}

  /**
   * POST /v1/borrowers
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: CreateBorrowerDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BorrowerResponse> {
    const borrower = await this.borrowersService.create(req.user.userId, dto);
    res.setHeader('Location', `/v1/borrowers/${borrower.id}`);
    return borrower;
  }

  /**
   * GET /v1/borrowers
   */
  @Get()
  async findAll(
    @Request() req: { user: AuthenticatedUser },
    @Query() query: ListBorrowersQueryDto,
  ): Promise<PaginatedBorrowersResponse> {
    return this.borrowersService.findAll(req.user.userId, {
      sortBy: query.sortBy ?? BorrowerSortBy.FIRST_NAME,
      sortOrder: query.sortOrder ?? SortOrder.ASC,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  /**
   * GET /v1/borrowers/:id
   */
  @Get(':id')
  async findById(
    @Request() req: { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BorrowerResponse> {
    return this.borrowersService.findById(id, req.user.userId);
  }

  /**
   * PATCH /v1/borrowers/:id
   */
  @Patch(':id')
  async update(
    @Request() req: { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBorrowerDto,
  ): Promise<BorrowerResponse> {
    return this.borrowersService.update(id, req.user.userId, dto);
  }

  /**
   * DELETE /v1/borrowers/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Request() req: { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.borrowersService.delete(id, req.user.userId);
  }
}
