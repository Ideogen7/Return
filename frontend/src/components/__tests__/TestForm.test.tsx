import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { TestForm } from '../TestForm';

function renderWithProviders(ui: React.ReactElement) {
  return render(<PaperProvider>{ui}</PaperProvider>);
}

describe('TestForm', () => {
  it('should display email and password inputs', () => {
    renderWithProviders(<TestForm />);
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
  });

  it('should show error when email is invalid', async () => {
    renderWithProviders(<TestForm />);
    fireEvent.changeText(screen.getByTestId('email-input'), 'not-an-email');
    fireEvent.press(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeTruthy();
    });
  });

  it('should call onSubmit with valid data', async () => {
    const mockSubmit = jest.fn();
    renderWithProviders(<TestForm onSubmit={mockSubmit} />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'SecureP@ss1');
    fireEvent.press(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit.mock.calls[0]![0]).toEqual({
        email: 'test@example.com',
        password: 'SecureP@ss1',
      });
    });
  });
});
