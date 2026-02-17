import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from '../storage';

// AsyncStorage est automatiquement mocké par @react-native-async-storage/async-storage/jest/async-storage-mock

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('storage', () => {
  it('should store and retrieve access token', async () => {
    await setAccessToken('my-access-token');
    const token = await getAccessToken();
    expect(token).toBe('my-access-token');
  });

  it('should store and retrieve refresh token', async () => {
    await setRefreshToken('my-refresh-token');
    const token = await getRefreshToken();
    expect(token).toBe('my-refresh-token');
  });

  it('should return null when no token is stored', async () => {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  it('should clear all tokens', async () => {
    await setAccessToken('access');
    await setRefreshToken('refresh');
    await clearTokens();
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});
