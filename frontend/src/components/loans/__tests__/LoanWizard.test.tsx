import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { LoanWizard } from '../LoanWizard';
import type { Item, Borrower } from '../../../types/api.types';

const mockItems: Item[] = [
  {
    id: 'item-1',
    name: 'Perceuse Bosch',
    category: 'TOOLS',
    createdAt: '2026-02-01T10:00:00Z',
  },
];

const mockBorrowers: Borrower[] = [
  {
    id: 'borrower-1',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie@example.com',
  },
];

const mockSubmit = jest.fn();

function renderWizard(props?: { items?: Item[]; borrowers?: Borrower[] }) {
  return render(
    <PaperProvider>
      <LoanWizard
        onSubmit={mockSubmit}
        isLoading={false}
        items={props?.items ?? mockItems}
        borrowers={props?.borrowers ?? mockBorrowers}
      />
    </PaperProvider>,
  );
}

beforeEach(() => {
  mockSubmit.mockClear();
});

describe('LoanWizard', () => {
  it('should render step 1 with type selection', () => {
    renderWizard();

    expect(screen.getByTestId('loan-wizard')).toBeTruthy();
    expect(screen.getByTestId('wizard-step-1')).toBeTruthy();
    expect(screen.getByTestId('type-object')).toBeTruthy();
    expect(screen.getByTestId('type-money')).toBeTruthy();
  });

  it('should navigate through 4 steps for OBJECT flow', async () => {
    renderWizard();

    // Step 1: select OBJECT (default)
    expect(screen.getByTestId('wizard-step-1')).toBeTruthy();
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 2: select item
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2')).toBeTruthy();
    });
    expect(screen.getByText('Perceuse Bosch')).toBeTruthy();

    // Select the item
    fireEvent.press(screen.getByTestId('select-item-item-1'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 3: select borrower
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-3')).toBeTruthy();
    });
    expect(screen.getByText('Marie Dupont')).toBeTruthy();

    fireEvent.press(screen.getByTestId('select-borrower-borrower-1'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 4: summary
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-4')).toBeTruthy();
    });
    expect(screen.getByTestId('wizard-submit-btn')).toBeTruthy();
  });

  it('should navigate through 4 steps for MONEY flow', async () => {
    renderWizard();

    // Step 1: select MONEY
    fireEvent.press(screen.getByTestId('type-money'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 2: enter amount
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2')).toBeTruthy();
    });
    expect(screen.getByTestId('amount-input')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('amount-input'), '50');
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 3: select borrower
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-3')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('select-borrower-borrower-1'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 4: submit
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-4')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('wizard-submit-btn'));

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        borrower: 'borrower-1',
      }),
    );
  });

  it('should navigate back from step 2', async () => {
    renderWizard();

    // Go to step 2
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2')).toBeTruthy();
    });

    // Go back to step 1
    fireEvent.press(screen.getByTestId('wizard-back-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-1')).toBeTruthy();
    });
  });
});
