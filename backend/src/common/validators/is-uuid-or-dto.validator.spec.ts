import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { IsUuidOrDto } from './is-uuid-or-dto.validator.js';

// =============================================================================
// Test DTOs — mimic CreateItemDto / CreateBorrowerDto for isolation
// =============================================================================

enum TestCategory {
  TOOLS = 'TOOLS',
  BOOKS = 'BOOKS',
}

class TestItemDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsEnum(TestCategory)
  @IsNotEmpty()
  category!: TestCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number | null;
}

class TestBorrowerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

// DTO that uses @IsUuidOrDto
class TestLoanDto {
  @IsUuidOrDto(TestItemDto)
  item!: string | TestItemDto;

  @IsUuidOrDto(TestBorrowerDto)
  borrower!: string | TestBorrowerDto;
}

// =============================================================================
// Helpers
// =============================================================================

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

async function validateDto(data: Partial<TestLoanDto>) {
  const instance = plainToInstance(TestLoanDto, data);
  return validate(instance, { whitelist: true, forbidNonWhitelisted: true });
}

// =============================================================================
// @IsUuidOrDto Validator Tests
// =============================================================================

describe('IsUuidOrDto Validator', () => {
  // =========================================================================
  // UUID string path
  // =========================================================================

  describe('UUID string validation', () => {
    it('should accept a valid UUID v4 string', async () => {
      const errors = await validateDto({
        item: VALID_UUID,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(0);
    });

    it('should accept uppercased UUID', async () => {
      const errors = await validateDto({
        item: VALID_UUID.toUpperCase(),
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject non-UUID string for item', async () => {
      const errors = await validateDto({
        item: 'not-a-uuid',
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
      expect(errors[0].constraints?.isUuidOrDto).toContain('must be a valid UUID');
    });

    it('should reject empty string for item', async () => {
      const errors = await validateDto({
        item: '',
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });

    it('should reject non-UUID string for borrower', async () => {
      const errors = await validateDto({
        item: VALID_UUID,
        borrower: 'hello-world',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('borrower');
      expect(errors[0].constraints?.isUuidOrDto).toContain('must be a valid UUID');
    });

    it('should reject partial UUID string', async () => {
      const errors = await validateDto({
        item: '550e8400-e29b-41d4-a716',
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });
  });

  // =========================================================================
  // Nested DTO object path
  // =========================================================================

  describe('nested DTO object validation', () => {
    it('should accept a valid inline item object', async () => {
      const errors = await validateDto({
        item: { name: 'Perceuse', category: TestCategory.TOOLS } as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(0);
    });

    it('should accept a valid inline borrower object', async () => {
      const errors = await validateDto({
        item: VALID_UUID,
        borrower: {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie@example.com',
        } as never,
      });
      expect(errors).toHaveLength(0);
    });

    it('should accept both fields as inline objects', async () => {
      const errors = await validateDto({
        item: { name: 'Perceuse', category: TestCategory.TOOLS } as never,
        borrower: {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie@example.com',
        } as never,
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject inline item with name too short', async () => {
      const errors = await validateDto({
        item: { name: 'AB', category: TestCategory.TOOLS } as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
      expect(errors[0].constraints?.isUuidOrDto).toContain('must be longer');
    });

    it('should reject inline item with invalid category', async () => {
      const errors = await validateDto({
        item: { name: 'Perceuse', category: 'INVALID_CAT' } as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
      expect(errors[0].constraints?.isUuidOrDto).toContain('must be one of');
    });

    it('should reject inline item with missing required fields', async () => {
      const errors = await validateDto({
        item: { category: TestCategory.TOOLS } as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });

    it('should reject inline borrower with invalid email', async () => {
      const errors = await validateDto({
        item: VALID_UUID,
        borrower: {
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'not-an-email',
        } as never,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('borrower');
      expect(errors[0].constraints?.isUuidOrDto).toContain('email');
    });

    it('should reject inline borrower with empty firstName', async () => {
      const errors = await validateDto({
        item: VALID_UUID,
        borrower: {
          firstName: '',
          lastName: 'Dupont',
          email: 'marie@example.com',
        } as never,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('borrower');
    });

    it('should reject inline object with extra unknown fields (forbidNonWhitelisted)', async () => {
      const errors = await validateDto({
        item: {
          name: 'Perceuse',
          category: TestCategory.TOOLS,
          unknownField: 'should fail',
        } as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });

    it('should accept inline item with optional estimatedValue', async () => {
      const errors = await validateDto({
        item: {
          name: 'Perceuse',
          category: TestCategory.TOOLS,
          estimatedValue: 49.99,
        } as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject inline item with negative estimatedValue', async () => {
      const errors = await validateDto({
        item: {
          name: 'Perceuse',
          category: TestCategory.TOOLS,
          estimatedValue: -5,
        } as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('should reject null value', async () => {
      const errors = await validateDto({
        item: null as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });

    it('should reject undefined value', async () => {
      const errors = await validateDto({
        item: undefined as never,
        borrower: VALID_UUID,
      });
      // undefined means the field is missing — should fail
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject number value', async () => {
      const errors = await validateDto({
        item: 42 as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });

    it('should reject array value', async () => {
      const errors = await validateDto({
        item: [VALID_UUID] as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });

    it('should reject boolean value', async () => {
      const errors = await validateDto({
        item: true as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });

    it('should report errors on both fields when both are invalid', async () => {
      const errors = await validateDto({
        item: 'not-uuid',
        borrower: 'also-not-uuid',
      });
      expect(errors).toHaveLength(2);
      const props = errors.map((e) => e.property);
      expect(props).toContain('item');
      expect(props).toContain('borrower');
    });

    it('should accept empty object as DTO (fails nested validation)', async () => {
      const errors = await validateDto({
        item: {} as never,
        borrower: VALID_UUID,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('item');
    });
  });
});
