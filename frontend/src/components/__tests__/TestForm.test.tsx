import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TestForm } from '../TestForm';

describe('TestForm', () => {
  it('should display email and password inputs', () => {
    render(<TestForm />);
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
  });

  it('should show error when email is invalid', async () => {
    render(<TestForm />);
    fireEvent.changeText(screen.getByTestId('email-input'), 'not-an-email');
    fireEvent.press(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeTruthy();
    });
  });

  it('should call onSubmit with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<TestForm onSubmit={mockSubmit} />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'SecureP@ss1');
    fireEvent.press(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit.mock.calls[0]![0]).toEqual({
        email: 'test@example.com',
        password: 'SecureP@ss1',
      });
    });
  });
});
