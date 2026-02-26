export const MediaTypeOptions = {
  Images: 'Images',
};

export const launchCameraAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [
    {
      uri: 'file:///tmp/camera-photo.jpg',
      type: 'image/jpeg',
      fileName: 'camera-photo.jpg',
      fileSize: 1024000,
    },
  ],
});

export const launchImageLibraryAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [
    {
      uri: 'file:///tmp/gallery-photo.jpg',
      type: 'image/jpeg',
      fileName: 'gallery-photo.jpg',
      fileSize: 2048000,
    },
  ],
});

export const requestCameraPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  granted: true,
});

export const requestMediaLibraryPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
  granted: true,
});
