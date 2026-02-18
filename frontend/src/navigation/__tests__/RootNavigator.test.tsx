import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';

function renderNavigator() {
  return render(
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>,
  );
}

describe('RootNavigator', () => {
  it('should display Screen A by default', () => {
    renderNavigator();
    expect(screen.getByText('Screen A')).toBeTruthy();
  });

  it('should navigate to Screen B when button is pressed', () => {
    renderNavigator();
    fireEvent.press(screen.getByText('Go to Screen B'));
    expect(screen.getByText('Screen B')).toBeTruthy();
  });
});
