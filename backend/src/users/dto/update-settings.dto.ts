import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO pour la mise à jour partielle des préférences utilisateur.
 *
 * Tous les champs sont optionnels (PATCH sémantique).
 * Correspond à l'OpenAPI UpdateSettingsDto.
 */
export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  pushNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
