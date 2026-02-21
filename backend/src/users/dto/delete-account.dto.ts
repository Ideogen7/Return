import { IsString, IsNotEmpty, Equals } from 'class-validator';

/**
 * DTO pour la suppression de compte.
 *
 * Sécurité renforcée (OpenAPI) :
 * - password : mot de passe actuel (vérifié via bcrypt.compare)
 * - confirmationText : doit être exactement "DELETE MY ACCOUNT"
 *   → protection contre les suppressions accidentelles
 */
export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  password!: string;

  @IsString()
  @Equals('DELETE MY ACCOUNT', {
    message: 'confirmationText must be exactly "DELETE MY ACCOUNT"',
  })
  confirmationText!: string;
}
