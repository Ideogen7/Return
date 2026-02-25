import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Portal, Dialog } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface PhotoPickerProps {
  onPhotoPicked: (uri: string) => void;
  currentPhotoCount: number;
  disabled?: boolean;
}

export function PhotoPicker({ onPhotoPicked, currentPhotoCount, disabled }: PhotoPickerProps) {
  const { t } = useTranslation();
  const [dialogVisible, setDialogVisible] = useState(false);
  const isMaxReached = currentPhotoCount >= 5;

  const handleResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    // Validate file size
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      return;
    }

    onPhotoPicked(asset.uri);
  };

  const handleCamera = async () => {
    setDialogVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    handleResult(result);
  };

  const handleGallery = async () => {
    setDialogVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    handleResult(result);
  };

  return (
    <>
      <Button
        mode="outlined"
        icon="camera-plus-outline"
        onPress={() => setDialogVisible(true)}
        disabled={disabled || isMaxReached}
        testID="photo-picker-btn"
        style={styles.button}
      >
        {t('items.addPhoto')}
      </Button>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          testID="photo-picker-dialog"
        >
          <Dialog.Title>{t('items.addPhoto')}</Dialog.Title>
          <Dialog.Actions style={styles.dialogActions}>
            <Button icon="camera" onPress={handleCamera} testID="photo-picker-camera">
              {t('items.takePhoto')}
            </Button>
            <Button icon="image" onPress={handleGallery} testID="photo-picker-gallery">
              {t('items.chooseFromGallery')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, borderColor: '#C9C4BB' },
  dialogActions: { flexDirection: 'column', alignItems: 'stretch', paddingHorizontal: 16 },
});
