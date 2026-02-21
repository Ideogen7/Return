import type { User } from '@prisma/client';
import type { SafeUser } from '../../auth/interfaces/auth-response.interface.js';

// =============================================================================
// UserMapper — Utilitaire partagé de transformation User → SafeUser
// =============================================================================
// Centralise la logique de sanitisation pour respecter le DRY :
//   - Exclut le mot de passe et updatedAt
//   - Regroupe les préférences dans un objet `settings` imbriqué
//   - Utilisé par AuthService et UsersService
//
// Conforme au schéma OpenAPI `User` (pas de password, pas de updatedAt,
// settings imbriqué avec pushNotificationsEnabled, reminderEnabled, language, timezone).
// =============================================================================

/**
 * Transforme un objet User Prisma en SafeUser conforme au schéma OpenAPI.
 *
 * - Exclut : password, updatedAt
 * - Regroupe : pushNotificationsEnabled, reminderEnabled, language, timezone → settings
 */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    profilePicture: user.profilePicture,
    settings: {
      pushNotificationsEnabled: user.pushNotificationsEnabled,
      reminderEnabled: user.reminderEnabled,
      language: user.language,
      timezone: user.timezone,
    },
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
