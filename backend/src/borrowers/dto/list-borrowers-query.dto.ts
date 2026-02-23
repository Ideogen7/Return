import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum BorrowerSortBy {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  TRUST_SCORE = 'trustScore',
  TOTAL_LOANS = 'totalLoans',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListBorrowersQueryDto {
  @IsOptional()
  @IsEnum(BorrowerSortBy)
  sortBy?: BorrowerSortBy = BorrowerSortBy.FIRST_NAME;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

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
}
