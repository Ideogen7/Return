import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { LoanWizard } from '../LoanWizard';
import { useItemStore } from '../../../stores/useItemStore';
import { useBorrowerStore } from '../../../stores/useBorrowerStore';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useItemStore.getState().reset();
  useBorrowerStore.getState().reset();
});
afterAll(() => server.close());

const mockSubmit = jest.fn();

function renderWizard() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <LoanWizard onSubmit={mockSubmit} isLoading={false} />
      </NavigationContainer>
    </PaperProvider>,
  );
}

async function setupStoresWithData() {
  await useItemStore.getState().fetchItems();
  await useBorrowerStore.getState().fetchBorrowers();
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
    await setupStoresWithData();
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
    fireEvent.press(screen.getByTestId('select-item-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 3: select borrower
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-3')).toBeTruthy();
    });
    expect(screen.getByText('Marie Dupont')).toBeTruthy();

    fireEvent.press(screen.getByTestId('select-borrower-5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 4: summary
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-4')).toBeTruthy();
    });
    expect(screen.getByTestId('wizard-submit-btn')).toBeTruthy();
  });

  it('should navigate through 4 steps for MONEY flow', async () => {
    await setupStoresWithData();
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

    fireEvent.press(screen.getByTestId('select-borrower-5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    // Step 4: submit
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-4')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('wizard-submit-btn'));

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        borrowerId: '5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f',
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

  it('should show inline create item button on step 2', async () => {
    renderWizard();

    // Go to step 2
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2')).toBeTruthy();
    });

    expect(screen.getByTestId('inline-create-item-btn')).toBeTruthy();
  });

  it('should show empty state with search contact button on step 3 when no borrowers', async () => {
    await useItemStore.getState().fetchItems();
    renderWizard();

    // Go to step 2
    fireEvent.press(screen.getByTestId('wizard-next-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2')).toBeTruthy();
    });

    // Select item and go to step 3
    fireEvent.press(screen.getByTestId('select-item-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'));
    fireEvent.press(screen.getByTestId('wizard-next-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-3')).toBeTruthy();
    });

    expect(screen.getByTestId('no-borrowers-empty')).toBeTruthy();
    expect(screen.getByTestId('search-contact-btn')).toBeTruthy();
  });
});
