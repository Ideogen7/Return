# Frontend — Documentation technique

## Stack

| Technologie        | Version | Rôle                            |
|--------------------|---------|---------------------------------|
| React Native       | 0.81    | Framework mobile                |
| Expo               | 54      | Toolchain & build               |
| TypeScript         | 5.9     | Typage statique                 |
| React Navigation   | 7       | Navigation (native-stack)       |
| React Native Paper | 5       | Composants UI Material Design 3 |
| Zustand            | 5       | State management                |
| Axios              | 1.13    | Client HTTP                     |
| react-hook-form    | 7       | Formulaires & validation        |
| react-i18next      | 16      | Internationalisation FR/EN      |
| MSW                | 2       | Mock API (tests Jest)           |
| Prism              | 5       | Mock API (dev local)            |

---

## Commandes

```bash
# Développement
npm start                  # Démarre Expo (Metro)
npx expo start --tunnel    # Démarre avec tunnel (test sur device distant)
npx expo start --clear     # Démarre avec cache vidé
npm run mock:api           # Lance Prism sur localhost:3000 (mock OpenAPI)

# Qualité
npm test                   # Lance tous les tests Jest
npm run test:watch         # Tests en mode watch
npm run test:coverage      # Tests avec rapport de couverture
npm run typecheck          # Vérification TypeScript (tsc --noEmit)
npm run lint               # ESLint
npm run lint:fix           # ESLint avec correction auto
npm run format             # Prettier --write
npm run format:check       # Prettier --check
```

---

## Architecture

```
frontend/
├── App.tsx                           # Point d'entrée — PaperProvider + NavigationContainer
├── index.ts                          # Enregistrement Expo
├── __mocks__/
│   ├── handlers.ts                   # Handlers MSW (mock des endpoints API)
│   └── server.ts                     # Serveur MSW pour les tests
└── src/
    ├── api/
    │   └── apiClient.ts              # Client Axios — intercepteurs auth + refresh token
    ├── components/
    │   ├── auth/
    │   │   ├── LoginForm.tsx          # Formulaire login (dumb)
    │   │   └── RegisterForm.tsx       # Formulaire inscription (dumb)
    │   └── profile/
    │       ├── ProfileCard.tsx        # Carte affichage profil
    │       ├── EditProfileForm.tsx    # Formulaire édition profil (dumb)
    │       └── ChangePasswordForm.tsx # Formulaire changement mot de passe (dumb)
    ├── config/
    │   ├── api-modules.config.ts     # Routage URL par module (mock vs backend réel)
    │   ├── i18n.config.ts            # Configuration i18next
    │   └── theme.config.ts           # Thème MD3 (light/dark) + STATUS_COLORS
    ├── i18n/locales/
    │   ├── fr.json                   # Traductions françaises
    │   └── en.json                   # Traductions anglaises
    ├── navigation/
    │   ├── types.ts                  # AuthStackParamList, AppStackParamList
    │   ├── AuthNavigator.tsx         # Stack : Login → Register
    │   ├── AppNavigator.tsx          # Stack : Profile → EditProfile → ChangePassword → DeleteAccount → Settings
    │   └── RootNavigator.tsx         # AuthGuard — bascule Auth/App selon isAuthenticated
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx       # Connecte LoginForm au store
    │   │   └── RegisterScreen.tsx    # Connecte RegisterForm au store
    │   └── profile/
    │       ├── ProfileScreen.tsx     # Affiche profil + liens vers sous-écrans
    │       ├── EditProfileScreen.tsx # PATCH /users/me
    │       ├── ChangePasswordScreen.tsx # PATCH /users/me/password
    │       ├── DeleteAccountScreen.tsx  # DELETE /users/me (RGPD)
    │       └── SettingsScreen.tsx    # GET/PATCH /users/me/settings
    ├── stores/
    │   └── useAuthStore.ts           # Store Zustand auth (login, register, logout, refresh, hydrate)
    ├── types/
    │   └── api.types.ts              # Types TS conformes à l'OpenAPI
    └── utils/
        ├── storage.ts                # AsyncStorage — get/set/clear tokens
        └── error.ts                  # Parsing erreurs RFC 7807 + traduction i18n
```

---

## Flux d'authentification

```
App démarre
  └→ RootNavigator.hydrate()
       ├→ Token trouvé en AsyncStorage ?
       │    ├→ OUI : GET /users/me → succès → AppNavigator (ProfileScreen)
       │    │                       → échec → clearTokens → AuthNavigator (LoginScreen)
       │    └→ NON : AuthNavigator (LoginScreen)
       │
Login/Register réussi
  └→ Tokens stockés en AsyncStorage
  └→ isAuthenticated = true → bascule vers AppNavigator

Logout
  └→ POST /auth/logout (best-effort)
  └→ clearTokens + reset state → bascule vers AuthNavigator

Requête API avec token expiré (401)
  └→ Intercepteur Axios → POST /auth/refresh
       ├→ succès → retry la requête originale
       └→ échec → clearTokens → l'app redirige vers Login au prochain render
```

---

## Thème

L'app utilise Material Design 3 via React Native Paper avec détection automatique du mode système (light/dark).

| Rôle             | Light     | Dark      |
|------------------|-----------|-----------|
| Primary (Indigo) | `#4338CA` | `#A5B4FC` |
| Secondary (Teal) | `#0D9488` | `#5EEAD4` |
| Tertiary (Ambre) | `#D97706` | `#FCD34D` |
| Error            | `#DC2626` | `#FCA5A5` |

Les couleurs de statuts de prêt sont définis dans `STATUS_COLORS` (utilisés à partir du Sprint 4).

---

## Gestion des erreurs

Toutes les erreurs API suivent le format **RFC 7807 (ProblemDetails)**. L'utilitaire `error.ts` fournit :

- `parseProblemDetails(error)` — extrait le ProblemDetails depuis une erreur Axios
- `getErrorMessage(problem, t)` — traduit le type d'erreur en message i18n

Types d'erreur gérés :
| Type API | Clé i18n | Message FR |
|---|---|---|
| `invalid-credentials` | `errors.invalidCredentials` | Email ou mot de passe incorrect |
| `email-already-exists` | `errors.emailAlreadyExists` | Cet email est déjà utilisé |
| `active-loans-exist` | `errors.activeLoansExist` | Impossible de supprimer... prêts actifs |
| `invalid-current-password` | `errors.invalidCurrentPassword` | Mot de passe actuel incorrect |

---

## Mock API

### En développement (Prism)

```bash
npm run mock:api
```

Lance un serveur mock sur `localhost:3000` basé sur `docs/openapi.yaml`. Les réponses sont générées depuis les exemples
de l'OpenAPI.

Le fichier `api-modules.config.ts` route chaque module (auth, users, loans...) vers Prism ou le backend réel selon la
config `MOCK_MODULES`.

### En tests (MSW)

Le fichier `__mocks__/handlers.ts` définit les handlers pour tous les endpoints Sprint 1. Les données mock (`mockUser`,
`mockSettings`) sont factorisées pour la cohérence.

Le serveur MSW est initialisé dans chaque fichier de test :

```ts
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Tests

**10 suites — 40 tests** :

| Suite                          | Tests | Ce qui est testé                                        |
|--------------------------------|-------|---------------------------------------------------------|
| `setup.test.ts`                | 3     | AsyncStorage mock, i18n init, navigation mock           |
| `apiClient.test.ts`            | 4     | Bearer token, refresh 401, queue refresh, clear tokens  |
| `storage.test.ts`              | 5     | get/set/clear tokens AsyncStorage                       |
| `i18n.test.ts`                 | 3     | Chargement FR/EN, fallback, clés existantes             |
| `useAuthStore.test.ts`         | 10    | Login/register OK/KO, logout, refresh, hydrate          |
| `LoginForm.test.tsx`           | 4     | Rendu, validation vide, submit valide, affichage erreur |
| `RegisterForm.test.tsx`        | 4     | Rendu, validation vide, submit valide, affichage erreur |
| `EditProfileForm.test.tsx`     | 2     | Valeurs par défaut, submit modifié                      |
| `LoginScreen.test.tsx`         | 3     | Rendu, erreur 401, login réussi                         |
| `DeleteAccountScreen.test.tsx` | 3     | Rendu, validation confirmation, erreur 409              |

### Lancer un test spécifique

```bash
npx jest src/stores/__tests__/useAuthStore.test.ts
npx jest --testPathPattern="LoginForm"
```

---

## Conventions

- **Composants dumb** (`components/`) : reçoivent des props, pas d'accès au store ni API
- **Écrans smart** (`screens/`) : connectent les composants au store et à l'API
- **Nommage** : `PascalCase` pour composants/écrans, `camelCase` pour fonctions/variables
- **i18n** : toutes les chaînes visibles passent par `useTranslation()`, jamais de texte hardcodé
- **Types** : `api.types.ts` est la source de vérité, conforme à `docs/openapi.yaml`
- **Formulaires** : react-hook-form avec Controller + validation déclarative
- **Erreurs** : toujours parsées en ProblemDetails, traduites via `getErrorMessage()`
