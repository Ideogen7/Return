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
  tokenType: 'Bearer';
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

// --- Emprunteurs (Borrowers) ---

export interface BorrowerStatistics {
  totalLoans: number;
  returnedOnTime: number;
  returnedLate: number;
  notReturned: number;
  averageReturnDelay: number | null;
  trustScore: number;
}

export interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  userId?: string | null;
  statistics?: BorrowerStatistics;
}

export interface CreateBorrowerDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
}

export interface UpdateBorrowerDto {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phoneNumber?: string | null;
}

// --- Objets (Items) ---

export type ItemCategory =
  | 'TOOLS'
  | 'ELECTRONICS'
  | 'BOOKS'
  | 'SPORTS'
  | 'KITCHEN'
  | 'GARDEN'
  | 'MONEY'
  | 'OTHER';

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  uploadedAt: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  category: ItemCategory;
  estimatedValue?: number | null;
  photos?: Photo[];
  createdAt: string;
}

export interface CreateItemDto {
  name: string;
  category: ItemCategory;
  description?: string | null;
  estimatedValue?: number | null;
}

export interface UpdateItemDto {
  name?: string;
  description?: string | null;
  category?: ItemCategory;
  estimatedValue?: number | null;
}

// --- Pagination ---

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
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
