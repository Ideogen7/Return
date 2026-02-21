// Types conformes au contrat OpenAPI (docs/openapi.yaml)

// --- Utilisateur ---

export type UserRole = 'LENDER';

export interface UserSettings {
  pushNotificationsEnabled: boolean;
  reminderEnabled: boolean;
  language: 'fr' | 'en';
  timezone: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string | null;
  settings?: UserSettings;
  createdAt: string;
  lastLoginAt?: string | null;
}

// --- Authentification ---

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// --- Profil ---

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountDto {
  password: string;
  confirmationText: 'DELETE MY ACCOUNT';
}

// --- Erreurs RFC 7807 ---

export interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  requestId: string;
  errors?: ErrorDetail[];
}
