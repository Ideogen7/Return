import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLoanDto {
  @IsOptional()
  @IsDateString()
  returnDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
