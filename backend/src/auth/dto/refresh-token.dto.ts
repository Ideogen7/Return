import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO pour le renouvellement d'un access token via refresh token.
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token must not be empty' })
  refreshToken!: string;
}
