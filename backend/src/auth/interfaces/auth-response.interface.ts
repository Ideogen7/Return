import { UserRole } from '@prisma/client';

// =============================================================================
// Types publics de réponse pour le module Auth
// =============================================================================

/**
 * Utilisateur sans données sensibles (password exclu).
 *
 * Correspond au schéma OpenAPI `User` renvoyé dans AuthResponse
 * et dans les endpoints /users/me.
 */
export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Réponse d'authentification conforme au schéma OpenAPI `AuthResponse`.
 *
 * Retournée par POST /auth/register, /auth/login, /auth/refresh.
 *
 * @example
 * {
 *   accessToken: "eyJhbGciOiJIUzI1NiIs...",
 *   refreshToken: "a3f8c2d1e9b7...",
 *   expiresIn: 900,
 *   tokenType: "Bearer",
 *   user: { id: "...", email: "...", ... }
 * }
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  /** Durée de vie de l'access token en secondes (900 = 15 min) */
  expiresIn: number;
  tokenType: 'Bearer';
  user: SafeUser;
}

/**
 * Paire de tokens générée en interne par AuthService.
 * Le refreshToken ici est le token brut (non haché),
 * destiné à être retourné au client.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
