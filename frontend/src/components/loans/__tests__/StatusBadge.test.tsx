import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBadge } from '../StatusBadge';
import type { LoanStatus } from '../../../types/api.types';

function renderBadge(status: LoanStatus, size?: 'small' | 'medium') {
  return render(
    <PaperProvider>
      <StatusBadge status={status} size={size} />
    </PaperProvider>,
  );
}

describe('StatusBadge', () => {
  const statuses: { status: LoanStatus; expectedText: RegExp }[] = [
    { status: 'PENDING_CONFIRMATION', expectedText: /pending/i },
    { status: 'ACTIVE', expectedText: /^active$/i },
    { status: 'ACTIVE_BY_DEFAULT', expectedText: /default/i },
    { status: 'CONTESTED', expectedText: /contested/i },
    { status: 'AWAITING_RETURN', expectedText: /awaiting return/i },
    { status: 'RETURNED', expectedText: /^returned$/i },
    { status: 'NOT_RETURNED', expectedText: /not returned/i },
    { status: 'ABANDONED', expectedText: /abandoned/i },
  ];

  statuses.forEach(({ status, expectedText }) => {
    it(`should render ${status} with correct text`, () => {
      renderBadge(status);

      expect(screen.getByTestId(`status-badge-${status}`)).toBeTruthy();
      expect(screen.getByText(expectedText)).toBeTruthy();
    });
  });

  it('should render in small size', () => {
    renderBadge('ACTIVE', 'small');
    expect(screen.getByTestId('status-badge-ACTIVE')).toBeTruthy();
  });
});
