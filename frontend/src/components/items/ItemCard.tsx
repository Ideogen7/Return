import { View, Image, StyleSheet } from 'react-native';
import { Text, TouchableRipple, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ui } from '../../config/theme.config';
import type { Item, ItemCategory } from '../../types/api.types';

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  TOOLS: 'hammer-wrench',
  ELECTRONICS: 'laptop',
  BOOKS: 'book-open-variant',
  SPORTS: 'basketball',
  KITCHEN: 'silverware-fork-knife',
  GARDEN: 'flower',
  GAMES: 'gamepad-variant',
  OTHER: 'package-variant-closed',
};

const CATEGORY_I18N: Record<ItemCategory, string> = {
  TOOLS: 'items.categoryTools',
  ELECTRONICS: 'items.categoryElectronics',
  BOOKS: 'items.categoryBooks',
  SPORTS: 'items.categorySports',
  KITCHEN: 'items.categoryKitchen',
  GARDEN: 'items.categoryGarden',
  GAMES: 'items.categoryGames',
  OTHER: 'items.categoryOther',
};

interface ItemCardProps {
  item: Item;
  onPress: (id: string) => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  const { t } = useTranslation();
  const hasPhoto = item.photos && item.photos.length > 0;

  return (
    <TouchableRipple
      onPress={() => onPress(item.id)}
      testID={`item-card-${item.id}`}
      style={[styles.card, ui.card]}
    >
      <View style={styles.content}>
        {hasPhoto ? (
          <Image
            source={{ uri: item.photos![0]!.thumbnailUrl ?? item.photos![0]!.url }}
            style={styles.thumbnail}
            testID={`item-photo-${item.id}`}
          />
        ) : (
          <View style={styles.iconContainer}>
            <Icon source={CATEGORY_ICONS[item.category]} size={28} color="#4A6355" />
          </View>
        )}
        <View style={styles.info}>
          <Text variant="titleMedium" style={styles.name} testID={`item-name-${item.id}`}>
            {item.name}
          </Text>
          <Text variant="bodyMedium" style={styles.category}>
            {t(CATEGORY_I18N[item.category])}
          </Text>
          {item.estimatedValue != null && (
            <Text variant="bodySmall" style={styles.value}>
              {item.estimatedValue.toFixed(2)} €
            </Text>
          )}
        </View>
      </View>
    </TouchableRipple>
  );
}

export { CATEGORY_ICONS, CATEGORY_I18N };

const styles = StyleSheet.create({
  card: { padding: 16, marginHorizontal: 16, marginBottom: 8 },
  content: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#D0E4DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  name: { color: '#2D3748', fontWeight: '600' },
  category: { color: '#6B7A8D', marginTop: 2 },
  value: { color: '#A8B5BF', marginTop: 2 },
});
