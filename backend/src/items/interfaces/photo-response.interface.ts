// =============================================================================
// Photo Response Interface — aligned with OpenAPI Photo schema
// =============================================================================

export interface PhotoResponse {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  uploadedAt: string; // ISO 8601
}
