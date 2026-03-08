import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, StyleSheet, View, ScrollView } from 'react-native';
import { ActivityIndicator, FAB, Icon, Text, Chip, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemCard, CATEGORY_I18N } from '../../components/items/ItemCard';
import { useItemStore } from '../../stores/useItemStore';
import type { ItemStackParamList } from '../../navigation/types';
import type { Item, ItemCategory } from '../../types/api.types';

const CATEGORIES: ItemCategory[] = [
  'TOOLS',
  'ELECTRONICS',
  'BOOKS',
  'SPORTS',
  'KITCHEN',
  'GARDEN',
  'MONEY',
  'OTHER',
];

type Props = NativeStackScreenProps<ItemStackParamList, 'ItemList'>;

export function ItemListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { items, isLoading, error, fetchItems } = useItemStore();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>();
  const [availableOnly, setAvailableOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchItems({ category: selectedCategory, available: availableOnly || undefined }).catch(
        () => {},
      );
    }, [fetchItems, selectedCategory, availableOnly]),
  );

  const handlePress = (id: string) => {
    navigation.navigate('ItemDetail', { id });
  };

  const handleCategoryPress = (cat: ItemCategory) => {
    setSelectedCategory((prev) => (prev === cat ? undefined : cat));
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centerContainer} testID="item-error">
        <Icon source="alert-circle-outline" size={64} color="#D97A6B" />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          {t('errors.unknownError')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="item-list">
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={selectedCategory === cat}
                onPress={() => handleCategoryPress(cat)}
                style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                textStyle={selectedCategory === cat ? styles.chipTextSelected : undefined}
                testID={`filter-chip-${cat}`}
              >
                {t(CATEGORY_I18N[cat])}
              </Chip>
            ))}
          </View>
        </ScrollView>
        <View style={styles.switchRow}>
          <Text variant="bodyMedium" style={styles.switchLabel}>
            {t('items.availableOnly')}
          </Text>
          <Switch
            value={availableOnly}
            onValueChange={setAvailableOnly}
            color="#6B8E7B"
            testID="available-switch"
          />
        </View>
      </View>

      <FlatList<Item>
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemCard item={item} onPress={handlePress} />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState} testID="item-empty">
            <Icon source="package-variant-closed" size={64} color="#C9C4BB" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {t('items.emptyList')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {t('items.emptyListSubtitle')}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateItem')}
        testID="add-item-fab"
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filters: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#EDE9E2' },
  chipSelected: { backgroundColor: '#D0E4DB' },
  chipTextSelected: { color: '#4A6355', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  switchLabel: { color: '#6B7A8D', marginRight: 8 },
  listContent: { paddingTop: 12, paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { color: '#2D3748', fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#6B7A8D', marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6B8E7B',
    borderRadius: 16,
  },
});
