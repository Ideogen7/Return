// =============================================================================
// Item Response Interfaces — aligned with OpenAPI Item schema
// =============================================================================

import type { PhotoResponse } from './photo-response.interface.js';

export interface ItemResponse {
  id: string;
  name: string;
  description: string | null;
  category: string;
  estimatedValue: number | null;
  photos: PhotoResponse[];
  createdAt: string; // ISO 8601
}

export interface PaginatedItemsResponse {
  data: ItemResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
