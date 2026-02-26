import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Photo } from '../../types/api.types';

interface PhotoGalleryProps {
  photos: Photo[];
  onAddPress?: () => void;
  onDeletePress?: (photoId: string) => void;
  maxPhotos?: number;
}

export function PhotoGallery({
  photos,
  onAddPress,
  onDeletePress,
  maxPhotos = 5,
}: PhotoGalleryProps) {
  const { t } = useTranslation();
  const canAdd = photos.length < maxPhotos;

  return (
    <View style={styles.container} testID="photo-gallery">
      <Text variant="labelLarge" style={styles.counter}>
        {t('items.photoCount', { count: photos.length })}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.row}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.thumbWrapper}>
              <Image
                source={{ uri: photo.thumbnailUrl ?? photo.url }}
                style={styles.thumbnail}
                testID={`photo-thumb-${photo.id}`}
              />
              {onDeletePress && (
                <IconButton
                  icon="close-circle"
                  size={20}
                  iconColor="#D97A6B"
                  onPress={() => onDeletePress(photo.id)}
                  style={styles.deleteButton}
                  testID={`photo-delete-${photo.id}`}
                  accessibilityLabel={t('items.deletePhoto')}
                />
              )}
            </View>
          ))}
          {canAdd && onAddPress && (
            <IconButton
              icon="plus"
              mode="outlined"
              size={24}
              onPress={onAddPress}
              style={styles.addButton}
              testID="photo-gallery-add"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  counter: { color: '#6B7A8D', marginBottom: 8 },
  scroll: { flexGrow: 0 },
  row: { flexDirection: 'row', gap: 8 },
  thumbWrapper: { position: 'relative' },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addButton: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderColor: '#C9C4BB',
    borderStyle: 'dashed',
  },
});
