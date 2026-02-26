import { Platform } from 'react-native';
import { getMimeType } from '../components/items/PhotoPicker';

/**
 * Build a FormData ready for photo upload.
 * On web, converts the URI (data-url or blob-url) into a real File so Multer
 * can parse the multipart body. On native, uses the RN { uri, type, name } convention.
 */
export async function buildPhotoFormData(uri: string): Promise<FormData> {
  const mimeType = getMimeType(uri);
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const fileName = `photo.${ext}`;

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append('photo', file);
  } else {
    formData.append('photo', {
      uri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob);
  }

  return formData;
}
