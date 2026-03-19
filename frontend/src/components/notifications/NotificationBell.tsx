import { View, StyleSheet } from 'react-native';
import { IconButton, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useNotificationStore } from '../../stores/useNotificationStore';

export function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const navigation = useNavigation();

  return (
    <View style={styles.container} testID="notification-bell">
      <IconButton
        icon="bell-outline"
        size={22}
        onPress={() =>
          (navigation as { navigate: (screen: string) => void }).navigate('NotificationList')
        }
        testID="notification-bell-btn"
        style={styles.button}
      />
      {unreadCount > 0 && (
        <Badge size={16} style={styles.badge} testID="notification-badge">
          {unreadCount}
        </Badge>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', marginRight: 4 },
  button: { margin: 0 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#D97A6B',
  },
});
