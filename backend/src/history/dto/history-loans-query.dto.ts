import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LoanStatus } from '@prisma/client';

/** Terminal statuses eligible for the history archive */
export const TERMINAL_STATUSES: LoanStatus[] = [
  LoanStatus.RETURNED,
  LoanStatus.NOT_RETURNED,
  LoanStatus.CONTESTED,
  LoanStatus.ABANDONED,
];

export class HistoryLoansQueryDto {
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
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
