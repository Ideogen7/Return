import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ItemCategory } from '@prisma/client';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsEnum(ItemCategory)
  @IsNotEmpty()
  category!: ItemCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number | null;
}
