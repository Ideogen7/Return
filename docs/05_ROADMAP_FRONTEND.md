# 05_ROADMAP_FRONTEND.md

**Return ↺ - Roadmap de Développement Frontend (React Native)**

**Version** : 1.2 — Post-intégration Sprint 4 (ajout Sprint 4.5)
**Co-validé par** : Esdras GBEDOZIN & Ismael AIHOU
**Date** : 12 février 2026

---

## Stratégie de Développement (2 Développeurs)

**Approche** : Développement **MOCK-FIRST** en parallèle du Backend.

**Principe** :

1. Le Frontend utilise **Prism Mock Server** dès le Sprint 0 (pas d'attente du Backend).
2. Chaque Sprint livre des **écrans complets** connectés au mock.
3. Le **basculement mock → backend réel** se fait progressivement (1 module à la fois).
4. Les 2 développeurs avancent en parallèle sans blocage.

**Durée estimée** : 6 Sprints de 5 jours + buffer intégration (35-40 jours calendaires).

> **Note Containerisation** : L'application mobile React Native n'est **pas conteneurisée**. Les builds natifs (
> iOS/Android) sont gérés par **Expo/EAS Build** (cloud). Seul le backend est conteneurisé (Docker + Fly.io). Voir
`04_ROADMAP_BACKEND.md` Sprint 0 et Phase 6.5.

**Stack Frontend** :

| Technologie              | Version | Rôle                                  |
|--------------------------|---------|---------------------------------------|
| React Native             | 0.78+   | Framework mobile                      |
| Expo (dev-client)        | SDK 52+ | Toolchain, builds natifs, OTA updates |
| TypeScript               | 5.8+    | Typage statique                       |
| React Navigation         | 7.x     | Navigation (Stack + Tab)              |
| Zustand                  | 5.x     | State management                      |
| React Native Paper       | -       | Composants UI Material Design         |
| react-hook-form          | 7.x     | Gestion de formulaires + validation   |
| react-i18next            | -       | Internationalisation (FR + EN)        |
| Axios                    | -       | Client HTTP avec interceptéurs JWT    |
| AsyncStorage             | -       | Persistance locale (tokens)           |
| Firebasé Cloud Messaging | -       | Notifications push                    |

**Tests** :

| Outil                        | Scope                          | Quand                       |
|------------------------------|--------------------------------|-----------------------------|
| React Native Testing Library | Composants, formulaires, flows | Sprint 1 → Sprint 6 (MVP)   |
| Jest                         | Stores Zustand, utilitaires    | Sprint 1 → Sprint 6 (MVP)   |
| Detox                        | Tests E2E bout en bout         | Post-MVP (flows stabilises) |

---

## Sprint 0 : Setup Projet (3-4 jours)

### Objectif

Mettre en place l'infrastructuré Frontend avant tout développement fonctionnel.

### Taches

| ID            | Titre                                                                   | Dépendance | Critère de Fin                                                 | Temps |
|---------------|-------------------------------------------------------------------------|------------|----------------------------------------------------------------|-------|
| **SETUP-001** | Initialiser projet React Native avec **Expo (dev-client)**              | -          | `npx expo start` fonctionne                                    | 30min |
| **SETUP-002** | Configurer TypeScript strict + ESLint + Prettier                        | SETUP-001  | `npm run lint` passe sans erreur                               | 30min |
| **SETUP-003** | Installer React Navigation 7.x (Stack + Tab Navigator)                  | SETUP-001  | Navigation fonctionne entre 2 écrans de test                   | 1h    |
| **SETUP-004** | Installer react-hook-form 7.x (formulaires + validation)                | SETUP-001  | Formulaire de test avec validation fonctionne                  | 30min |
| **SETUP-005** | Installer react-i18next (i18n FR/EN)                                    | SETUP-001  | Traduction FR/EN fonctionnelle sur un écran de test            | 45min |
| **SETUP-006** | Installer Zustand 5.x (state management)                                | SETUP-001  | Store créé et accessible dans composants                       | 45min |
| **SETUP-007** | Installer React Native Paper (UI components)                            | SETUP-001  | Bouton + TextInput affiches avec theme                         | 45min |
| **SETUP-008** | Configurer Axios (HTTP client) + interceptéurs JWT                      | SETUP-001  | Requête authentifiee avec Bearer token                         | 1h30  |
| **SETUP-009** | Lancer Prism Mock Server (basé sur openapi.yaml)                        | -          | `prism mock openapi.yaml` accessible sur http://localhost:3000 | 15min |
| **SETUP-010** | Créer service API `apiClient.ts` (basé sur Axios) avec switch mock/real | SETUP-008  | Variable `USE_MOCK=true` pointe vers Prism                     | 1h    |
| **SETUP-011** | Configurer React Native Async Storage (persistance tokens)              | SETUP-001  | Token sauvegarde et récupéré après redémarrage                 | 1h    |
| **SETUP-012** | Setup CI/CD GitHub Actions (lint + tests Jest/RNTL)                     | SETUP-002  | Pipeline passe sur `main`                                      | 1h30  |

> **Note SETUP-012** : La CI/CD exécuté uniquement ESLint, Prettier et les tests RNTL/Jest. Les tests Detox E2E ne
> seront intégrés en CI que post-MVP, une fois les flows stabilises. Le pipeline tourne sur `main` (GitHub Flow, pas de
> branche `develop`).

📦 **Livrable Sprint 0** : App démarrable avec navigation + mock API fonctionnel + i18n configuré + CI/CD opérationnelle.

---

## Sprint 1 : Module Auth + Profil (5 jours)

### Objectif

Authentification complète + Édition de profil + Suppression de compte (RGPD). **Se connecté au Mock Server
immédiatement.**

### Phase 1.1 : Gestion d'État (Zustand Store) (Jour 1)

| ID           | Titre                                                                   | Dépendance          | Critère de Fin                                         | Temps |
|--------------|-------------------------------------------------------------------------|---------------------|--------------------------------------------------------|-------|
| **AUTH-001** | Créer `useAuthStore` (state: user, accessToken, isAuthenticated)        | SETUP-006           | Store créé avec actions login/logout                   | 1h    |
| **AUTH-002** | Créer action `login(email, password)` (appelle `/auth/login`)           | AUTH-001, SETUP-010 | Action fonctionnelle (appelle mock API)                | 1h30  |
| **AUTH-003** | Créer action `register(email, password, firstName, lastName)`           | AUTH-001            | Action fonctionnelle (appelle mock API)                | 1h    |
| **AUTH-004** | Créer action `logout()` (supprime token + reset state)                  | AUTH-001            | Action efface token en AsyncStorage                    | 45min |
| **AUTH-005** | Créer action `refreshToken()` (appelle `/auth/refresh` si token expire) | AUTH-001            | Token rafraichi automatiquement via interceptéur Axios | 1h30  |

### Phase 1.2 : Composants UI (Dumb) (Jour 2)

| ID           | Titre                                                                    | Dépendance | Critère de Fin                                   | Temps |
|--------------|--------------------------------------------------------------------------|------------|--------------------------------------------------|-------|
| **AUTH-006** | Créer composant `LoginForm` (email + password + bouton)                  | SETUP-007  | Formulaire affiche, validation react-hook-form   | 1h    |
| **AUTH-007** | Créer composant `RegisterForm` (email + password + firstName + lastName) | SETUP-007  | Formulaire affiche, validation mot de passe fort | 1h30  |
| **AUTH-008** | Créer composant `ProfileCard` (affichage infos user)                     | SETUP-007  | Card affiché firstName, lastName, email          | 45min |
| **AUTH-009** | Créer composant `EditProfileForm` (édition firstName/lastName)           | SETUP-007  | Formulaire éditable avec bouton "Sauvegarder"    | 1h    |
| **AUTH-010** | Créer composant `ChangePasswordForm` (ancien + nouveau mot de passe)     | SETUP-007  | Formulaire avec validation                       | 1h    |

### Phase 1.3 : Écrans (Smart Components) (Jour 3)

| ID            | Titre                                                                       | Dépendance         | Critère de Fin                              | Temps |
|---------------|-----------------------------------------------------------------------------|--------------------|---------------------------------------------|-------|
| **AUTH-011**  | Créer écran `LoginScreen` (connecté LoginForm au store)                     | AUTH-002, AUTH-006 | Connexion réussie redirigé vers Dashboard   | 1h    |
| **AUTH-012**  | Créer écran `RegisterScreen` (connecté RegisterForm au store)               | AUTH-003, AUTH-007 | Inscription réussie redirigé vers Dashboard | 1h    |
| **AUTH-013**  | Créer écran `ProfileScreen` (affiché ProfileCard + bouton "Éditer")         | AUTH-001, AUTH-008 | Affiche infos utilisateur connecté          | 45min |
| **AUTH-014**  | Créer écran `EditProfileScreen` (connecté EditProfileForm au store)         | AUTH-009           | Sauvegarde mise à jour profil via API mock  | 1h    |
| **AUTH-015**  | Créer écran `ChangePasswordScreen` (connecté ChangePasswordForm au store)   | AUTH-010           | Change mot de passe via API mock            | 1h    |
| **AUTH-016**  | Créer écran `DeleteAccountScreen` (confirmation + appel `DELETE /users/me`) | AUTH-001           | Suppression compte via API mock (RGPD)      | 1h30  |
| **AUTH-016b** | Créer écran `SettingsScreen` (langue, préférences notifications)            | AUTH-001           | GET + PATCH `/users/me/settings` via mock   | 1h30  |

> **Note AUTH-016** : L'écran `DeleteAccountScreen` implémente la suppression de compte conformement au RGPD.
> L'utilisateur doit confirmer par saisie de son mot de passe avant suppression. En cas de prêts actifs, l'API retourné
> une erreur 409 — l'écran affiché un message explicatif.

### Phase 1.4 : Navigation + Guards (Jour 4)

| ID           | Titre                                                                                               | Dépendance                                        | Critère de Fin                                       | Temps |
|--------------|-----------------------------------------------------------------------------------------------------|---------------------------------------------------|------------------------------------------------------|-------|
| **AUTH-017** | Configurer Stack Navigator Auth (Login → Register)                                                  | SETUP-003, AUTH-011, AUTH-012                     | Navigation fonctionnelle entre Login et Register     | 30min |
| **AUTH-018** | Configurer Stack Navigator App (Dashboard → Profile → EditProfile → ChangePassword → DeleteAccount) | SETUP-003, AUTH-013, AUTH-014, AUTH-015, AUTH-016 | Navigation fonctionnelle dans l'app                  | 45min |
| **AUTH-019** | Créer `AuthGuard` (redirect vers Login si pas authentifie)                                          | AUTH-001, SETUP-003                               | Acces à Dashboard impossible sans login              | 1h    |
| **AUTH-020** | Implémenter "Remember Me" (persist token en AsyncStorage)                                           | SETUP-011, AUTH-002                               | Token persiste après redémarrage app                 | 1h    |
| **AUTH-021** | Gerer refresh automatique du token (via interceptéur Axios)                                         | AUTH-005, SETUP-008                               | Token expire → refresh automatique → requête rejouée | 1h30  |

### Phase 1.5 : Tests + Gestion d'Erreurs (Jour 5)

| ID           | Titre                                                            | Dépendance | Critère de Fin                                    | Temps |
|--------------|------------------------------------------------------------------|------------|---------------------------------------------------|-------|
| **AUTH-022** | Afficher erreur RFC 7807 si login échoue (401 ou 400)            | AUTH-011   | Message "Email ou mot de passe incorrect" affiché | 1h    |
| **AUTH-023** | Afficher erreur si email déjà utilisé lors de register (409)     | AUTH-012   | Message "Cet email est déjà utilisé" affiché      | 45min |
| **AUTH-024** | Afficher erreur 409 si suppression compte avec prêts actifs      | AUTH-016   | Message explicatif affiché                        | 30min |
| **AUTH-025** | Écrire test RNTL : LoginForm validation + submit                 | AUTH-006   | Test RNTL passe                                   | 1h    |
| **AUTH-026** | Écrire test RNTL : RegisterForm validation + submit              | AUTH-007   | Test RNTL passe                                   | 1h    |
| **AUTH-027** | Écrire test RNTL : EditProfileForm submit                        | AUTH-009   | Test RNTL passe                                   | 45min |
| **AUTH-028** | Écrire test RNTL : affichage conditionnel d'erreurs RFC 7807     | AUTH-022   | Test RNTL passe                                   | 45min |
| **AUTH-029** | Écrire test RNTL : état de chargement (loading spinner)          | AUTH-011   | Test RNTL passe                                   | 30min |
| **AUTH-030** | Écrire test RNTL : DeleteAccountScreen confirmation + erreur 409 | AUTH-016   | Test RNTL passe                                   | 45min |

📦 **Livrable Sprint 1** : **Authentification + Profil + Settings + Suppression de compte complets** (connectés au Mock
Server), couverts par tests RNTL.

---

## Sprint 2 : Module Borrowers (4 jours)

### Objectif

CRUD complet des emprunteurs. L'emprunteur doit obligatoirement disposer d'un compte Return pour recevoir les
notifications et interagir avec le pret.

### Phase 2.1 : Gestion d'État (Zustand Store)

| ID           | Titre                                                                                        | Dépendance | Critère de Fin               | Temps |
|--------------|----------------------------------------------------------------------------------------------|------------|------------------------------|-------|
| **BORR-001** | Créer `useBorrowerStore` (state: borrowers[], selectedBorrower)                              | SETUP-006  | Store créé avec actions CRUD | 1h    |
| **BORR-002** | Créer actions `fetchBorrowers()`, `createBorrower()`, `updateBorrower()`, `deleteBorrower()` | BORR-001   | Actions appellent API mock   | 2h    |

### Phase 2.2 : Composants UI (Dumb)

| ID           | Titre                                                                 | Dépendance | Critère de Fin                   | Temps |
|--------------|-----------------------------------------------------------------------|------------|----------------------------------|-------|
| **BORR-003** | Créer composant `BorrowerCard` (affichage firstName, lastName, email) | SETUP-007  | Card affichée dans liste         | 45min |
| **BORR-004** | Créer composant `BorrowerForm` (création/édition emprunteur)          | SETUP-007  | Formulaire avec validation email | 1h30  |
| **BORR-005** | Créer composant `BorrowerStatsBadge` (trustScore + nb prêts)          | SETUP-007  | Badge colore selon trustScore    | 1h    |

### Phase 2.3 : Écrans (Smart Components)

| ID           | Titre                                                                      | Dépendance         | Critère de Fin                        | Temps |
|--------------|----------------------------------------------------------------------------|--------------------|---------------------------------------|-------|
| **BORR-006** | Créer écran `BorrowerListScreen` (FlatList de BorrowerCard)                | BORR-002, BORR-003 | Liste paginée avec bouton "+ Nouveau" | 1h30  |
| **BORR-007** | Créer écran `CreateBorrowerScreen` (BorrowerForm)                          | BORR-002, BORR-004 | Création d'emprunteur via API mock    | 1h    |
| **BORR-008** | Créer écran `BorrowerDetailScreen` (stats + bouton "Éditer" + "Supprimer") | BORR-002, BORR-005 | Details emprunteur affiches           | 1h    |
| **BORR-009** | Créer écran `EditBorrowerScreen` (BorrowerForm pré-rempli)                 | BORR-002, BORR-004 | Mise à jour emprunteur via API mock   | 1h    |

### Phase 2.4 : Navigation + Tests

| ID           | Titre                                                            | Dépendance          | Critère de Fin                                           | Temps |
|--------------|------------------------------------------------------------------|---------------------|----------------------------------------------------------|-------|
| **BORR-010** | Ajouter onglet "Contacts" dans Tab Navigator                     | SETUP-003, BORR-006 | Onglet accessible depuis Dashboard                       | 30min |
| **BORR-011** | Gerer erreur 409 si email emprunteur existe déjà pour ce prêteur | BORR-007            | Message "Email déjà utilisé pour cet emprunteur" affiché | 45min |
| **BORR-012** | Écrire test RNTL : BorrowerForm validation + création            | BORR-004            | Test RNTL passe                                          | 1h    |
| **BORR-013** | Écrire test RNTL : suppression emprunteur avec confirmation      | BORR-008            | Test RNTL passe                                          | 1h    |

📦 **Livrable Sprint 2** : **Gestion des emprunteurs complète** (connectée au Mock Server), couverte par tests RNTL.

---

## Sprint 3 : Module Items — Photos (4 jours)

### Objectif

Enregistrement d'objets avec photos + upload. La reconnaissance automatique (OCR via Google Cloud Vision) est **hors
scope V1**.

### Phase 3.1 : Gestion d'État (Zustand Store)

| ID           | Titre                                                                                                                          | Dépendance | Critère de Fin               | Temps |
|--------------|--------------------------------------------------------------------------------------------------------------------------------|------------|------------------------------|-------|
| **ITEM-001** | Créer `useItemStore` (state: items[], selectedItem)                                                                            | SETUP-006  | Store créé avec actions CRUD | 1h    |
| **ITEM-002** | Créer actions `fetchItems()`, `fetchItem(id)`, `createItem()`, `updateItem()`, `deleteItem()`, `uploadPhoto()`, `deletePhoto()` | ITEM-001   | Actions appellent API mock   | 2h30  |

> **Note ITEM-002** : `fetchItem(id)` est nécessaire pour `ItemDetailScreen` (GET `/items/{itemId}`).
> `updateItem(id, data)` est nécessaire pour `EditItemScreen` (PATCH `/items/{itemId}`).
> `uploadPhoto(itemId, photo)` appelle POST `/items/{itemId}/photos` (multipart/form-data) sur un item **déjà créé**.

### Phase 3.2 : Composants UI (Dumb)

| ID           | Titre                                                                                      | Dépendance | Critère de Fin                                     | Temps |
|--------------|--------------------------------------------------------------------------------------------|------------|----------------------------------------------------|-------|
| **ITEM-003** | Créer composant `ItemCard` (photo + nom + categorie + valeur)                              | SETUP-007  | Card affichée dans liste                           | 1h    |
| **ITEM-004** | Créer composant `ItemForm` (création/édition manuelle avec selecteur categorie)            | SETUP-007  | Formulaire avec dropdown ItemCategory              | 1h30  |
| **ITEM-005** | Créer composant `PhotoPicker` (sélection photo via ImagePicker, validation JPEG/PNG ≤ 5MB) | SETUP-001  | Bouton "Prendre une photo" fonctionne              | 1h30  |
| **ITEM-006** | Créer composant `PhotoGallery` (carousel de photos de l'objet, max 5)                      | SETUP-007  | Swiper affiché photos avec bouton "+" pour ajouter | 1h30  |

> **Note ITEM-004** : Validations conformes à l'OpenAPI : `name` (min 3, max 100), `description` (max 500, nullable),
> `estimatedValue` (min 0, nullable, **obligatoire si category = MONEY**). L'enum `ItemCategory` comprend :
> TOOLS, BOOKS, ELECTRONICS, SPORTS, KITCHEN, GARDEN, MONEY, OTHER.

> **Note ITEM-005** : Le `PhotoPicker` doit valider côté client le format (JPEG/PNG uniquement) et la taille (max 5 MB)
> avant l'upload, conformément au contrat POST `/items/{itemId}/photos`.

### Phase 3.3 : Écrans (Smart Components)

| ID           | Titre                                                                                       | Dépendance                   | Critère de Fin                                                  | Temps |
|--------------|---------------------------------------------------------------------------------------------|------------------------------|-----------------------------------------------------------------|-------|
| **ITEM-007** | Créer écran `ItemListScreen` (FlatList de ItemCard avec filtres category + available)        | ITEM-002, ITEM-003           | Liste paginée et filtrée avec bouton "+ Nouveau"                | 1h30  |
| **ITEM-008** | Créer écran `CreateItemScreen` (ItemForm + PhotoPicker, workflow 2 étapes : créer puis upload) | ITEM-002, ITEM-004, ITEM-005 | Création item via API mock, puis upload photos sur item existant | 1h30  |
| **ITEM-009** | Créer écran `ItemDetailScreen` (PhotoGallery + infos + boutons "Éditer" / "Supprimer")      | ITEM-002, ITEM-006           | Details objet affiches via GET `/items/{itemId}`                | 1h    |
| **ITEM-010** | Créer écran `EditItemScreen` (ItemForm pré-rempli)                                          | ITEM-002, ITEM-004           | Mise à jour objet via PATCH `/items/{itemId}`                   | 1h    |

> **Note ITEM-007** : L'OpenAPI expose 2 filtres sur GET `/items` : `category` (ItemCategory) et `available` (boolean —
> objets non actuellement prêtés). Le filtre `available` sera utile dès le Sprint 4 pour le LoanWizard.

> **Note ITEM-008** : L'upload de photos se fait obligatoirement en 2 étapes (contrainte OpenAPI) :
> 1. `POST /items` → créer l'item → récupérer l'`id`
> 2. `POST /items/{itemId}/photos` → uploader chaque photo (multipart/form-data)
>
> L'écran doit gérer le cas où la création réussit mais l'upload échoue (item créé sans photo, retry possible).

### Phase 3.4 : Navigation + Tests + Gestion d'Erreurs

| ID            | Titre                                                                   | Dépendance          | Critère de Fin                                              | Temps |
|---------------|-------------------------------------------------------------------------|---------------------|-------------------------------------------------------------|-------|
| **ITEM-011**  | Ajouter onglet "Objets" dans Tab Navigator                              | SETUP-003, ITEM-007 | Onglet accessible                                           | 30min |
| **ITEM-012**  | Gérer erreur 400 si category=MONEY sans estimatedValue                  | ITEM-008            | Message "Montant obligatoire pour MONEY" affiché            | 45min |
| **ITEM-012b** | Gérer erreur 409 `item-currently-loaned` à la suppression d'un item     | ITEM-009            | Message "Impossible de supprimer un objet actuellement prêté" affiché | 30min |
| **ITEM-012c** | Gérer erreur 400 `max-photos-exceeded` à l'ajout de photo (limite de 5) | ITEM-009            | Message "Maximum de 5 photos atteint" affiché               | 30min |
| **ITEM-013**  | Écrire test RNTL : ItemForm création manuelle                           | ITEM-004            | Test RNTL passe                                             | 1h    |
| **ITEM-014**  | Écrire test RNTL : PhotoPicker sélection + preview                      | ITEM-005            | Test RNTL passe                                             | 1h    |

> **Note ITEM-012b** : L'OpenAPI retourne 409 `item-currently-loaned` si on tente `DELETE /items/{itemId}` sur un objet
> associé à un prêt actif. L'écran `ItemDetailScreen` doit afficher un message explicatif.

📦 **Livrable Sprint 3** : **Enregistrement d'objets avec photos** (connecté au Mock Server), couvert par tests RNTL.

---

## Sprint 4 : Module Loans — Coeur Métier (8 jours)

### Objectif

Gestion complète du cyclé de vie des prêts (création, confirmation, suivi, clôture). Deux types de prêts : **Objet
physique (OBJECT)** et **Argent (MONEY)**.

### Phase 4.0 : Photo de Profil (Rattrapage Sprint 3) (Jour 1 matin)

> **Contexte** : Le backend `PUT /users/me/avatar` est implémenté depuis le Sprint 3 (USER-014/015/016) mais
> l'intégration frontend a été omise. Cette phase comble le manque avant d'attaquer les Loans.

| ID            | Titre                                                                                                                       | Dépendance        | Critère de Fin                                      | Temps |
|---------------|-----------------------------------------------------------------------------------------------------------------------------|--------------------|-----------------------------------------------------|-------|
| **AVATAR-001** | Ajouter action `updateAvatar(formData)` dans `useAuthStore` → `PUT /users/me/avatar` + mise à jour `user.profilePicture` | SETUP-006          | Action store appelle API réel, state mis à jour      | 45min |
| **AVATAR-002** | Modifier `ProfileCard` : afficher `user.profilePicture` (Image) au lieu de l'icône statique, fallback sur icône si null   | AUTH-008           | Photo affichée si existante, icône sinon             | 30min |
| **AVATAR-003** | Ajouter bouton camera overlay sur l'avatar dans `ProfileScreen` → `PhotoPicker` (réutiliser composant Items)              | AVATAR-002         | Tap sur avatar → choix galerie/camera → upload       | 1h    |
| **AVATAR-004** | Ajouter handler MSW `PUT /users/me/avatar` → 200 avec `profilePicture` URL                                                | AVATAR-001         | Handler mock fonctionnel pour les tests              | 15min |
| **AVATAR-005** | Écrire tests RNTL : affichage photo existante, fallback icône, upload succès                                               | AVATAR-002, 003    | 3 tests RNTL passent                                 | 1h    |

> **Estimation** : ~3h30. Le `PhotoPicker` et `buildPhotoFormData` du module Items sont réutilisables directement.

### Statuts de prêt (machine à états)

```
PENDING_CONFIRMATION → ACTIVE (accepte) | ACTIVE_BY_DEFAULT (timeout 48h) | CONTESTED (refuse)
ACTIVE / ACTIVE_BY_DEFAULT → AWAITING_RETURN (date dépassée)
AWAITING_RETURN → RETURNED (rendu) | NOT_RETURNED (5 rappels ignorés) | ABANDONED (abandon manuel)
```

### Politique de rappels (automatique, backend)

| Rappel | Moment     | Description                     |
|--------|------------|---------------------------------|
| 1      | J-3        | Rappel préventif avant échéance |
| 2      | J (jour J) | Rappel le jour de l'échéance    |
| 3      | J+7        | Premier rappel post-échéance    |
| 4      | J+14       | Deuxieme rappel post-échéance   |
| 5      | J+21       | Dernier rappel → NOT_RETURNED   |

> Les rappels sont 100% automatiques cote backend (BullMQ). Le frontend **ne géré pas** l'envoi de rappels manuels en
> V1. Il reçoit et affiché les notifications push resultantes.

### Phase 4.1 : Gestion d'État (Zustand Store)

| ID           | Titre                                                                                                   | Dépendance | Critère de Fin               | Temps |
|--------------|---------------------------------------------------------------------------------------------------------|------------|------------------------------|-------|
| **LOAN-001** | Créer `useLoanStore` (state: loans[], filters, selectedLoan)                                            | SETUP-006  | Store créé avec actions CRUD | 1h30  |
| **LOAN-002** | Créer actions `fetchLoans(filters)`, `fetchLoan(id)`, `createLoan()`, `updateLoan()`, `deleteLoan()`, `confirmLoan()`, `contestLoan()`, `updateStatus()` | LOAN-001   | Actions appellent API mock   | 3h30  |

### Phase 4.2 : Composants UI (Dumb) (Jours 1-2)

| ID           | Titre                                                                                                                                                                                                                        | Dépendance | Critère de Fin                | Temps |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|-------------------------------|-------|
| **LOAN-003** | Créer composant `LoanCard` (photo objet + nom + emprunteur + status badge + type OBJECT/MONEY)                                                                                                                               | SETUP-007  | Card affichée dans liste      | 1h30  |
| **LOAN-004** | Créer composant `StatusBadge` (PENDING_CONFIRMATION en orange, ACTIVE en vert, ACTIVE_BY_DEFAULT en vert clair, AWAITING_RETURN en rouge, CONTESTED en gris, RETURNED en bleu, NOT_RETURNED en noir, ABANDONED en gris foncé) | SETUP-007  | Badge coloré selon status (8 statuts) | 1h    |
| **LOAN-005** | Créer composant `LoanWizard` (step 1: type OBJECT/MONEY, step 2: sélection objet existant ou saisie montant, step 3: sélection emprunteur existant, step 4: date retour + notes)                                             | SETUP-007  | Wizard 4 étapes fonctionnel   | 4h    |
| **LOAN-006** | Créer composant `LoanTimeline` (affichage historique statuts)                                                                                                                                                                | SETUP-007  | Timeline verticale avec dates | 2h    |
| **LOAN-007** | Créer composant `ConfirmationDialog` (pour emprunteur : "Accepter" / "Refuser")                                                                                                                                              | SETUP-007  | Dialog modale avec 2 boutons  | 1h    |

> **Note LOAN-005** : Le `LoanWizard` géré les deux types de prêts. Pour un prêt de type OBJECT, l'utilisateur
> sélectionné un objet existant (cree au préalable via le module Items). Pour un prêt de type MONEY, l'utilisateur saisit
> directement le montant. L'emprunteur est toujours sélectionné parmi les contacts existants (compte Return obligatoire).

### Phase 4.3 : Écrans (Smart Components) (Jours 3-4)

| ID           | Titre                                                                                                     | Dépendance                   | Critère de Fin                                                 | Temps |
|--------------|-----------------------------------------------------------------------------------------------------------|------------------------------|----------------------------------------------------------------|-------|
| **LOAN-008** | Créer écran `LoanListScreen` (FlatList de LoanCard avec filtres status + onglets "En cours" / "Archives") | LOAN-002, LOAN-003, LOAN-004 | Liste filtree avec bouton "+ Nouveau pret"                     | 2h    |
| **LOAN-009** | Créer écran `CreateLoanScreen` (LoanWizard — type OBJECT/MONEY + sélection emprunteur existant)           | LOAN-002, LOAN-005           | Création prêt via API mock (type + objet/montant + emprunteur) | 2h30  |
| **LOAN-010** | Créer écran `LoanDetailScreen` (infos complètes + LoanTimeline + boutons actions selon status + édition notes/date + suppression + abandon) | LOAN-002, LOAN-006 | Affichage détails + actions contextuelles (edit/delete/abandon) | 3h    |
| **LOAN-011** | Créer écran `ConfirmLoanScreen` (pour emprunteur : ConfirmationDialog)                                    | LOAN-002, LOAN-007           | Confirmation → status ACTIVE, Refus → status CONTESTED         | 1h30  |
| **LOAN-012** | Créer écran `ReturnLoanScreen` (bouton "Confirmer le retour")                                             | LOAN-002                     | Changement status → RETURNED via API mock                      | 1h    |

> **Note LOAN-009** : Le frontend ne créé pas d'objet ni d'emprunteur inline lors de la création d'un pret.
> L'utilisateur doit d'abord créer l'objet (module Items) et l'emprunteur (module Borrowers) via leurs écrans dédiés, puis
> les sélectionnér par UUID dans le wizard de création de pret. Pour un prêt de type MONEY, la sélection d'objet est
> remplacee par la saisie du montant.

### Phase 4.4 : Navigation + Workflow (Jour 5)

| ID           | Titre                                                                                                               | Dépendance          | Critère de Fin                                | Temps |
|--------------|---------------------------------------------------------------------------------------------------------------------|---------------------|-----------------------------------------------|-------|
| **LOAN-013** | Ajouter onglet "Prêts" dans Tab Navigator (écran par defaut)                                                        | SETUP-003, LOAN-008 | Onglet accessible                             | 30min |
| **LOAN-014** | Implémenter deep linking pour confirmation emprunteur (Universal Links iOS / App Links Android → ConfirmLoanScreen) | LOAN-011            | Lien `return://loans/{id}/confirm` fonctionne | 4-6h  |
| **LOAN-015** | Afficher boutons conditionnels selon status : "Marquer rendu" (ACTIVE/AWAITING_RETURN → RETURNED), "Abandonner" (ACTIVE/AWAITING_RETURN → ABANDONED), "Modifier" (notes/returnDate via PATCH), "Supprimer" (soft delete via DELETE, interdit si RETURNED) | LOAN-010 | Boutons corrects selon machine à états (8 statuts) | 2h |

> **Note LOAN-014** : Le deep linking necessite la configuration des Universal Links (iOS :
`apple-app-site-association`) et App Links (Android : `assetlinks.json`). L'emprunteur doit obligatoirement disposer d'
> un compte Return et etre authentifie dans l'app pour acceder à `ConfirmLoanScreen` (derriere `AuthGuard`). Si
> l'emprunteur n'a pas l'app installee, le lien redirigé vers une page web avec instructions d'installation. Prevoir un
> mécanisme de magic link ou token temporaire pour simplifier le parcours emprunteur. Estimation réaliste : 4-6h (
> configuration platform-specific complexe).

### Phase 4.5 : Tests (Jours 6-7)

| ID           | Titre                                                                   | Dépendance | Critère de Fin                            | Temps |
|--------------|-------------------------------------------------------------------------|------------|-------------------------------------------|-------|
| **LOAN-016** | Gérer erreur 400 si returnDate < today                                  | LOAN-009   | Message "Date de retour invalide" affiché | 45min |
| **LOAN-017** | Écrire test RNTL : LoanWizard flow (4 étapes, type OBJECT)              | LOAN-005   | Test RNTL passe                           | 1h30  |
| **LOAN-018** | Écrire test RNTL : LoanWizard flow (type MONEY)                         | LOAN-005   | Test RNTL passe                           | 1h    |
| **LOAN-019** | Écrire test RNTL : ConfirmationDialog accept/refuse                     | LOAN-007   | Test RNTL passe                           | 1h    |
| **LOAN-020** | Écrire test RNTL : StatusBadge affichage correct par statut (8 statuts) | LOAN-004   | Test RNTL passe                           | 1h    |
| **LOAN-021** | Ajouter 5 types d'erreur Loans dans `error.ts` + `en.json`/`fr.json` : `loan-not-found`, `daily-loan-limit-exceeded`, `loan-already-returned`, `forbidden-status-transition`, `invalid-status-transition` | LOAN-002 | Erreurs mappées et traduites FR/EN | 30min |
| **LOAN-022** | Écrire tests RNTL : LoanDetailScreen — édition notes/date, suppression prêt, abandon | LOAN-010 | 3 tests RNTL passent | 1h30 |

📦 **Livrable Sprint 4** : **Gestion complète des prêts** (workflow 8 statuts, 2 types OBJECT/MONEY, édition/suppression/abandon, connecté au Mock
Server), couvert par tests RNTL.

---

## Sprint 4.5 : Corrections Intégration & UX Post-Sprint 4 (3 jours)

### Objectif

Corriger les problèmes révélés par les tests d'intégration avec le backend réel :
- **Bug critique** : l'emprunteur ne voit aucun prêt dans "Mes emprunts" (cause backend — voir roadmap backend Sprint 4.5)
- **UX** : double SegmentedButtons empilés dans `LoanListScreen` (perspective + statut)
- **UX** : onglet "Prêts" ambigu — doit couvrir prêts ET emprunts
- **UX** : profil sans statistiques emprunteur (score de confiance personnel)

> **Dépendance backend** : Les corrections UX frontend (Phase 4.5.2 et 4.5.3) peuvent démarrer en parallèle
> du backend (Phase 4.5.1). Seul le test de bout en bout "emprunteur voit ses prêts" nécessite que le
> listener `@OnEvent('user.registered')` soit implémenté côté backend.

### Phase 4.5.1 : Refactoring LoanListScreen — UX contrôles (Jour 1)

| ID              | Titre                                                                                                                                                 | Dépendance | Critère de Fin                                           | Temps |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|------------|----------------------------------------------------------|-------|
| **INTEG-F01**   | Refactorer `LoanListScreen` : remplacer les 2 SegmentedButtons empilés par un seul contrôle combiné (ex: Chips filtres ou SegmentedButtons + dropdown) | LOAN-008   | Un seul niveau de contrôle visible, UX mobile fluide     | 2h    |
| **INTEG-F02**   | Implémenter le comportement combiné : la perspective (prêteur/emprunteur) détermine les données, le filtre (en cours/archives) affine l'affichage      | INTEG-F01  | Changement de perspective recharge les données correctes | 1h    |
| **INTEG-F03**   | Masquer le FAB "+" en mode emprunteur (déjà fait, vérifier après refactoring)                                                                         | INTEG-F01  | FAB invisible quand perspective = borrower               | 15min |

> **Proposition UX** : Utiliser un **SegmentedButtons** pour la perspective (Mes prêts / Mes emprunts) et
> des **Chip** filtres en dessous pour le statut (En cours / Archives), ou intégrer le filtre statut dans
> un menu/dropdown. L'objectif est d'éviter deux barres de boutons identiques empilées. Le choix final
> de l'approche UX est laissé à l'implémenteur.

### Phase 4.5.2 : Renommage onglet navigation (Jour 1)

| ID              | Titre                                                                                                        | Dépendance | Critère de Fin                                                | Temps |
|-----------------|--------------------------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------|-------|
| **INTEG-F04**   | Renommer l'onglet "Prêts" → "Suivi" dans `AppNavigator.tsx` + i18n (`navigation.loans` → `navigation.tracking`) | LOAN-013   | Onglet affiché "Suivi" en FR / "Tracking" en EN               | 30min |
| **INTEG-F05**   | Mettre à jour `fr.json` et `en.json` : ajouter clé `navigation.tracking` + conserver `navigation.loans` pour rétrocompatibilité | INTEG-F04  | i18n FR : "Suivi", EN : "Tracking"                            | 15min |

> **Note** : Le terme "Suivi" est neutre et englobe à la fois le suivi des prêts (prêteur) et le suivi des emprunts
> (emprunteur). Le terme "Transaction" est interdit par le vocabulaire du projet (voir `CLAUDE.md`).
> **Alternative** : "Prêts & Emprunts" — plus explicite mais long pour un onglet mobile. À valider en équipe.

### Phase 4.5.3 : Statistiques emprunteur dans le profil (Jour 2)

| ID              | Titre                                                                                                                 | Dépendance      | Critère de Fin                                          | Temps |
|-----------------|-----------------------------------------------------------------------------------------------------------------------|------------------|---------------------------------------------------------|-------|
| **INTEG-F06**   | Créer composant `BorrowerStats` : charge les prêts via `fetchLoans({ role: 'borrower' })` et calcule les métriques    | LOAN-001         | Composant affiche : prêts reçus, rendus à temps, en retard, score de confiance | 2h    |
| **INTEG-F07**   | Intégrer `BorrowerStats` dans `ProfileScreen` sous `LenderStats`                                                      | INTEG-F06        | Deux cards de stats visibles dans le profil (prêteur + emprunteur)             | 30min |
| **INTEG-F08**   | Ajouter clés i18n pour `BorrowerStats` : `profile.borrowerStatistics`, `profile.loansReceived`, `profile.returnedOnTime`, `profile.returnedLate`, `profile.trustScore` | INTEG-F06 | Clés disponibles en FR et EN | 15min |

> **Calcul du score de confiance** : `(returnedOnTime * 100 + returnedLate * 50) / totalLoans`
> (formule identique à `BorrowerStatistics.trustScore` dans l'OpenAPI). Le calcul est fait côté client
> à partir des prêts chargés via `useLoanStore.fetchLoans({ role: 'borrower', includeArchived: true })`.
> Les statuts pris en compte : `RETURNED` (vérifié si avant/après `returnDate`) pour `returnedOnTime`/`returnedLate`,
> `NOT_RETURNED` et `ABANDONED` pour non rendus.

### Phase 4.5.4 : Tests + Validation (Jour 3)

| ID              | Titre                                                                                                  | Dépendance         | Critère de Fin                                            | Temps |
|-----------------|--------------------------------------------------------------------------------------------------------|--------------------|-----------------------------------------------------------|-------|
| **INTEG-F09**   | Écrire test RNTL : `LoanListScreen` — contrôle combiné perspective/statut fonctionne                  | INTEG-F02          | Test RNTL passe                                           | 1h    |
| **INTEG-F10**   | Écrire test RNTL : onglet "Suivi" affiché dans la navigation                                          | INTEG-F04          | Test RNTL passe                                           | 30min |
| **INTEG-F11**   | Écrire test RNTL : `BorrowerStats` affiche les métriques calculées                                    | INTEG-F06          | Test RNTL passe                                           | 1h    |
| **INTEG-F12**   | Test bout en bout : créer un prêt (prêteur) → vérifier qu'il apparaît dans "Mes emprunts" (emprunteur) | INTEG-F02, backend | Test fonctionnel valide (nécessite backend Sprint 4.5)    | 1h    |
| **INTEG-F13**   | Vérifier que tous les tests existants (150+) passent après les modifications                           | INTEG-F09..F12     | `npx jest --verbose` : 0 échecs                          | 30min |

📦 **Livrable Sprint 4.5** : **Perspective emprunteur UX corrigée** (onglet "Suivi", contrôle unique perspective/statut, statistiques emprunteur en profil), couverte par tests RNTL.

---

## Sprint 5 : Module Notifications (5 jours)

### Objectif

Recevoir et gérer les notifications push. Les rappels sont 100% automatiques cote backend (pas de rappels manuels en
V1). Ce sprint concerne uniquement : recevoir les push, afficher la liste des notifications, marquer comme lu.

### Phase 5.1 : Setup Notifications (Jour 1)

| ID            | Titre                                                                 | Dépendance | Critère de Fin                            | Temps |
|---------------|-----------------------------------------------------------------------|------------|-------------------------------------------|-------|
| **NOTIF-001** | Installer Firebasé Cloud Messaging (FCM) SDK via Expo                 | SETUP-001  | FCM initialise, token device récupéré     | 2h    |
| **NOTIF-002** | Configurer gestion des notifications foreground/background            | NOTIF-001  | Notification affichée même si app ouverte | 1h30  |
| **NOTIF-003** | Créer service `notificationService.ts` (subscribe/unsubscribe topics) | NOTIF-001  | Service créé                              | 1h    |

### Phase 5.2 : Gestion d'État (Zustand Store)

| ID            | Titre                                                                   | Dépendance | Critère de Fin             | Temps |
|---------------|-------------------------------------------------------------------------|------------|----------------------------|-------|
| **NOTIF-004** | Créer `useNotificationStore` (state: notifications[], unreadCount)      | SETUP-006  | Store créé                 | 1h    |
| **NOTIF-005** | Créer actions `fetchNotifications()`, `markAsRead()`, `markAllAsRead()` | NOTIF-004  | Actions appellent API mock | 1h30  |

### Phase 5.3 : Composants UI (Dumb) (Jour 2)

| ID            | Titre                                                                    | Dépendance | Critère de Fin            | Temps |
|---------------|--------------------------------------------------------------------------|------------|---------------------------|-------|
| **NOTIF-006** | Créer composant `NotificationCard` (affichage notif avec badge "non lu") | SETUP-007  | Card affichée dans liste  | 1h    |
| **NOTIF-007** | Créer composant `NotificationBadge` (badge rouge avec count sur icone)   | SETUP-007  | Badge affiché dans header | 45min |

### Phase 5.4 : Écrans (Smart Components) (Jour 3)

| ID            | Titre                                                                                      | Dépendance           | Critère de Fin                                    | Temps |
|---------------|--------------------------------------------------------------------------------------------|----------------------|---------------------------------------------------|-------|
| **NOTIF-008** | Créer écran `NotificationListScreen` (FlatList de NotificationCard avec filtre unreadOnly) | NOTIF-005, NOTIF-006 | Liste paginée avec bouton "Tout marquer comme lu" | 1h30  |
| **NOTIF-009** | Ajouter NotificationBadge dans header                                                      | NOTIF-005, NOTIF-007 | Badge mis à jour en temps réel                    | 1h    |

### Phase 5.5 : Intégration + Tests (Jours 4-5)

| ID            | Titre                                                     | Dépendance          | Critère de Fin                       | Temps |
|---------------|-----------------------------------------------------------|---------------------|--------------------------------------|-------|
| **NOTIF-010** | Simuler reception notification push (via Postman → FCM)   | NOTIF-002           | Notification reçue et affichée       | 1h    |
| **NOTIF-011** | Navigation depuis notification push vers LoanDetailScreen | NOTIF-002, LOAN-010 | Tap sur notif ouvre le prêt concerne | 1h30  |
| **NOTIF-012** | Écrire test RNTL : NotificationCard mark as read          | NOTIF-006           | Test RNTL passe                      | 1h    |
| **NOTIF-013** | Écrire test RNTL : NotificationBadge affichage count      | NOTIF-007           | Test RNTL passe                      | 45min |

📦 **Livrable Sprint 5** : **Notifications push** (reception, liste, lecture, navigation vers prêt concerne), couvertes
par tests RNTL.

---

## Sprint 6 : Module History + Dashboard (4 jours)

### Objectif

Statistiques + Historique archivé + Écran Dashboard avec overview.

### Phase 6.1 : Gestion d'État (Zustand Store)

| ID           | Titre                                                            | Dépendance | Critère de Fin             | Temps |
|--------------|------------------------------------------------------------------|------------|----------------------------|-------|
| **HIST-001** | Créer `useHistoryStore` (state: archivedLoans[], statistics)     | SETUP-006  | Store créé                 | 1h    |
| **HIST-002** | Créer actions `fetchArchivedLoans(filters)`, `fetchStatistics()` | HIST-001   | Actions appellent API mock | 1h30  |

### Phase 6.2 : Composants UI (Dumb)

| ID           | Titre                                                                     | Dépendance | Critère de Fin               | Temps |
|--------------|---------------------------------------------------------------------------|------------|------------------------------|-------|
| **HIST-003** | Créer composant `StatCard` (KPI : nb prêts actifs, taux de retour, etc.)  | SETUP-007  | Card avec chiffre + icone    | 1h    |
| **HIST-004** | Créer composant `PieChart` (repartition par categorie via Victory Native) | SETUP-001  | Graphique circulaire affiché | 2h    |
| **HIST-005** | Créer composant `TopBorrowersList` (top 5 emprunteurs les plus frequents) | SETUP-007  | Liste avec trustScore badge  | 1h    |

### Phase 6.3 : Écrans (Smart Components)

| ID           | Titre                                                                        | Dépendance                             | Critère de Fin                   | Temps |
|--------------|------------------------------------------------------------------------------|----------------------------------------|----------------------------------|-------|
| **HIST-006** | Créer écran `DashboardScreen` (4 StatCard + PieChart + boutons rapides)      | HIST-002, HIST-003, HIST-004           | Dashboard complet affiché        | 2h    |
| **HIST-007** | Créer écran `HistoryScreen` (liste archivedLoans avec filtres date + status) | HIST-002                               | Liste paginée avec filtres       | 1h30  |
| **HIST-008** | Créer écran `StatisticsScreen` (StatCards + PieChart + TopBorrowersList)     | HIST-002, HIST-003, HIST-004, HIST-005 | Statistiques complètes affichées | 2h    |

### Phase 6.4 : Navigation + Tests

| ID           | Titre                                                      | Dépendance          | Critère de Fin                | Temps |
|--------------|------------------------------------------------------------|---------------------|-------------------------------|-------|
| **HIST-009** | Ajouter onglet "Historique" dans Tab Navigator             | SETUP-003, HIST-007 | Onglet accessible             | 30min |
| **HIST-010** | Definir DashboardScreen comme écran par defaut après login | AUTH-019, HIST-006  | Dashboard affiché après login | 30min |
| **HIST-011** | Écrire test RNTL : StatCard affichage KPIs                 | HIST-003            | Test RNTL passe               | 1h    |

📦 **Livrable Sprint 6** : **Dashboard + Statistiques + Historique** (connectés au Mock Server), couverts par tests RNTL.

---

## Basculement Mock → Backend Réel

### Stratégie de Basculement Progressif

**Principe** : Ne pas tout basculer d'un coup. Activer module par module.

| Sprint Backend Termine   | Module à Basculer         | Action Frontend                                                     | Temps                          |
|--------------------------|---------------------------|---------------------------------------------------------------------|--------------------------------|
| **Sprint 1 (Auth)**      | Auth + Users              | `USE_MOCK=false` pour endpoints `/auth/*` et `/users/*`             | 1h                             |
| **Sprint 2 (Borrowers)** | Borrowers                 | `USE_MOCK=false` pour endpoints `/borrowers/*`                      | 30min                          |
| **Sprint 3 (Items)**     | Items (Photos + R2)       | `USE_MOCK=false` pour endpoints `/items/*`                          | 1h (tester upload réel)        |
| **Sprint 4 (Loans)**     | Loans                     | `USE_MOCK=false` pour endpoints `/loans/*`                          | 1h30 (tester workflow statuts) |
| **Sprint 5 (Reminders)** | Reminders + Notifications | `USE_MOCK=false` pour endpoints `/reminders/*` + `/notifications/*` | 1h30 (tester push réel)        |
| **Sprint 6 (History)**   | History                   | `USE_MOCK=false` pour endpoints `/history/*`                        | 30min                          |

> **Buffer** : Prevoir 1 journee de buffer global pour le debugging d'intégration (différénces de format de date,
> pagination, headers entre Prism mock et backend réel).

**Implémentation dans `apiClient.ts`** :

```typescript
const MOCK_MODULES: Record<string, boolean> = {
    auth: false,         // Backend réel active
    borrowers: false,    // Backend réel active
    items: true,         // Mock encore actif
    loans: true,         // Mock encore actif
    reminders: true,     // Mock encore actif
    notifications: true, // Mock encore actif
    history: true,       // Mock encore actif
};

export const API_BASE_URL = (endpoint: string): string => {
    const module = endpoint.split('/')[1]; // Ex: /auth/login → 'auth'

    if (MOCK_MODULES[module]) {
        return 'http://localhost:3000/v1'; // Prism Mock Server (dev uniquement)
    } else {
        return __DEV__
            ? 'http://localhost:3001/v1'   // Backend local
            : 'https://api.return.app/v1'; // Production
    }
};
```

> **Note** : Pas d'URL de staging mock. Deux environnements uniquement : `localhost` pour le développement,
`api.return.app` pour la production.

**Checklist de Basculement (par module)** :

- [ ] Tests RNTL rejoues avec backend réel
- [ ] Smoke tests manuels des parcours principaux
- [ ] Tests d'intégration Supertest cote backend valides
- [ ] Gestion d'erreurs testee (401, 403, 404, 409, 429, 500)
- [ ] Upload de photos teste (si module Items)
- [ ] Notifications push testees (si module Reminders)

> **Post-MVP** : Des tests Detox E2E seront ajoutes pour valider les flows critiques de bout en bout (login → création
> prêt → confirmation → retour) une fois le MVP stabilise.

---

## Résumé des Sprints Frontend

| Sprint           | Durée        | Modules                               | Écrans livres                                                                      | Tests RNTL    |
|------------------|--------------|---------------------------------------|------------------------------------------------------------------------------------|---------------|
| **Sprint 0**     | 3-4 jours    | Setup infrastructuré                  | 0                                                                                  | CI/CD setup   |
| **Sprint 1**     | 5 jours      | Auth + Profil + Settings              | 7 (Login, Register, Profile, EditProfile, ChangePassword, DeleteAccount, Settings) | 6 tests       |
| **Sprint 2**     | 4 jours      | Borrowers                             | 4 (List, Create, Detail, Edit)                                                     | 2 tests       |
| **Sprint 3**     | 4 jours      | Items (Photos)                        | 4 (List, Create, Detail, Edit)                                                     | 2 tests       |
| **Sprint 4**     | 8 jours      | Avatar + Loans                        | 5 (List, Create, Detail, Confirm, Return) + avatar profil                          | 4+3+3 tests   |
| **Sprint 4.5**   | 3 jours      | Corrections intégration + UX          | 0 (refactoring LoanListScreen + BorrowerStats + renommage onglet)                  | 5 tests       |
| **Sprint 5**     | 5 jours      | Notifications                         | 1 (NotificationList) + header badge                                                | 2 tests       |
| **Sprint 6**     | 4 jours      | Dashboard + History                   | 3 (Dashboard, History, Statistics)                                                 | 1 test        |
| **TOTAL**        | **41-45 j.** | **7 modules + 1 correctif**          | **24 écrans**                                                                      | **22+ tests** |

---

## Points de Synchronisation Frontend/Backend

| Moment                     | Frontend basculé vers                | Backend disponible                                         |
|----------------------------|--------------------------------------|------------------------------------------------------------|
| **Fin Sprint 1 Backend**   | Auth + Users + Settings réel         | `/auth/*` + `/users/me` + `/users/me/settings`             |
| **Fin Sprint 2 Backend**   | Borrowers réel                       | `/borrowers/*`                                             |
| **Fin Sprint 3 Backend**   | Items réel (Photos + R2)             | `/items/*`                                                 |
| **Fin Sprint 4 Backend**   | Loans réel (workflow complet)        | `/loans/*`                                                 |
| **Fin Sprint 4.5 Backend** | Perspective emprunteur fonctionnelle | `Borrower.userId` lié + `GET /loans?role=borrower` correct |
| **Fin Sprint 5 Backend**   | Notifications réelles (FCM)          | `/reminders/*` + `/notifications/*`                        |
| **Fin Sprint 6 Backend**   | History + Déploiement réel           | `/history/*` + `/borrowers/{id}/loans`                     |

---

## Checklist de Fin de Sprint

A valider avant de passer au sprint suivant :

- [ ] Tous les écrans sont accessibles et navigables
- [ ] Tous les tests RNTL passent
- [ ] CI/CD passe sur `main`
- [ ] Gestion d'erreurs RFC 7807 implémentee (toasts ou modales)
- [ ] Formulaires valides cote client (react-hook-form)
- [ ] Code review approuve (1 approval)
- [ ] i18n : textes utilisateur disponibles en FR et EN

---

**Co-validé par** : Esdras GBEDOZIN & Ismael AIHOU
**Date de dernière mise à jour** : 3 mars 2026
**Version** : 1.2 — Post-intégration Sprint 4 (ajout Sprint 4.5)
