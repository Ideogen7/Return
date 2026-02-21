import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO pour la connexion utilisateur.
 *
 * Pas de contrainte de complexité ici — on valide juste la présence.
 * La vérification du mot de passe se fait côté service (bcrypt.compare).
 */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  password!: string;
}
