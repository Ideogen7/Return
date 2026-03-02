import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { CreateItemDto } from '../../items/dto/create-item.dto.js';
import { CreateBorrowerDto } from '../../borrowers/dto/create-borrower.dto.js';
import { IsUuidOrDto } from '../../common/validators/is-uuid-or-dto.validator.js';

/**
 * DTO for creating a loan.
 *
 * Per OpenAPI spec (RÈGLE DE DIAMANT), `item` and `borrower` can be either:
 * - A UUID string referencing an existing resource → validated as UUID
 * - An inline CreateItemDto / CreateBorrowerDto object → validated with nested DTO rules
 *
 * Discrimination + validation handled by @IsUuidOrDto custom validator.
 */
export class CreateLoanDto {
  @IsUuidOrDto(CreateItemDto)
  item!: string | CreateItemDto;

  @IsUuidOrDto(CreateBorrowerDto)
  borrower!: string | CreateBorrowerDto;

  @IsOptional()
  @IsDateString()
  returnDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
