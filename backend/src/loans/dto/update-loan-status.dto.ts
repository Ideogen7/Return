import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LoanStatus } from '@prisma/client';

export class UpdateLoanStatusDto {
  @IsEnum(LoanStatus)
  status!: LoanStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
