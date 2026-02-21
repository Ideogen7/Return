import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * DTO pour le changement de mot de passe.
 *
 * - currentPassword : mot de passe actuel (vérifié via bcrypt.compare)
 * - newPassword : nouveau mot de passe avec les mêmes règles que l'inscription
 *                 (8-100 chars, 1 maj, 1 min, 1 chiffre, 1 spécial)
 *
 * Nom du champ conforme au schéma OpenAPI `ChangePasswordDto`.
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password must not be empty' })
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)',
  })
  newPassword!: string;
}
