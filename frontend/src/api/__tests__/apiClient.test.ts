import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server';
import { setAccessToken, setRefreshToken, getAccessToken, clearTokens } from '../../utils/storage';
import apiClient from '../apiClient';

beforeEach(async () => {
  await clearTokens();
});

describe('apiClient', () => {
  it('should add Bearer token to request headers', async () => {
    await setAccessToken('test-token');

    server.use(
      http.get('http://localhost:3000/loans', ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        return HttpResponse.json({ authHeader });
      }),
    );

    server.listen();
    const response = await apiClient.get('/loans');
    expect(response.data.authHeader).toBe('Bearer test-token');
    server.close();
  });

  it('should refresh token on 401 and retry the request', async () => {
    await setAccessToken('expired-token');
    await setRefreshToken('valid-refresh-token');

    let callCount = 0;

    server.use(
      http.get('http://localhost:3000/loans', ({ request }) => {
        callCount++;
        const authHeader = request.headers.get('Authorization');
        if (authHeader === 'Bearer expired-token') {
          return HttpResponse.json(
            { type: 'https://api.return.app/errors/unauthorized', status: 401 },
            { status: 401 },
          );
        }
        return HttpResponse.json({ data: [], authHeader });
      }),
      http.post('http://localhost:3000/auth/refresh', () => {
        return HttpResponse.json({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        });
      }),
    );

    server.listen();
    const response = await apiClient.get('/loans');
    expect(response.data.authHeader).toBe('Bearer new-access-token');
    expect(callCount).toBe(2);

    const storedToken = await getAccessToken();
    expect(storedToken).toBe('new-access-token');
    server.close();
  });

  it('should clear tokens if refresh fails', async () => {
    await setAccessToken('expired-token');
    await setRefreshToken('invalid-refresh-token');

    server.use(
      http.get('http://localhost:3000/loans', () => {
        return HttpResponse.json(
          { type: 'https://api.return.app/errors/unauthorized', status: 401 },
          { status: 401 },
        );
      }),
      http.post('http://localhost:3000/auth/refresh', () => {
        return HttpResponse.json(
          { type: 'https://api.return.app/errors/invalid-refresh-token', status: 401 },
          { status: 401 },
        );
      }),
    );

    server.listen();
    await expect(apiClient.get('/loans')).rejects.toThrow();

    const storedToken = await getAccessToken();
    expect(storedToken).toBeNull();
    server.close();
  });

  it('should clear tokens if no refresh token is available on 401', async () => {
    await setAccessToken('expired-token');
    // Pas de refresh token

    server.use(
      http.get('http://localhost:3000/loans', () => {
        return HttpResponse.json(
          { type: 'https://api.return.app/errors/unauthorized', status: 401 },
          { status: 401 },
        );
      }),
    );

    server.listen();
    await expect(apiClient.get('/loans')).rejects.toThrow();

    const storedToken = await getAccessToken();
    expect(storedToken).toBeNull();
    server.close();
  });
});
