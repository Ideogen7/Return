import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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

  /**
   * Langue de l'application.
   * Valeurs autorisées : 'fr' (français) ou 'en' (anglais) — conforme OpenAPI enum.
   */
  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en'], { message: "Language must be either 'fr' or 'en'." })
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
