import { IsNotEmpty, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { CreateItemDto } from '../../items/dto/create-item.dto.js';
import { CreateBorrowerDto } from '../../borrowers/dto/create-borrower.dto.js';

/**
 * DTO for creating a loan.
 *
 * Per OpenAPI spec (RÈGLE DE DIAMANT), `item` and `borrower` can be either:
 * - A UUID string referencing an existing resource
 * - An inline CreateItemDto / CreateBorrowerDto object for creation
 *
 * Discrimination is handled at the service level.
 */
export class CreateLoanDto {
  @IsNotEmpty()
  item!: string | CreateItemDto;

  @IsNotEmpty()
  borrower!: string | CreateBorrowerDto;

  @IsOptional()
  @IsDateString()
  returnDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
