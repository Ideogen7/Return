// Basculement progressif mock → backend réel, module par module
const MOCK_MODULES: Record<string, boolean> = {
  auth: true,
  borrowers: true,
  items: true,
  loans: true,
  reminders: true,
  notifications: true,
  history: true,
};

export function getBaseUrl(endpoint: string): string {
  const module = endpoint.split('/')[1]; // Ex: /auth/login → 'auth'

  // Prism ignore le basePath des servers — les routes sont directement sur /auth/login, /loans, etc.
  if (module && MOCK_MODULES[module]) {
    return 'http://localhost:3000'; // Prism mock server (pas de /v1)
  }

  return __DEV__ ? 'http://localhost:3001/v1' : 'https://api.return.app/v1';
}
