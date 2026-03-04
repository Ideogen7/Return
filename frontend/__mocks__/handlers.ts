import { http, HttpResponse } from 'msw';

// Modules réels (auth, users) → /v1 prefix (getBaseUrl retourne http://localhost:3000/v1)
// Modules mockés (loans, etc.) → pas de /v1 (getBaseUrl retourne http://localhost:4010)
const API_REAL = 'http://localhost:3000/v1';
const _API_MOCK = 'http://localhost:4010';

// --- Données mock réutilisables ---

const mockUser = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'LENDER' as const,
  profilePicture: null,
  createdAt: '2026-02-01T10:00:00Z',
  lastLoginAt: '2026-02-18T08:00:00Z',
};

const mockBorrower = {
  id: '5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f',
  firstName: 'Marie',
  lastName: 'Dupont',
  email: 'marie.dupont@example.com',
  phoneNumber: '+33612345678',
  userId: null,
  statistics: {
    totalLoans: 5,
    returnedOnTime: 3,
    returnedLate: 1,
    notReturned: 1,
    averageReturnDelay: 2,
    trustScore: 75,
  },
};

const mockBorrowerStats = {
  totalLoans: 5,
  returnedOnTime: 3,
  returnedLate: 1,
  notReturned: 1,
  averageReturnDelay: 2,
  trustScore: 75,
};

const mockPhoto = {
  id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  url: 'https://storage.return.app/items/photo1.jpg',
  thumbnailUrl: 'https://storage.return.app/items/photo1_thumb.jpg',
  uploadedAt: '2026-02-20T14:00:00Z',
};

const mockItem = {
  id: '9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  name: 'Perceuse Bosch',
  description: 'Perceuse visseuse sans fil 18V',
  category: 'TOOLS' as const,
  estimatedValue: 89.99,
  photos: [{ ...mockPhoto }],
  createdAt: '2026-02-10T10:00:00Z',
};

const mockLoan = {
  id: '7f3c9a2b-4d1e-4a8f-9c7b-1e3f5a6b8c9d',
  item: { ...mockItem },
  lender: {
    id: mockUser.id,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    profilePicture: null,
  },
  borrower: { ...mockBorrower },
  status: 'ACTIVE' as const,
  returnDate: '2026-04-15',
  confirmationDate: '2026-02-02T10:00:00Z',
  returnedDate: null,
  notes: 'Avec 2 batteries et chargeur',
  contestReason: null,
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-02T10:00:00Z',
};

const mockSettings = {
  pushNotificationsEnabled: true,
  reminderEnabled: true,
  language: 'fr' as const,
  timezone: 'Europe/Paris',
};

export const handlers = [
  // =========================================================================
  // AUTHENTICATION
  // =========================================================================

  // POST /auth/login
  http.post(`${API_REAL}/auth/login`, () => {
    return HttpResponse.json(
      {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: { ...mockUser },
      },
      { status: 200 },
    );
  }),

  // POST /auth/register
  http.post(`${API_REAL}/auth/register`, () => {
    return HttpResponse.json(
      {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          ...mockUser,
          id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          email: 'new@example.com',
          firstName: 'Jane',
          createdAt: '2026-02-16T10:00:00Z',
          lastLoginAt: null,
        },
      },
      { status: 201 },
    );
  }),

  // POST /auth/refresh
  http.post(`${API_REAL}/auth/refresh`, () => {
    return HttpResponse.json(
      {
        accessToken: 'mock-new-access-token',
        refreshToken: 'mock-new-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: { ...mockUser },
      },
      { status: 200 },
    );
  }),

  // POST /auth/logout
  http.post(`${API_REAL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // =========================================================================
  // USERS — Profil
  // =========================================================================

  // GET /users/me
  http.get(`${API_REAL}/users/me`, () => {
    return HttpResponse.json({ ...mockUser, settings: { ...mockSettings } }, { status: 200 });
  }),

  // PATCH /users/me
  http.patch(`${API_REAL}/users/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockUser, ...body }, { status: 200 });
  }),

  // DELETE /users/me
  http.delete(`${API_REAL}/users/me`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // PUT /users/me/avatar
  http.put(`${API_REAL}/users/me/avatar`, () => {
    return HttpResponse.json(
      { ...mockUser, profilePicture: 'https://storage.return.app/users/avatar.jpg' },
      { status: 200 },
    );
  }),

  // =========================================================================
  // USERS — Mot de passe
  // =========================================================================

  // PATCH /users/me/password
  http.patch(`${API_REAL}/users/me/password`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // =========================================================================
  // USERS — Settings
  // =========================================================================

  // GET /users/me/settings
  http.get(`${API_REAL}/users/me/settings`, () => {
    return HttpResponse.json({ ...mockSettings }, { status: 200 });
  }),

  // PATCH /users/me/settings
  http.patch(`${API_REAL}/users/me/settings`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockSettings, ...body }, { status: 200 });
  }),

  // =========================================================================
  // BORROWERS
  // =========================================================================

  // GET /borrowers
  http.get(`${API_REAL}/borrowers`, () => {
    return HttpResponse.json(
      {
        data: [{ ...mockBorrower }],
        pagination: {
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      { status: 200 },
    );
  }),

  // POST /borrowers
  http.post(`${API_REAL}/borrowers`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...mockBorrower,
        id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        ...body,
      },
      { status: 201 },
    );
  }),

  // GET /borrowers/:id
  http.get(`${API_REAL}/borrowers/:id`, ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json(
        {
          type: 'https://api.return.app/errors/borrower-not-found',
          title: 'Borrower Not Found',
          status: 404,
          detail: `The borrower with ID '${params.id}' does not exist.`,
          instance: `/v1/borrowers/${params.id}`,
          timestamp: new Date().toISOString(),
          requestId: 'req-mock',
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({ ...mockBorrower, id: params.id }, { status: 200 });
  }),

  // PATCH /borrowers/:id
  http.patch(`${API_REAL}/borrowers/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockBorrower, id: params.id, ...body }, { status: 200 });
  }),

  // DELETE /borrowers/:id
  http.delete(`${API_REAL}/borrowers/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /borrowers/:id/statistics
  http.get(`${API_REAL}/borrowers/:id/statistics`, () => {
    return HttpResponse.json({ ...mockBorrowerStats }, { status: 200 });
  }),

  // GET /borrowers/:id/loans
  http.get(`${API_REAL}/borrowers/:id/loans`, () => {
    return HttpResponse.json([], { status: 200 });
  }),

  // =========================================================================
  // ITEMS
  // =========================================================================

  // GET /items
  http.get(`${API_REAL}/items`, () => {
    return HttpResponse.json(
      {
        data: [{ ...mockItem }],
        pagination: {
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      { status: 200 },
    );
  }),

  // POST /items
  http.post(`${API_REAL}/items`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...mockItem,
        id: 'new-item-id-1234',
        photos: [],
        ...body,
      },
      { status: 201 },
    );
  }),

  // GET /items/:itemId
  http.get(`${API_REAL}/items/:itemId`, ({ params }) => {
    if (params.itemId === 'not-found') {
      return HttpResponse.json(
        {
          type: 'https://api.return.app/errors/item-not-found',
          title: 'Item Not Found',
          status: 404,
          detail: `The item with ID '${params.itemId}' does not exist.`,
          instance: `/v1/items/${params.itemId}`,
          timestamp: new Date().toISOString(),
          requestId: 'req-mock',
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({ ...mockItem, id: params.itemId }, { status: 200 });
  }),

  // PATCH /items/:itemId
  http.patch(`${API_REAL}/items/:itemId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockItem, id: params.itemId, ...body }, { status: 200 });
  }),

  // DELETE /items/:itemId
  http.delete(`${API_REAL}/items/:itemId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /items/:itemId/photos
  http.post(`${API_REAL}/items/:itemId/photos`, () => {
    return HttpResponse.json(
      {
        id: 'p-new-photo-id',
        url: 'https://storage.return.app/items/new-photo.jpg',
        thumbnailUrl: 'https://storage.return.app/items/new-photo_thumb.jpg',
        uploadedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // DELETE /items/:itemId/photos/:photoId
  http.delete(`${API_REAL}/items/:itemId/photos/:photoId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // =========================================================================
  // LOANS
  // =========================================================================

  // GET /loans
  http.get(`${API_REAL}/loans`, ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');

    if (role === 'borrower') {
      return HttpResponse.json(
        {
          data: [
            {
              ...mockLoan,
              id: 'borrower-loan-1',
              status: 'RETURNED' as const,
              returnDate: '2026-03-15',
              returnedDate: '2026-03-14T10:00:00Z',
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      {
        data: [{ ...mockLoan }],
        pagination: {
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      { status: 200 },
    );
  }),

  // POST /loans
  http.post(`${API_REAL}/loans`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...mockLoan,
        id: 'new-loan-id-1234',
        status: 'PENDING_CONFIRMATION',
        confirmationDate: null,
        notes: (body.notes as string) ?? null,
        returnDate: (body.returnDate as string) ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // GET /loans/:id
  http.get(`${API_REAL}/loans/:id`, ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json(
        {
          type: 'https://api.return.app/errors/loan-not-found',
          title: 'Loan Not Found',
          status: 404,
          detail: `The loan with ID '${params.id}' does not exist.`,
          instance: `/v1/loans/${params.id}`,
          timestamp: new Date().toISOString(),
          requestId: 'req-mock',
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({ ...mockLoan, id: params.id }, { status: 200 });
  }),

  // PATCH /loans/:id
  http.patch(`${API_REAL}/loans/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ...mockLoan, id: params.id, ...body, updatedAt: new Date().toISOString() },
      { status: 200 },
    );
  }),

  // DELETE /loans/:id
  http.delete(`${API_REAL}/loans/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // PATCH /loans/:id/status
  http.patch(`${API_REAL}/loans/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const status = typeof body.status === 'string' ? body.status : mockLoan.status;
    return HttpResponse.json(
      {
        ...mockLoan,
        id: params.id,
        status,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  // POST /loans/:id/confirm
  http.post(`${API_REAL}/loans/:id/confirm`, ({ params }) => {
    return HttpResponse.json(
      {
        ...mockLoan,
        id: params.id,
        status: 'ACTIVE',
        confirmationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),

  // POST /loans/:id/contest
  http.post(`${API_REAL}/loans/:id/contest`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...mockLoan,
        id: params.id,
        status: 'CONTESTED',
        contestReason: body.reason,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  }),
];
