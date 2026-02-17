# API_MOCKING_STRATEGY.md

**Return ↺ - Stratégie de Mocking de l'API**

---

## 1. Pourquoi Mocker l'API ?

Le mocking de l'API permet de :

- **Développement parallèle** : Le frontend peut progresser sans attendre le backend
- **Tests isolés** : Valider le comportement du mobile sans dépendance réseau
- **Documentation vivante** : Le mock valide que l'OpenAPI spec est cohérente
- **Démos offline** : Présenter l'app sans serveur (salons, démo investisseurs)

---

## 2. Outils de Mocking

### 2.1 Prism (Développement Interactif)

**Prism** (Stoplight) est un serveur HTTP mock qui génère des réponses réalistes basées sur l'OpenAPI spec.

**Usage** : Développement interactif, exploration des endpoints, démos.

**Avantages** :

- Pas de code à écrire (directement depuis le YAML)
- Validation stricte du contrat OpenAPI
- Support complet d'OpenAPI 3.1

### 2.2 MSW (Tests Automatisés Frontend)

**MSW** (Mock Service Worker) intercepte les requêtes au niveau réseau dans Node.js/navigateur.

**Usage** : Tests Jest/RNTL automatisés côté frontend.

**Avantages** :

- Pas besoin de serveur externe
- Contrôle total sur les réponses (état, latence, erreurs)
- Tests répétables et déterministes

### Quand Utiliser Quoi ?

| Contexte | Outil | Raison |
|---|---|---|
| Développement frontend quotidien | **Prism** | Réponses réalistes sans code |
| Tests unitaires/composants (Jest/RNTL) | **MSW** | Pas de serveur, tests rapides |
| Exploration des endpoints | **Prism** | Validation automatique des requêtes |
| Tests d'intégration frontend | **MSW** | Contrôle du state et des erreurs |
| Démos | **Prism** | Setup instantané |

---

## 3. Installation et Lancement de Prism

### Installation

```bash
npm install --save-dev @stoplight/prism-cli
```

### Lancement du Serveur Mock

```bash
# Mode examples (recommandé — réponses prévisibles basées sur les exemples OpenAPI)
prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors

# Mode dynamique (données aléatoires — exploration uniquement)
prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors --dynamic
```

**Paramètres** :

- `--host 0.0.0.0` : Accessible depuis le réseau (mobile physique)
- `--port 3000` : Port d'écoute (correspond à l'URL de dev dans l'OpenAPI)
- `--cors` : Active CORS pour les requêtes cross-origin

**Recommandation** : Privilégier le mode **examples** (sans `--dynamic`) pour le développement quotidien. Le mode
dynamique génère des données aléatoires différentes à chaque appel, ce qui rend impossible le chaînage de requêtes (ex:
créer un prêt puis le récupérer par ID).

### Script package.json

```json
{
  "scripts": {
    "mock:api": "prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors"
  },
  "devDependencies": {
    "@stoplight/prism-cli": "^5.5.0"
  }
}
```

---

## 4. Utilisation Avancée de Prism

### 4.1 Forcer un Code d'Erreur

```bash
# Via header Prefer
curl -H "Prefer: code=404" http://localhost:3000/v1/loans/loan-999
```

Dans le code React Native :

```typescript
const response = await fetch('http://localhost:3000/v1/loans/loan-999', {
  headers: {
    'Prefer': 'code=404',
  },
});
// Retournera la réponse 404 NotFound définie dans l'OpenAPI
```

### 4.2 Sélectionner un Exemple Spécifique

Si plusieurs exemples sont définis pour un endpoint :

```bash
curl -H "Prefer: example=multipleErrors" \
  -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
```

---

## 5. Configuration MSW (Tests Frontend)

### Installation

```bash
npm install --save-dev msw
```

### Configuration des Handlers

```typescript
// __mocks__/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.post('http://localhost:3000/v1/auth/login', () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
    });
  }),

  // Loans
  http.get('http://localhost:3000/v1/loans', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'loan-1',
          status: 'ACTIVE',
          item: { id: 'item-1', name: 'Perceuse Bosch' },
          borrower: { id: 'borrower-1', firstName: 'Marie' },
          returnDate: '2026-04-15',
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  }),

  // Erreur RFC 7807
  http.get('http://localhost:3000/v1/loans/:id', ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json(
        {
          type: 'https://api.return.app/errors/loan-not-found',
          title: 'Loan Not Found',
          status: 404,
          detail: `The loan with ID '${params.id}' does not exist.`,
          instance: `/v1/loans/${params.id}`,
          timestamp: new Date().toISOString(),
          requestId: 'req-mock',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ id: params.id, status: 'ACTIVE' });
  }),
];
```

### Setup pour les Tests

```typescript
// __mocks__/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// jest.setup.ts
import { server } from './__mocks__/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 6. Intégration avec React Native

### Configuration du Client API

```typescript
// config/api.ts
const USE_MOCK = process.env.USE_MOCK === 'true';

const API_BASE_URL =
  __DEV__ && USE_MOCK
    ? 'http://localhost:3000/v1' // Prism mock
    : __DEV__
      ? 'http://localhost:3001/v1' // Backend local
      : 'https://api.return.app/v1'; // Production

export default API_BASE_URL;
```

### Basculement Progressif par Module

```typescript
// config/api-modules.ts
const MOCK_MODULES: Record<string, boolean> = {
  auth: false,        // Backend réel activé
  borrowers: false,   // Backend réel activé
  items: true,        // Mock encore actif
  loans: true,        // Mock encore actif
  reminders: true,    // Mock encore actif
  notifications: true,// Mock encore actif
  history: true,      // Mock encore actif
};

export const getBaseUrl = (endpoint: string): string => {
  const module = endpoint.split('/')[1]; // Ex: /auth/login → 'auth'

  if (MOCK_MODULES[module]) {
    return 'http://localhost:3000/v1'; // Prism
  }
  return __DEV__ ? 'http://localhost:3001/v1' : 'https://api.return.app/v1';
};
```

### Device Physique

Remplacer `localhost` par l'IP de votre machine :

```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000/v1' // IP locale
  : 'https://api.return.app/v1';
```

---

## 7. Limites du Mock Prism

**Ce que Prism NE fait PAS** :

- ❌ **Persistence** : Les données ne sont pas sauvegardées entre requêtes
- ❌ **Logique métier** : Pas de validation de workflow (ex: impossible de passer de RETURNED → ACTIVE)
- ❌ **Authentification réelle** : N'importe quel token JWT est accepté
- ❌ **Side effects** : Pas de notifications push réelles

**Conséquence** : Un flow complet (register → login → create loan → list loans) ne peut pas être validé avec Prism seul
car il n'y a pas de persistence. Ce flow ne peut être testé qu'avec le vrai backend ou MSW avec state.

**Solutions** :

- Pour les tests avec chaînage : utiliser **MSW** avec gestion d'état
- Pour les tests E2E backend : utiliser **Testcontainers** (vraie BDD)
- Pour les démos : pré-remplir des exemples dans l'OpenAPI spec

---

## 8. Workflow de Développement Recommandé

```
1. Design de l'API (openapi.yaml)
   ↓
2. Validation du spec (Spectral lint)
   ↓
3. Lancer Prism Mock (développement frontend interactif)
   ↓
4. Développement Backend en parallèle (tests Supertest)
   ↓
5. Basculement progressif mock → backend réel (par module)
   ↓
6. Smoke tests d'intégration à chaque basculement
```

**Commandes quotidiennes** :

```bash
# Terminal 1 : Mock API
npm run mock:api

# Terminal 2 : Frontend mobile
npm run ios    # ou: npm run android

# Terminal 3 : Backend (développement parallèle)
npm run start:dev
```

---

## 9. Checklist de Validation

Avant de considérer le mock comme source de vérité :

- [ ] OpenAPI spec validée par Spectral (0 erreur)
- [ ] Tous les endpoints ont au moins un exemple réaliste
- [ ] Les codes d'erreur (400, 401, 403, 404, 409, 429, 500) sont documentés avec exemples RFC 7807
- [ ] Prism démarre sans erreur de parsing YAML
- [ ] Les requêtes invalides retournent des erreurs de validation Prism
- [ ] Handlers MSW définis pour les tests unitaires critiques (auth, loans)

---

**Co-validé par** : Esdras GBEDOZIN & Ismael AÏHOU
**Date de dernière mise à jour** : 12 février 2026
**Version** : 1.1 — MVP Baseline (post contre-expertise)
