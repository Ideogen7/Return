import { render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { LenderStats } from '../LenderStats';
import { useHistoryStore } from '../../../stores/useHistoryStore';
import type { HistoryStatistics } from '../../../types/api.types';

// Helper to build a minimal HistoryStatistics fixture
function makeStats(overrides: Partial<HistoryStatistics['overview']> = {}): HistoryStatistics {
  return {
    overview: {
      totalLoans: 0,
      activeLoans: 0,
      returnedLoans: 0,
      notReturnedLoans: 0,
      contestedLoans: 0,
      averageReturnDelay: 0,
      ...overrides,
    },
    byCategory: [],
    topBorrowers: [],
    mostLoanedItems: [],
  };
}

function renderStats() {
  return render(
    <PaperProvider>
      <LenderStats />
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useHistoryStore.getState().reset();
});
afterAll(() => server.close());

describe('LenderStats (unified)', () => {
  describe('lender section — reads from useHistoryStore', () => {
    it('should render both lender and borrower sections', async () => {
      useHistoryStore.setState({ statistics: makeStats() });

      renderStats();

      await waitFor(() => {
        expect(screen.getByTestId('lender-stats')).toBeTruthy();
      });

      expect(screen.getByText('My loans')).toBeTruthy();
      expect(screen.getByText('My borrowings')).toBeTruthy();
    });

    it('should display lender overview values from the store', async () => {
      useHistoryStore.setState({
        statistics: makeStats({ totalLoans: 5, activeLoans: 2, returnedLoans: 3 }),
      });

      renderStats();

      await waitFor(() => {
        expect(screen.getByTestId('lender-stats')).toBeTruthy();
      });

      // Each stat value is rendered as a Text node — check for numeric display
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should display activeLoans as-is from the store (no client-side over-counting — FIX-06 non-regression)', async () => {
      // The backend endpoint already excludes CONTESTED loans from activeLoans.
      // The component must display the raw value — no filtering on the client.
      useHistoryStore.setState({
        statistics: makeStats({ totalLoans: 9, activeLoans: 7, returnedLoans: 2 }),
      });

      renderStats();

      await waitFor(() => {
        expect(screen.getByTestId('lender-stats')).toBeTruthy();
      });

      // activeLoans value (7) is displayed verbatim from the store — no client recount
      expect(screen.getByText('7')).toBeTruthy();
    });

    it('should fall back to zeros when statistics is null in the store', async () => {
      // statistics stays null (default after reset) — no crash, values default to 0
      useHistoryStore.setState({ statistics: null });

      renderStats();

      await waitFor(() => {
        expect(screen.getByTestId('lender-stats')).toBeTruthy();
      });

      // Three lender stat cards each display "0"
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });

    it('should NOT render the overdue label (FIX-14: overdue card was removed)', async () => {
      useHistoryStore.setState({
        statistics: makeStats({ totalLoans: 10, activeLoans: 3, returnedLoans: 6 }),
      });

      renderStats();

      await waitFor(() => {
        expect(screen.getByTestId('lender-stats')).toBeTruthy();
      });

      // "Overdue" is the en.json translation for profile.overdueLoans
      expect(screen.queryByText('Overdue')).toBeNull();
    });
  });

  describe('borrower section — reads from GET /loans?role=borrower via MSW', () => {
    it('should display the global trust score from GET /users/me/trust-score (FIX-15)', async () => {
      // Default handler returns { trustScore: 87 } — the global value, not the client recalculation.
      useHistoryStore.setState({ statistics: makeStats() });
      renderStats();
      await waitFor(() => {
        expect(screen.getByText('87%')).toBeTruthy();
      });
    });

    it('should fall back to the client-side trust score when the global endpoint is unavailable (FIX-15)', async () => {
      // Endpoint not shipped yet (Ozias) → 404 → component falls back to computeBorrowerMetrics()
      server.use(
        http.get('*/users/me/trust-score', () =>
          HttpResponse.json({ detail: 'Not Found' }, { status: 404 }),
        ),
      );
      useHistoryStore.setState({ statistics: makeStats() });
      renderStats();
      // Default borrower loans handler → 1 RETURNED-on-time loan → client score 100%
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeTruthy();
      });
    });

    it('should keep borrower section intact alongside lender section (non-regression)', async () => {
      useHistoryStore.setState({
        statistics: makeStats({ totalLoans: 5, activeLoans: 2, returnedLoans: 3 }),
      });

      renderStats();

      await waitFor(() => {
        expect(screen.getByTestId('lender-stats')).toBeTruthy();
      });

      // Trust score card from borrower section is present
      expect(screen.getByText('Trust')).toBeTruthy();
    });
  });
});
