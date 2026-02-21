import { http, HttpResponse } from 'msw';

// Modules réels (auth, users) → /v1 prefix (getBaseUrl retourne http://localhost:3000/v1)
// Modules mockés (loans, etc.) → pas de /v1 (getBaseUrl retourne http://localhost:3000)
const API_REAL = 'http://localhost:3000/v1';
const API_MOCK = 'http://localhost:3000';

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
  // LOANS
  // =========================================================================

  // GET /loans
  http.get(`${API_MOCK}/loans`, () => {
    return HttpResponse.json(
      {
        data: [
          {
            id: '7f3c9a2b-4d1e-4a8f-9c7b-1e3f5a6b8c9d',
            type: 'OBJECT',
            status: 'ACTIVE',
            item: { id: '9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', name: 'Perceuse Bosch' },
            borrower: {
              id: '5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f',
              firstName: 'Marie',
              lastName: 'Dupont',
            },
            returnDate: '2026-04-15',
            createdAt: '2026-02-01T10:00:00Z',
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
  }),

  // GET /loans/:id — 404 example
  http.get(`${API_MOCK}/loans/:id`, ({ params }) => {
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

    return HttpResponse.json(
      {
        id: params.id,
        type: 'OBJECT',
        status: 'ACTIVE',
        item: { id: '9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', name: 'Perceuse Bosch' },
        borrower: {
          id: '5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f',
          firstName: 'Marie',
          lastName: 'Dupont',
        },
        returnDate: '2026-04-15',
        createdAt: '2026-02-01T10:00:00Z',
      },
      { status: 200 },
    );
  }),
];
