import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LoanStatus } from '@prisma/client';

export enum LoanQueryRole {
  LENDER = 'lender',
  BORROWER = 'borrower',
}

export enum LoanSortBy {
  CREATED_AT = 'createdAt',
  RETURN_DATE = 'returnDate',
  STATUS = 'status',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListLoansQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.split(',') as LoanStatus[];
    }
    return value;
  })
  @IsArray()
  @IsEnum(LoanStatus, { each: true })
  status?: LoanStatus[];

  @IsOptional()
  @IsUUID()
  borrowerId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value as boolean;
  })
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(LoanSortBy)
  sortBy?: LoanSortBy = LoanSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsEnum(LoanQueryRole)
  role?: LoanQueryRole = LoanQueryRole.LENDER;
}
