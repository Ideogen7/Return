import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ItemListScreen } from '../screens/items/ItemListScreen';
import { CreateItemScreen } from '../screens/items/CreateItemScreen';
import { ItemDetailScreen } from '../screens/items/ItemDetailScreen';
import { EditItemScreen } from '../screens/items/EditItemScreen';
import type { ItemStackParamList } from './types';

const Stack = createNativeStackNavigator<ItemStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#2D3748',
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

export function ItemNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ItemList"
        component={ItemListScreen}
        options={{ title: t('items.title') }}
      />
      <Stack.Screen
        name="CreateItem"
        component={CreateItemScreen}
        options={{ title: t('items.addItem') }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: t('items.details') }}
      />
      <Stack.Screen
        name="EditItem"
        component={EditItemScreen}
        options={{ title: t('items.editItem') }}
      />
    </Stack.Navigator>
  );
}
