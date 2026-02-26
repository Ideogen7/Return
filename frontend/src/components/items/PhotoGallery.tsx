import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Photo } from '../../types/api.types';

interface PhotoGalleryProps {
  photos: Photo[];
  onAddPress?: () => void;
  maxPhotos?: number;
}

export function PhotoGallery({ photos, onAddPress, maxPhotos = 5 }: PhotoGalleryProps) {
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
            <Image
              key={photo.id}
              source={{ uri: photo.thumbnailUrl ?? photo.url }}
              style={styles.thumbnail}
              testID={`photo-thumb-${photo.id}`}
            />
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
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  addButton: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderColor: '#C9C4BB',
    borderStyle: 'dashed',
  },
});
