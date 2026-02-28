import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { LoanStatus } from '@prisma/client';

export class BorrowerLoansQueryDto {
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
}
