import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { ItemCategory } from '@prisma/client';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number | null;
}
