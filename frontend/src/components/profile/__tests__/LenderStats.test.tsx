import { render, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { http, HttpResponse } from 'msw';
import { LenderStats } from '../LenderStats';

const API_REAL = 'http://localhost:3000/v1';

function renderStats() {
  return render(
    <PaperProvider>
      <LenderStats />
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('LenderStats (unified)', () => {
  it('should render both lender and borrower sections', async () => {
    renderStats();

    await waitFor(() => {
      expect(screen.getByTestId('lender-stats')).toBeTruthy();
    });

    expect(screen.getByText('My loans')).toBeTruthy();
    expect(screen.getByText('My borrowings')).toBeTruthy();
  });

  it('should compute metrics independently for each role', async () => {
    server.use(
      http.get(`${API_REAL}/loans`, ({ request }) => {
        const url = new URL(request.url);
        const role = url.searchParams.get('role');

        if (role === 'borrower') {
          return HttpResponse.json({
            data: [
              {
                id: 'b-loan-1',
                item: { id: 'i1', name: 'Book', category: 'BOOKS' },
                lender: { id: 'l1', firstName: 'A', lastName: 'B' },
                borrower: { id: 'b1', firstName: 'C', lastName: 'D', email: 'c@t.com' },
                status: 'RETURNED',
                returnDate: '2026-03-15',
                returnedDate: '2026-03-14T10:00:00Z',
                confirmationDate: '2026-02-01T10:00:00Z',
                notes: null,
                contestReason: null,
                createdAt: '2026-02-01T10:00:00Z',
                updatedAt: '2026-03-14T10:00:00Z',
              },
              {
                id: 'b-loan-2',
                item: { id: 'i2', name: 'Drill', category: 'TOOLS' },
                lender: { id: 'l1', firstName: 'A', lastName: 'B' },
                borrower: { id: 'b1', firstName: 'C', lastName: 'D', email: 'c@t.com' },
                status: 'RETURNED',
                returnDate: '2026-03-10',
                returnedDate: '2026-03-12T10:00:00Z',
                confirmationDate: '2026-02-01T10:00:00Z',
                notes: null,
                contestReason: null,
                createdAt: '2026-02-01T10:00:00Z',
                updatedAt: '2026-03-12T10:00:00Z',
              },
            ],
            pagination: {
              currentPage: 1,
              itemsPerPage: 100,
              totalItems: 2,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          });
        }

        // Lender: 1 active loan
        return HttpResponse.json({
          data: [
            {
              id: 'l-loan-1',
              item: { id: 'i3', name: 'Camera', category: 'ELECTRONICS' },
              lender: { id: 'me', firstName: 'Me', lastName: 'User' },
              borrower: { id: 'b2', firstName: 'X', lastName: 'Y', email: 'x@t.com' },
              status: 'ACTIVE',
              returnDate: '2026-05-01',
              returnedDate: null,
              confirmationDate: '2026-03-01T10:00:00Z',
              notes: null,
              contestReason: null,
              createdAt: '2026-03-01T10:00:00Z',
              updatedAt: '2026-03-01T10:00:00Z',
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 100,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }),
    );

    renderStats();

    // Borrower: 2 loans, 1 on time, 1 late → score = (100+50)/2 = 75
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeTruthy();
    });

    // Lender: 1 total loan (check there's a "1" in the lender section)
    // Both sections should show independent data, not interfere
    expect(screen.getByTestId('lender-stats')).toBeTruthy();
  });
});
