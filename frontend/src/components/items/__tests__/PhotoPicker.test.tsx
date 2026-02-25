import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { PhotoPicker } from '../PhotoPicker';
import * as ImagePicker from 'expo-image-picker';

function renderPicker(props?: Partial<React.ComponentProps<typeof PhotoPicker>>) {
  const defaultProps = {
    onPhotoPicked: jest.fn(),
    currentPhotoCount: 0,
    ...props,
  };
  return {
    ...render(
      <PaperProvider>
        <PhotoPicker {...defaultProps} />
      </PaperProvider>,
    ),
    onPhotoPicked: defaultProps.onPhotoPicked,
  };
}

describe('PhotoPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render add photo button', () => {
    renderPicker();
    expect(screen.getByTestId('photo-picker-btn')).toBeTruthy();
  });

  it('should open dialog on button press', async () => {
    renderPicker();

    fireEvent.press(screen.getByTestId('photo-picker-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-picker-dialog')).toBeTruthy();
      expect(screen.getByTestId('photo-picker-camera')).toBeTruthy();
      expect(screen.getByTestId('photo-picker-gallery')).toBeTruthy();
    });
  });

  it('should launch camera and return uri', async () => {
    const { onPhotoPicked } = renderPicker();

    fireEvent.press(screen.getByTestId('photo-picker-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-picker-camera')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('photo-picker-camera'));

    await waitFor(() => {
      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(onPhotoPicked).toHaveBeenCalledWith('file:///tmp/camera-photo.jpg');
    });
  });

  it('should launch gallery and return uri', async () => {
    const { onPhotoPicked } = renderPicker();

    fireEvent.press(screen.getByTestId('photo-picker-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-picker-gallery')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('photo-picker-gallery'));

    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(onPhotoPicked).toHaveBeenCalledWith('file:///tmp/gallery-photo.jpg');
    });
  });

  it('should be disabled when max photos reached', () => {
    renderPicker({ currentPhotoCount: 5 });

    const btn = screen.getByTestId('photo-picker-btn');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it('should not call onPhotoPicked when camera is canceled', async () => {
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
      canceled: true,
      assets: [],
    });

    const { onPhotoPicked } = renderPicker();

    fireEvent.press(screen.getByTestId('photo-picker-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('photo-picker-camera')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('photo-picker-camera'));

    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });

    expect(onPhotoPicked).not.toHaveBeenCalled();
  });
});
