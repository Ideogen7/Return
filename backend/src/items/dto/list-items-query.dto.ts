import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ItemCategory } from '@prisma/client';

export class ListItemsQueryDto {
  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value as boolean;
  })
  @IsBoolean()
  available?: boolean;

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
