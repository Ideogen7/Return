// =============================================================================
// Custom validator: @IsUuidOrDto(DtoClass)
// Handles oneOf [UUID string, nested DTO object] as per OpenAPI spec.
//
// - If value is a string → validates UUID format (any version)
// - If value is an object → transforms to DtoClass and runs full validation
// - Otherwise → fails
// =============================================================================

import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
  registerDecorator,
  type ValidationOptions,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Generic constructor type for DTO classes
type DtoConstructor = new () => object;

@ValidatorConstraint({ name: 'isUuidOrDto', async: false })
export class IsUuidOrDtoConstraint implements ValidatorConstraintInterface {
  private errors: string[] = [];

  validate(value: unknown, args: ValidationArguments): boolean {
    const [DtoClass] = args.constraints as [DtoConstructor];
    this.errors = [];

    if (value === null || value === undefined) {
      this.errors.push(`${args.property} should not be empty`);
      return false;
    }

    // String path → must be a valid UUID
    if (typeof value === 'string') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        this.errors.push(`${args.property} must be a valid UUID`);
        return false;
      }
      return true;
    }

    // Object path → transform and validate as DTO
    if (typeof value === 'object') {
      const instance = plainToInstance(DtoClass, value);
      const validationErrors = validateSync(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (validationErrors.length > 0) {
        for (const err of validationErrors) {
          const constraints = err.constraints ? Object.values(err.constraints) : [];
          this.errors.push(...constraints);
        }
        return false;
      }
      return true;
    }

    this.errors.push(`${args.property} must be a UUID string or a valid object`);
    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    if (this.errors.length > 0) {
      return this.errors.join('; ');
    }
    const [DtoClass] = args.constraints as [DtoConstructor];
    return `${args.property} must be a valid UUID string or a valid ${DtoClass.name} object`;
  }
}

/**
 * Validates that a property is either:
 * - A valid UUID v4 string (referencing existing resource)
 * - A valid instance of the given DTO class (inline creation)
 *
 * Usage:
 *   @IsUuidOrDto(CreateItemDto)
 *   item!: string | CreateItemDto;
 */
export function IsUuidOrDto(
  dtoClass: DtoConstructor,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [dtoClass],
      validator: IsUuidOrDtoConstraint,
    });
  };
}
