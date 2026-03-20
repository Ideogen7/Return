import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string; // MaterialCommunityIcons name
  color?: string;
  testID?: string;
}

export function StatCard({ title, value, icon, color = '#6B8E7B', testID }: StatCardProps) {
  return (
    <Card style={styles.card} testID={testID}>
      <Card.Content style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
          <Icon source={icon} size={24} color={color} />
        </View>
        <Text variant="headlineSmall" style={[styles.value, { color }]}>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9E2',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 4,
  },
  title: {
    color: '#6B7A8D',
    textAlign: 'center',
  },
});
