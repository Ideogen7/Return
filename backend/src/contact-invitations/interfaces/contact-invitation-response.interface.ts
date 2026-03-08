// =============================================================================
// Contact Invitation Response Interfaces — aligned with OpenAPI schemas
// =============================================================================

export interface ContactInvitationSenderUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ContactInvitationRecipientUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ContactInvitationResponse {
  id: string;
  status: string;
  senderUser: ContactInvitationSenderUser;
  recipientEmail: string;
  recipientUser: ContactInvitationRecipientUser;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
}

export interface UserSearchResultResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  alreadyContact: boolean;
  pendingInvitation: boolean;
  pendingInvitationId: string | null;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedContactInvitationsResponse {
  data: ContactInvitationResponse[];
  pagination: PaginationMetadata;
}

export interface PaginatedUserSearchResultsResponse {
  data: UserSearchResultResponse[];
  pagination: PaginationMetadata;
}
