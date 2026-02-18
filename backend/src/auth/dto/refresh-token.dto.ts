import { IsString } from 'class-validator';

/**
 * DTO pour le renouvellement d'un access token via refresh token.
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}
