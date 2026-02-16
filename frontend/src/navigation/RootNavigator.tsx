import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TestScreenA } from '../screens/TestScreenA';
import { TestScreenB } from '../screens/TestScreenB';

export type RootStackParamList = {
  ScreenA: undefined;
  ScreenB: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="ScreenA">
      <Stack.Screen name="ScreenA" component={TestScreenA} options={{ title: 'Screen A' }} />
      <Stack.Screen name="ScreenB" component={TestScreenB} options={{ title: 'Screen B' }} />
    </Stack.Navigator>
  );
}
