import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ListInvitationsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['sent', 'received'])
  direction?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
