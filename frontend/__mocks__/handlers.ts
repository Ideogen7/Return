import { http, HttpResponse } from 'msw';

// Prism ignore le basePath — les routes sont directement /auth/login, /loans, etc.
const API_BASE = 'http://localhost:3000';

export const handlers = [
  // POST /auth/login
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json(
      {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2026-02-01T10:00:00Z',
        },
      },
      { status: 200 },
    );
  }),

  // POST /auth/register
  http.post(`${API_BASE}/auth/register`, () => {
    return HttpResponse.json(
      {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          createdAt: '2026-02-16T10:00:00Z',
        },
      },
      { status: 201 },
    );
  }),

  // POST /auth/refresh
  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json(
      {
        accessToken: 'mock-new-access-token',
        refreshToken: 'mock-new-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      { status: 200 },
    );
  }),

  // GET /loans
  http.get(`${API_BASE}/loans`, () => {
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
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      { status: 200 },
    );
  }),

  // GET /loans/:id — 404 example
  http.get(`${API_BASE}/loans/:id`, ({ params }) => {
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
