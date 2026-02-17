const USE_MOCK = process.env.USE_MOCK === 'true';

// Prism ignore le basePath des servers — les routes sont directement sur /auth/login, /loans, etc.
const API_BASE_URL =
  __DEV__ && USE_MOCK
    ? 'http://localhost:3000' // Prism mock server (pas de /v1)
    : __DEV__
      ? 'http://localhost:3001/v1' // Backend local
      : 'https://api.return.app/v1'; // Production

export default API_BASE_URL;
