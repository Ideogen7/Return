# 04_ROADMAP_BACKEND.md

**Return - Roadmap de Développement Backend (NestJS)**

**Version** : 1.1 -- MVP Baseline (post contre-expertise)
**Co-validé par** : Esdras GBEDOZIN & Ismael AIHOU
**Date** : 12 février 2026

---

## Stratégie de Développement (2 Développeurs)

**Approche** : Développement itératif par **Sprints verticaux** (1 sprint = 1 module fonctionnel complet).

**Principe** :

1. Chaque Sprint livre un module **end-to-end** (DB -> Services -> API -> Tests).
2. Le Frontend peut se connecter au Backend dès la fin du Sprint 1 (Auth).
3. Pas de "Big Bang" final : Les modules sont intégrés progressivement.
4. **TDD strict** : Chaque comportement suit le cycle RED -> GREEN -> REFACTOR -> COMMIT (pas de batch de tests).

**Durée estimée** : 6 Sprints -- **35 à 40 jours calendaires** (incluant un buffer pour blockers techniques, courbe
d'apprentissage et imprévus).

---

## Sprint 0 : Setup Projet (3-4 jours)

### Objectif

Mettre en place l'infrastructuré Backend avant tout développement fonctionnel. Installer uniquement les dépendances
nécessaires immédiatement -- les services tiers (Redis, R2, FCM) seront configurés dans les sprints ou ils sont
utilisés.

### Taches

| ID            | Titre                                                                                 | Dépendance | Critère de Fin                                                                  | Temps |
| ------------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- | ----- |
| **SETUP-001** | Initialiser le repository NestJS                                                      | -          | `npm run start` fonctionne                                                      | 30min |
| **SETUP-002** | Configurer TypeScript strict + ESLint + Prettier                                      | SETUP-001  | `npm run lint` passe sans erreur                                                | 30min |
| **SETUP-003** | Installer Prisma + PostgreSQL + Redis (Docker Compose)                                | SETUP-001  | `docker compose up` démarre PostgreSQL + Redis, `npx prisma db push` fonctionne | 1h30  |
| **SETUP-004** | Configurer Winston (logs JSON structurés)                                             | SETUP-001  | Logs écrits en JSON avec requestId                                              | 1h    |
| **SETUP-005** | Implémenter RFC 7807 Exception Filter global                                          | SETUP-004  | Erreur 404 retourné format RFC 7807                                             | 1h30  |
| **SETUP-006** | Configurer JWT Module (access + refresh tokens)                                       | SETUP-001  | JWT signe et vérifié avec `@nestjs/jwt`                                         | 1h    |
| **SETUP-007** | Créer le Guard d'authentification (JwtAuthGuard)                                      | SETUP-006  | Route protégée retourné 401 si pas de token                                     | 1h    |
| **SETUP-008** | Implémenter endpoints `/health` et `/ready`                                           | SETUP-001  | Fly.io liveness/readiness probes opérationnelles                                | 45min |
| **SETUP-009** | Configurer gestion des environnements (.env, ConfigModule)                            | SETUP-001  | ConfigModule NestJS charge les variables par env (dev/prod), secrets documentes | 1h    |
| **SETUP-010** | Setup CI/CD GitHub Actions (lint + tests + Spectral lint openapi.yaml + Docker build) | SETUP-002  | Pipeline passe sur `main`                                                       | 1h30  |
| **SETUP-011** | Créer `Dockerfile` multi-stage (Node.js 22 LTS, builder + runner) + `.dockerignore`   | SETUP-001  | `docker build -t return-api .` réussit                                          | 1h    |
| **SETUP-012** | Créer `docker-compose.yml` complet (backend + PostgreSQL 17 + Redis 8)                | SETUP-003  | `docker compose up` démarre le stack local                                      | 45min |

> **Note sur SETUP-009** : Deux environnements en V1 : dev et production. Pas de staging.

> **Note sur SETUP-010** : GitHub Flow -- la CI/CD tourne sur `main` uniquement (pas de branche `develop`). Spectral valide que l'openapi.yaml respecte les standards OpenAPI 3.1.0. Le pipeline inclut un `docker build` pour vérifier que l'image de production reste constructible.

> **Note sur SETUP-011/012** : Le Dockerfile utilise un multi-stage build (étape builder pour `npm ci` + `npx prisma generate`, étape runner avec image Node.js slim). Le `docker-compose.yml` inclut PostgreSQL 17, Redis 8 et le backend NestJS pour le développement local. Redis est inclus dès le Sprint 0 même si le module NestJS Redis n'est configuré qu'au Sprint 1 (AUTH-014) -- le conteneur tourne en attente.

**Livrable Sprint 0** : 🚀 Backend démarrable avec auth JWT fonctionnel, health checks opérationnels, CI/CD en place et stack Docker local fonctionnel (pas de BDD métier encore).

---

## Sprint 1 : Module Auth + Users (5 jours)

### Objectif

Authentification complète + Gestion de profil. **Le Frontend peut s'y connecter dès la fin du Sprint.**

### Phase 1.1 : Base de Données (Jour 1)

| ID           | Titre                                                                      | Dépendance | Critère de Fin                                | Temps |
| ------------ | -------------------------------------------------------------------------- | ---------- | --------------------------------------------- | ----- |
| **AUTH-001** | Créer le schema Prisma `User` (email, password, rôle, firstName, lastName) | SETUP-003  | Migration appliquée, table `users` créée      | 30min |
| **AUTH-002** | Créer le schema Prisma `RefreshToken` (token, userId, expiresAt)           | AUTH-001   | Migration appliquée, relation 1-N avec `User` | 30min |
| **AUTH-003** | Ajouter index sur `users.email` (unique) et `refreshTokens.token`          | AUTH-002   | `EXPLAIN` montre index utilisé                | 15min |

### Phase 1.2 : TDD -- Auth Service (Jours 2-4)

Chaque comportement suit le cyclé complet RED -> GREEN -> REFACTOR -> COMMIT avant de passer au suivant.

**Comportement 1 : Register**

| ID           | Titre                                                                             | Dépendance | Critère de Fin                     | Temps |
| ------------ | --------------------------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **AUTH-004** | RED : Test `POST /auth/register` (success 201)                                    | AUTH-003   | Test écrit, échoue                 | 30min |
| **AUTH-005** | GREEN : Implémenter `AuthService.register()` (hash bcrypt, créer user via Prisma) | AUTH-004   | Test AUTH-004 passe                | 1h    |
| **AUTH-006** | RED : Test `POST /auth/register` (erreur 400 si email déjà utilisé)               | AUTH-005   | Test écrit, échoue                 | 20min |
| **AUTH-007** | GREEN : Ajouter vérification d'unicite email dans `register()`                    | AUTH-006   | Tests AUTH-004 et AUTH-006 passent | 30min |

**Comportement 2 : Login**

| ID           | Titre                                                                         | Dépendance | Critère de Fin                     | Temps |
| ------------ | ----------------------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **AUTH-008** | RED : Test `POST /auth/login` (success 200 avec tokens)                       | AUTH-007   | Test écrit, échoue                 | 30min |
| **AUTH-009** | GREEN : Implémenter `AuthService.login()` (vérifiér credentials, générér JWT) | AUTH-008   | Test AUTH-008 passe                | 1h30  |
| **AUTH-010** | RED : Test `POST /auth/login` (erreur 401 si mot de passe invalide)           | AUTH-009   | Test écrit, échoue                 | 20min |
| **AUTH-011** | GREEN : Ajouter gestion d'erreur credentials invalides                        | AUTH-010   | Tests AUTH-008 et AUTH-010 passent | 30min |

**Comportement 3 : Refresh Token**

| ID           | Titre                                                                                       | Dépendance | Critère de Fin      | Temps |
| ------------ | ------------------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **AUTH-012** | RED : Test `POST /auth/refresh` (success 200 avec nouveau access token)                     | AUTH-011   | Test écrit, échoue  | 30min |
| **AUTH-013** | GREEN : Implémenter `AuthService.refreshToken()` (vérifiér refresh, générér nouveau access) | AUTH-012   | Test AUTH-012 passe | 1h    |

**Comportement 4 : Logout (via Redis blacklist)**

> **Note** : La révocation JWT via Redis blacklist est confirmée pour la V1 (voir ADR-004 dans 01_ARCHITECTURE_TECHNIQUE). Redis est configuré ici pour le JWT blacklist. Il sera reutilisé au Sprint 4 pour BullMQ.

| ID           | Titre                                                                           | Dépendance | Critère de Fin      | Temps |
| ------------ | ------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **AUTH-014** | Configurer Redis (connexion + module NestJS) pour JWT blacklist                 | AUTH-013   | Redis connecté      | 45min |
| **AUTH-015** | RED : Test `POST /auth/logout` (success 204, token blackliste)                  | AUTH-014   | Test écrit, échoue  | 20min |
| **AUTH-016** | GREEN : Implémenter `AuthService.logout()` (ajouter token à la blacklist Redis) | AUTH-015   | Test AUTH-015 passe | 45min |

### Phase 1.3 : Endpoints Auth (Jour 4)

| ID           | Titre                                                   | Dépendance | Critère de Fin                            | Temps |
| ------------ | ------------------------------------------------------- | ---------- | ----------------------------------------- | ----- |
| **AUTH-017** | Créer `AuthController.register()` (POST /auth/register) | AUTH-007   | Tests AUTH-004 et AUTH-006 passent en E2E | 45min |
| **AUTH-018** | Créer `AuthController.login()` (POST /auth/login)       | AUTH-011   | Tests AUTH-008 et AUTH-010 passent en E2E | 45min |
| **AUTH-019** | Créer `AuthController.refresh()` (POST /auth/refresh)   | AUTH-013   | Test AUTH-012 passe en E2E                | 30min |
| **AUTH-020** | Créer `AuthController.logout()` (POST /auth/logout)     | AUTH-016   | Test AUTH-015 passe en E2E                | 30min |

### Phase 1.4 : Module Users -- Profil (Jour 5)

Cyclé TDD par comportement pour chaque endpoint utilisateur.

| ID           | Titre                                                                                   | Dépendance | Critère de Fin             | Temps |
| ------------ | --------------------------------------------------------------------------------------- | ---------- | -------------------------- | ----- |
| **USER-001** | RED : Test `GET /users/me` (success 200 avec infos utilisateur)                         | AUTH-020   | Test écrit, échoue         | 20min |
| **USER-002** | GREEN : Implémenter `UserService.getProfile()` + `UsersController.getMe()`              | USER-001   | Test USER-001 passe        | 45min |
| **USER-003** | RED : Test `PATCH /users/me` (update firstName/lastName)                                | USER-002   | Test écrit, échoue         | 20min |
| **USER-004** | GREEN : Implémenter `UserService.updateProfile()` + `UsersController.updateMe()`        | USER-003   | Test USER-003 passe        | 1h    |
| **USER-005** | RED : Test `PATCH /users/me/password` (change password)                                 | USER-004   | Test écrit, échoue         | 20min |
| **USER-006** | GREEN : Implémenter `UserService.changePassword()` + `UsersController.changePassword()` | USER-005   | Test USER-005 passe        | 1h    |
| **USER-007** | RED : Test `DELETE /users/me` (success 204, suppression compte)                         | USER-006   | Test écrit, échoue         | 20min |
| **USER-008** | RED : Test `DELETE /users/me` (erreur 409 si prêts actifs)                              | USER-007   | Test écrit, échoue         | 15min |
| **USER-009** | GREEN : Implémenter `UserService.deleteAccount()` + `UsersController.deleteMe()` (RGPD) | USER-008   | Tests USER-007/008 passent | 1h30  |

**Comportement 5 : Settings utilisateur**

| ID           | Titre                                                                                          | Dépendance | Critère de Fin      | Temps |
| ------------ | ---------------------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **USER-010** | RED : Test `GET /users/me/settings` (success 200, retourne préférences notifications + langue) | USER-009   | Test écrit, échoue  | 15min |
| **USER-011** | GREEN : Implémenter `UserService.getSettings()` + `UsersController.getSettings()`              | USER-010   | Test USER-010 passe | 45min |
| **USER-012** | RED : Test `PATCH /users/me/settings` (update enableReminders, defaultLanguage)                | USER-011   | Test écrit, échoue  | 15min |
| **USER-013** | GREEN : Implémenter `UserService.updateSettings()` + `UsersController.updateSettings()`        | USER-012   | Test USER-012 passe | 45min |

> **Note** : `PUT /users/me/avatar` (upload photo de profil) nécessite Cloudflare R2, configuré au Sprint 3.
> Cet endpoint est implémenté au Sprint 3 après ITEM-011 (PhotoStorageService).

🏁 **Livrable Sprint 1** : **Frontend peut s'authentifier + gérer profil et paramètres** (4 endpoints Auth + 6 endpoints Users).

---

## Sprint 2 : Module Borrowers (4 jours)

### Objectif

Gérer les emprunteurs (carnet de contacts du prêteur). Un emprunteur est un **contact** dans le carnet du prêteur,
identifié par son email. Le champ `userId` (nullable) permet de lier l'emprunteur à un compte Return existant — s'il
n'a pas encore de compte, une invitation lui sera envoyée lors de la création d'un prêt (Sprint 4).

**Contraintes spec OpenAPI** :

- Chaque emprunteur appartient à un prêteur (ownership via `userId` du JWT) → toute opération READ/UPDATE/DELETE
  vérifie que le borrower appartient au prêteur authentifié (403 si non propriétaire).
- La réponse `Borrower` inclut un objet `statistics` (BorrowerStatistics) — retourné avec des zéros par défaut en
  Sprint 2 car aucun prêt n'existe encore. L'endpoint dédié `GET /borrowers/{id}/statistics` est reporté au Sprint 6.
- `POST /borrowers` retourne un header `Location` avec l'URL du nouveau borrower (201).
- `GET /borrowers` supporte tri (`sortBy`: firstName, lastName, trustScore, totalLoans) et pagination
  (`page`, `limit`).

### Phase 2.1 : Base de Données

| ID           | Titre                                                                                                   | Dépendance | Critère de Fin      | Temps |
| ------------ | ------------------------------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **BORR-001** | Créer le schema Prisma `Borrower` (firstName, lastName, email, phoneNumber, userId FK, lenderUserId FK) | AUTH-001   | Migration appliquée | 30min |
| **BORR-002** | Ajouter index unique sur le couple `(lenderUserId, email)` et index sur `borrowers.lenderUserId`        | BORR-001   | Index créés         | 15min |

> **Note** : L'unicité est sur le couple `(lenderUserId, email)` — un même email peut exister comme emprunteur chez
> plusieurs prêteurs différents. `lenderUserId` identifie le prêteur propriétaire du contact.
> `userId` (nullable) est la FK vers le compte Return de l'emprunteur (null si pas encore inscrit).

### Phase 2.2 : TDD -- Borrower Service

Cycle TDD par comportement (RED → GREEN → REFACTOR → COMMIT).

**Comportement 1 : Création**

| ID           | Titre                                                                                                                                                | Dépendance | Critère de Fin                     | Temps |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **BORR-003** | RED : Test `POST /borrowers` (success 201 avec header Location)                                                                                      | BORR-002   | Test écrit, échoue                 | 20min |
| **BORR-004** | RED : Test `POST /borrowers` (erreur 409 si email existe déjà pour ce prêteur)                                                                       | BORR-003   | Test écrit, échoue                 | 15min |
| **BORR-005** | GREEN : Implémenter `BorrowerService.create()` (vérification unicité `(lenderUserId, email)` via Prisma, retour Borrower avec statistics par défaut) | BORR-004   | Tests BORR-003 et BORR-004 passent | 1h    |

**Comportement 2 : Lecture (avec ownership)**

| ID           | Titre                                                                                              | Dépendance | Critère de Fin      | Temps |
| ------------ | -------------------------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **BORR-006** | RED : Test `GET /borrowers` (liste paginée, triée, filtrée par lenderUserId)                       | BORR-005   | Test écrit, échoue  | 20min |
| **BORR-007** | GREEN : Implémenter `BorrowerService.findAll()` (pagination + tri via Prisma, filtre lenderUserId) | BORR-006   | Test BORR-006 passe | 45min |
| **BORR-008** | RED : Test `GET /borrowers/{id}` (success 200 + 403 si pas propriétaire)                           | BORR-007   | Test écrit, échoue  | 20min |
| **BORR-009** | GREEN : Implémenter `BorrowerService.findById()` (ownership check = 403, not found = 404)          | BORR-008   | Test BORR-008 passe | 30min |

**Comportement 3 : Modification et suppression (avec ownership)**

| ID           | Titre                                                                                                          | Dépendance | Critère de Fin                     | Temps |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **BORR-010** | RED : Test `PATCH /borrowers/{id}` (update success + 403 si pas propriétaire)                                  | BORR-009   | Test écrit, échoue                 | 20min |
| **BORR-011** | GREEN : Implémenter `BorrowerService.update()` (ownership check + update via Prisma + 409 si email dupliqué)   | BORR-010   | Test BORR-010 passe                | 45min |
| **BORR-012** | RED : Test `DELETE /borrowers/{id}` (success 204 + 403 si pas propriétaire)                                    | BORR-011   | Test écrit, échoue                 | 15min |
| **BORR-013** | RED : Test `DELETE /borrowers/{id}` (erreur 409 `active-loans-exist` si prêts actifs)                          | BORR-012   | Test écrit, échoue                 | 15min |
| **BORR-014** | GREEN : Implémenter `BorrowerService.delete()` (ownership check + vérifier absence de prêts actifs via Prisma) | BORR-013   | Tests BORR-012 et BORR-013 passent | 1h    |

### Phase 2.3 : Endpoints API

| ID           | Titre                                                                                                 | Dépendance | Critère de Fin                             | Temps |
| ------------ | ----------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------ | ----- |
| **BORR-015** | Créer `BorrowersController` (5 endpoints CRUD avec header Location sur POST, @UseGuards JwtAuthGuard) | BORR-014   | Tous les tests BORR-003 à BORR-014 passent | 1h30  |

🏁 **Livrable Sprint 2** : **Frontend peut gérer les emprunteurs** (5 endpoints Borrowers CRUD avec ownership, pagination, tri).

> **Note** : `GET /borrowers/{id}/statistics` (trustScore) est implémenté au Sprint 6 (HIST-006/007/010) car il nécessite les données de prêts (module Loans, Sprint 4). `GET /borrowers/{id}/loans` est également reporté au Sprint 6. En Sprint 2, le champ `statistics` de la réponse Borrower retourne un objet BorrowerStatistics avec des zéros par défaut.

> **Colonnes dénormalisées (Sprint 2)** : `trustScore` et `totalLoans` sont stockés comme colonnes Prisma sur le modèle `Borrower` (valeurs par défaut : 0). Le tri `sortBy=trustScore` et `sortBy=totalLoans` fonctionne nativement via Prisma. La mise à jour de ces colonnes sera implémentée au Sprint 4 (module Loans) via événements `loan.created`, `loan.status.changed`, `loan.deleted` — voir `src/common/events/loan.events.ts` pour les contrats d'événements.

---

## Sprint 3 : Module Items (4 jours)

### Objectif

Gerer les objets pretables + Upload photos vers Cloudflare R2. **Pas d'OCR en V1** -- la reconnaissance automatique
d'objets via Google Cloud Vision est reportee à la V2+ (hors scope MVP).

### Phase 3.1 : Base de Données + Setup R2

| ID           | Titre                                                                                  | Dépendance | Critère de Fin            | Temps |
| ------------ | -------------------------------------------------------------------------------------- | ---------- | ------------------------- | ----- |
| **ITEM-001** | Créer le schema Prisma `Item` (name, description, category, estimatedValue, userId FK) | AUTH-001   | Migration appliquée       | 30min |
| **ITEM-002** | Créer le schema Prisma `Photo` (url, thumbnailUrl, itemId FK)                          | ITEM-001   | Relation 1-N avec `Item`  | 30min |
| **ITEM-003** | Ajouter index sur `items.userId` et `items.category`                                   | ITEM-002   | Index créés               | 15min |
| **ITEM-004** | Configurer Cloudflare R2 SDK (stockage photos)                                         | SETUP-001  | Upload de test fonctionne | 1h    |

> **Note** : R2 est configuré ici (just-in-time) plutot qu'au Sprint 0, car c'est le premier sprint qui en a besoin.

### Phase 3.2 : TDD -- Item Service

Cyclé TDD par comportement.

**Comportement 1 : Création d'item**

| ID           | Titre                                                                             | Dépendance | Critère de Fin                     | Temps |
| ------------ | --------------------------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **ITEM-005** | RED : Test `POST /items` (création manuelle success 201)                          | ITEM-003   | Test écrit, échoue                 | 20min |
| **ITEM-006** | RED : Test `POST /items` (erreur 400 si category=MONEY sans estimatedValue)       | ITEM-005   | Test écrit, échoue                 | 15min |
| **ITEM-007** | GREEN : Implémenter `ItemService.create()` (validation category+value via Prisma) | ITEM-006   | Tests ITEM-005 et ITEM-006 passent | 1h    |

**Comportement 2 : Liste et consultation**

| ID            | Titre                                                                           | Dépendance | Critère de Fin       | Temps |
| ------------- | ------------------------------------------------------------------------------- | ---------- | -------------------- | ----- |
| **ITEM-008**  | RED : Test `GET /items` (liste paginée avec filtres category/available)         | ITEM-007   | Test écrit, échoue   | 25min |
| **ITEM-009**  | GREEN : Implémenter `ItemService.findAll()` (filtres + pagination via Prisma)   | ITEM-008   | Test ITEM-008 passe  | 1h    |
| **ITEM-009b** | RED : Test `GET /items/{id}` (success 200 avec photos)                          | ITEM-009   | Test écrit, échoue   | 15min |
| **ITEM-009c** | GREEN : Implémenter `ItemService.findById()` (avec relations photos via Prisma) | ITEM-009b  | Test ITEM-009b passe | 30min |
| **ITEM-009d** | RED : Test `PATCH /items/{id}` (update name/description/category)               | ITEM-009c  | Test écrit, échoue   | 15min |
| **ITEM-009e** | GREEN : Implémenter `ItemService.update()` (via Prisma)                         | ITEM-009d  | Test ITEM-009d passe | 30min |

**Comportement 3 : Upload photos**

| ID           | Titre                                                                     | Dépendance | Critère de Fin                   | Temps |
| ------------ | ------------------------------------------------------------------------- | ---------- | -------------------------------- | ----- |
| **ITEM-010** | RED : Test `POST /items/{id}/photos` (upload success 201)                 | ITEM-009   | Test écrit, échoue               | 25min |
| **ITEM-011** | GREEN : Implémenter `PhotoStorageService` (interface + R2 implémentation) | ITEM-004   | Upload/delete fonctionnel sur R2 | 2h    |
| **ITEM-012** | GREEN : Implémenter `ItemService.addPhotos()` (max 5 photos, upload R2)   | ITEM-011   | Test ITEM-010 passe              | 1h30  |

**Comportement 4 : Suppression**

| ID           | Titre                                                                                  | Dépendance | Critère de Fin      | Temps |
| ------------ | -------------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **ITEM-013** | RED : Test `DELETE /items/{id}` (erreur 409 si prêt en cours)                          | ITEM-012   | Test écrit, échoue  | 15min |
| **ITEM-014** | GREEN : Implémenter `ItemService.delete()` (vérifiér absence de prêt actif via Prisma) | ITEM-013   | Test ITEM-013 passe | 1h    |

### Phase 3.3 : Endpoints API

| ID           | Titre                                               | Dépendance | Critère de Fin                             | Temps |
| ------------ | --------------------------------------------------- | ---------- | ------------------------------------------ | ----- |
| **ITEM-015** | Créer `ItemsController` (6 endpoints CRUD + photos) | ITEM-014   | Tous les tests ITEM-005 à ITEM-014 passent | 2h    |

### Phase 3.4 : Avatar Utilisateur (après R2)

> **Note** : `PUT /users/me/avatar` est implémenté dans ce sprint car il dépend de `PhotoStorageService` (ITEM-011, interface R2). Le code réutilise la même interface de stockage que les photos d'items.

| ID           | Titre                                                                         | Dépendance | Critère de Fin      | Temps |
| ------------ | ----------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **USER-014** | RED : Test `PUT /users/me/avatar` (upload success 200, retourne URL)          | ITEM-011   | Test écrit, échoue  | 20min |
| **USER-015** | GREEN : Implémenter `UserService.updateAvatar()` (upload R2 via PhotoStorage) | USER-014   | Test USER-014 passe | 1h    |
| **USER-016** | Ajouter `UsersController.updateAvatar()` (PUT /users/me/avatar)               | USER-015   | Test E2E passe      | 30min |

🏁 **Livrable Sprint 3** : **Frontend peut gérer les objets avec photos** (6 endpoints Items + 1 endpoint Users: avatar).

---

## Sprint 4 : Module Loans (Coeur Métier) (8 jours)

### Objectif

Gestion complète du cyclé de vie des prêts (8 statuts, workflow de confirmation, clôture).

### Phase 4.0 : Setup BullMQ

| ID           | Titre                                                           | Dépendance | Critère de Fin                                   | Temps |
| ------------ | --------------------------------------------------------------- | ---------- | ------------------------------------------------ | ----- |
| **LOAN-001** | Configurer BullMQ (file de jobs asynchrones sur Redis existant) | AUTH-014   | Redis connecte, queue créée, job de test exécuté | 1h    |

> **Note** : Redis est déjà installe depuis le Sprint 1 (AUTH-014) pour le JWT blacklist. Ici on ajouté BullMQ pour les
> jobs asynchrones (CRON timeout 48h, futur scheduling de rappels).

### Phase 4.1 : Base de Données

| ID           | Titre                                                                                                                                 | Dépendance                   | Critère de Fin                | Temps |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------- | ----- |
| **LOAN-002** | Créer le schema Prisma `Loan` (itemId FK, lenderId FK, borrowerId FK, status enum, returnDate, confirmationDate, returnedDate, notes) | ITEM-001, AUTH-001, BORR-001 | Migration appliquée           | 1h    |
| **LOAN-003** | Ajouter index compose `loans(userId, status)` pour filtrage rapide                                                                    | LOAN-002                     | Index créé                    | 15min |
| **LOAN-004** | Ajouter contrainte CHECK `returnDate > createdAt`                                                                                     | LOAN-002                     | Contrainte PostgreSQL ajoutée | 20min |

### Phase 4.2 : TDD -- Création de pret

Cyclé TDD par comportement.

**Comportement 1 : Créer un pret**

| ID            | Titre                                                                                                                                  | Dépendance | Critère de Fin                     | Temps |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **LOAN-005**  | RED : Test `POST /loans` (success 201, status=PENDING_CONFIRMATION, item=UUID, borrower=UUID)                                          | LOAN-004   | Test écrit, échoue                 | 30min |
| **LOAN-005b** | RED : Test `POST /loans` (success 201, item=CreateItemDto inline, borrower=CreateBorrowerDto inline)                                   | LOAN-005   | Test écrit, échoue                 | 20min |
| **LOAN-006**  | RED : Test `POST /loans` (erreur 400 si returnDate < today)                                                                            | LOAN-005   | Test écrit, échoue                 | 15min |
| **LOAN-006b** | RED : Test `POST /loans` (erreur 429 si > 15 prêts/jour)                                                                               | LOAN-006   | Test écrit, échoue                 | 15min |
| **LOAN-007**  | GREEN : Implémenter `LoanFactory.toCreateInput()` (validation business rules)                                                          | LOAN-004   | Pattern Factory appliqué           | 1h30  |
| **LOAN-008**  | GREEN : Implémenter `LoanService.create()` (oneOf item/borrower, appel Factory + EventBus LOAN_CREATED via Prisma, rate limit 15/jour) | LOAN-007   | Tests LOAN-005 à LOAN-006b passent | 2h30  |

> **Note** : Conformément à la spec OpenAPI (RÈGLE DE DIAMANT), `POST /loans` accepte un `item` et un `borrower`
> passés soit comme UUID (référence existante), soit comme objet inline (CreateItemDto / CreateBorrowerDto).
> Le service orchestre la création en transaction si nécessaire. Les endpoints dédiés `POST /items` et
> `POST /borrowers` restent utilisables indépendamment. Rate limit : 15 prêts/jour via compteur Redis (429).

**Comportement 2 : Lister et consulter**

| ID           | Titre                                                                         | Dépendance | Critère de Fin      | Temps |
| ------------ | ----------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **LOAN-009** | RED : Test `GET /loans` (liste paginée avec filtres status/borrowerId)        | LOAN-008   | Test écrit, échoue  | 25min |
| **LOAN-010** | GREEN : Implémenter `LoanService.findAll()` (filtres + pagination via Prisma) | LOAN-009   | Test LOAN-009 passe | 1h    |
| **LOAN-011** | RED : Test `GET /loans/{id}` (success 200 avec relations item+borrower)       | LOAN-010   | Test écrit, échoue  | 20min |
| **LOAN-012** | GREEN : Implémenter `LoanService.findById()` (avec relations via Prisma)      | LOAN-011   | Test LOAN-011 passe | 45min |

### Phase 4.3 : TDD -- Workflow de Statut

**Comportement 3 : Confirmation / Contestation**

| ID           | Titre                                                                                                               | Dépendance | Critère de Fin                     | Temps |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **LOAN-013** | RED : Test `POST /loans/{id}/confirm` (PENDING_CONFIRMATION -> ACTIVE)                                              | LOAN-012   | Test écrit, échoue                 | 20min |
| **LOAN-014** | RED : Test `POST /loans/{id}/contest` (PENDING_CONFIRMATION -> CONTESTED, reason requis minLength=10 maxLength=500) | LOAN-013   | Test écrit, échoue                 | 20min |
| **LOAN-015** | GREEN : Implémenter `LoanStatusMachine` (validateur de transitions)                                                 | LOAN-004   | Machine à états créée              | 2h    |
| **LOAN-016** | GREEN : Implémenter `LoanService.confirm()` et `LoanService.contest()`                                              | LOAN-015   | Tests LOAN-013 et LOAN-014 passent | 1h30  |

**Comportement 4 : Transitions de statut**

| ID           | Titre                                                                                       | Dépendance | Critère de Fin                    | Temps |
| ------------ | ------------------------------------------------------------------------------------------- | ---------- | --------------------------------- | ----- |
| **LOAN-017** | RED : Test ACTIVE -> AWAITING_RETURN si returnDate dépassée                                 | LOAN-016   | Test écrit, échoue                | 20min |
| **LOAN-018** | RED : Test AWAITING_RETURN -> RETURNED                                                      | LOAN-017   | Test écrit, échoue                | 20min |
| **LOAN-019** | RED : Test AWAITING_RETURN -> NOT_RETURNED après 5 rappels (via AllRemindersExhaustedEvent) | LOAN-018   | Test écrit, échoue                | 25min |
| **LOAN-020** | RED : Test transition invalide retourne 409 Conflict (ex: RETURNED -> ACTIVE)               | LOAN-019   | Test écrit, échoue                | 20min |
| **LOAN-021** | GREEN : Implémenter `LoanService.updateStatus()` (validation via StatusMachine)             | LOAN-020   | Tests LOAN-017 à LOAN-020 passent | 2h    |

> **Note sur LOAN-019** : La transition AWAITING_RETURN -> NOT_RETURNED est déclenchée par un événement
> `AllRemindersExhaustedEvent` emis par le module Reminder (Sprint 5). Le module Loan écoute cet événement via
> `@OnEvent` -- il ne connait pas le nombre de rappels (découplage inter-modules). Le test mocke cet événement.

**Comportement 5 : Timeout 48h auto-confirmation**

| ID           | Titre                                                                              | Dépendance         | Critère de Fin      | Temps |
| ------------ | ---------------------------------------------------------------------------------- | ------------------ | ------------------- | ----- |
| **LOAN-022** | RED : Test timeout auto 48h (PENDING_CONFIRMATION -> ACTIVE_BY_DEFAULT via CRON)   | LOAN-021           | Test écrit, échoue  | 30min |
| **LOAN-023** | GREEN : Implémenter CRON Job timeout 48h (PENDING -> ACTIVE_BY_DEFAULT via BullMQ) | LOAN-022, LOAN-001 | Test LOAN-022 passe | 2h    |

**Comportement 6 : Modification et suppression de prêt**

| ID           | Titre                                                                                      | Dépendance | Critère de Fin      | Temps |
| ------------ | ------------------------------------------------------------------------------------------ | ---------- | ------------------- | ----- |
| **LOAN-030** | RED : Test `PATCH /loans/{id}` (update notes/returnDate success 200)                       | LOAN-012   | Test écrit, échoue  | 20min |
| **LOAN-031** | GREEN : Implémenter `LoanService.update()` (via Prisma)                                    | LOAN-030   | Test LOAN-030 passe | 45min |
| **LOAN-032** | RED : Test `DELETE /loans/{id}` (soft delete success 204, erreur 409 si déjà rendu)        | LOAN-031   | Test écrit, échoue  | 25min |
| **LOAN-033** | GREEN : Implémenter `LoanService.delete()` (soft delete + annulation rappels via EventBus) | LOAN-032   | Test LOAN-032 passe | 1h    |

### Phase 4.4 : Endpoints API

| ID           | Titre                                                             | Dépendance | Critère de Fin                     | Temps |
| ------------ | ----------------------------------------------------------------- | ---------- | ---------------------------------- | ----- |
| **LOAN-024** | Créer `LoansController.create()` (POST /loans)                    | LOAN-008   | Tests LOAN-005 et LOAN-006 passent | 1h    |
| **LOAN-025** | Créer `LoansController.findAll()` (GET /loans)                    | LOAN-010   | Test LOAN-009 passe                | 45min |
| **LOAN-026** | Créer `LoansController.findOne()` (GET /loans/{id})               | LOAN-012   | Test LOAN-011 passe                | 30min |
| **LOAN-027** | Créer `LoansController.confirm()` (POST /loans/{id}/confirm)      | LOAN-016   | Test LOAN-013 passe                | 30min |
| **LOAN-028** | Créer `LoansController.contest()` (POST /loans/{id}/contest)      | LOAN-016   | Test LOAN-014 passe                | 30min |
| **LOAN-029** | Créer `LoansController.updateStatus()` (PATCH /loans/{id}/status) | LOAN-021   | Tests LOAN-017 à LOAN-020 passent  | 1h    |
| **LOAN-034** | Créer `LoansController.update()` (PATCH /loans/{id})              | LOAN-031   | Test LOAN-030 passe                | 30min |
| **LOAN-035** | Créer `LoansController.delete()` (DELETE /loans/{id})             | LOAN-033   | Test LOAN-032 passe                | 30min |

### Phase 4.5 : Intégration inter-modules (Sprint 4)

| ID           | Titre                                                                                                                      | Dépendance | Critère de Fin                   | Temps |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------- | ----- |
| **LOAN-036** | Implémenter filtre `available` sur `GET /items` (item non associé à un prêt actif)                                         | LOAN-008   | Test filtre passe                | 1h    |
| **LOAN-037** | Écouter événements `LOAN_CREATED`, `LOAN_STATUS_CHANGED` pour mettre à jour `Borrower.trustScore` et `Borrower.totalLoans` | LOAN-021   | Stats dénormalisées mises à jour | 1h30  |
| **LOAN-038** | Activer vérification prêts actifs dans `BorrowerService.delete()` (409 `active-loans-exist`)                               | LOAN-002   | Test 409 passe                   | 30min |
| **LOAN-039** | Activer vérification prêts actifs dans `ItemService.delete()` (409 `item-currently-loaned`)                                | LOAN-002   | Test 409 passe                   | 30min |

🏁 **Livrable Sprint 4** : **Frontend peut créer et suivre des prêts (workflow complet)** (8 endpoints Loans + filtre `available` items + stats borrowers).

---

## Sprint 4.5 : Intégration & Corrections Post-Sprint 4 (3 jours)

### Objectif

Corriger les lacunes révélées par les tests d'intégration avec le backend réel après le Sprint 4.
Le problème critique est que **l'emprunteur ne peut pas voir les prêts qui lui sont adressés** car
`Borrower.userId` n'est jamais peuplé. Ce sprint consolide les Sprints 0-4 avant d'attaquer les Sprints 5-6.

> **Cause racine** : `Borrower.userId` est nullable (`@map("user_id")`). Quand un prêteur crée un contact
> via `POST /borrowers` ou implicitement via `POST /loans`, le champ `userId` reste `NULL`. L'événement
> `user.registered` est bien émis par `AuthService.register()` mais **aucun listener** n'existe dans
> `BorrowersService` pour associer le `Borrower` au nouveau `User` par correspondance d'email.
> En conséquence, `GET /loans?role=borrower` (qui filtre `WHERE borrower.userId = currentUserId`) retourne
> toujours une liste vide.

> **Modèle de droits rappel** :
> - **Prêteur** : créer, voir, modifier (notes/date retour), supprimer, marquer rendu, abandonner
> - **Emprunteur** : voir les prêts reçus, confirmer, contester (avec raison) — ne peut PAS modifier ni supprimer
> - **Tiers** : aucun accès (403 Forbidden)

### Phase 4.5.1 : Listener de liaison emprunteur-utilisateur (Jour 1)

| ID              | Titre                                                                                                              | Dépendance | Critère de Fin                                                                           | Temps |
|-----------------|--------------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------|-------|
| **INTEG-001**   | Test TDD : quand `user.registered` émis, les `Borrower` avec même email reçoivent `userId`                        | LOAN-037   | Test RED écrit (écoute événement, vérifie `userId` mis à jour)                           | 1h    |
| **INTEG-002**   | Implémenter `@OnEvent('user.registered')` dans `BorrowersService` : chercher tous `Borrower` par email, mettre à jour `userId` | INTEG-001  | Test GREEN passe, `Borrower.userId` lié                                                  | 1h30  |
| **INTEG-003**   | Test TDD : si aucun `Borrower` ne matche l'email du nouvel utilisateur, le listener ne fait rien (pas d'erreur)    | INTEG-002  | Test GREEN, aucun side effect                                                            | 30min |
| **INTEG-004**   | Test TDD : si plusieurs `Borrower` (de différents prêteurs) ont le même email, tous reçoivent le `userId`         | INTEG-002  | Test GREEN, `updateMany` appliqué                                                        | 30min |

> **Note** : Un même utilisateur peut être emprunteur de plusieurs prêteurs. Chaque prêteur a son propre
> enregistrement `Borrower` pour la même personne. Le listener doit mettre à jour **tous** les `Borrower`
> avec l'email correspondant (via `prisma.borrower.updateMany()`).

### Phase 4.5.2 : Tests unitaires pour le code dual-perspective déjà implémenté (Jour 1-2)

> **Contexte** : Le code `role=borrower` dans `findAll()` et `resolveUserRole()` dans `findById()` a été
> implémenté au Sprint 4, mais **sans tests unitaires dédiés**. Ces tests doivent être écrits AVANT
> d'ajouter la migration de rattachement.

| ID              | Titre                                                                                                              | Dépendance | Critère de Fin                                                                           | Temps |
|-----------------|--------------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------|-------|
| **INTEG-005**   | Test TDD : `findAll(role=borrower)` retourne les prêts où `borrower.userId = currentUser`                         | INTEG-002  | Test GREEN, filtre `where.borrower.userId` vérifié                                       | 45min |
| **INTEG-006**   | Test TDD : `findAll(role=borrower)` + `borrowerId` fourni → `borrowerId` est ignoré (pas de conflit logique)      | INTEG-005  | Test GREEN, le filtre `borrowerId` est sans effet en mode borrower                       | 30min |
| **INTEG-007**   | Test TDD : `findById()` accessible par l'emprunteur (via `resolveUserRole`) — retourne le prêt                    | INTEG-002  | Test GREEN, réponse `LoanResponse`                                                       | 30min |
| **INTEG-008**   | Test TDD : `findById()` par un tiers (ni prêteur ni emprunteur) → 403 Forbidden                                   | INTEG-007  | Test GREEN, `ForbiddenException` levée                                                   | 30min |

> **Note INTEG-006** : Quand `role=borrower`, le filtre `borrowerId` n'a pas de sens métier (l'utilisateur
> connecté EST l'emprunteur). Le code doit ignorer ce paramètre dans cette perspective pour éviter un
> filtre contradictoire. L'implémentation actuelle applique les deux filtres
> (`where.borrower.userId = X AND where.borrowerId = Y`), ce qui peut produire une liste vide par erreur.

### Phase 4.5.3 : Migration de rattachement des données existantes (Jour 2)

| ID              | Titre                                                                                                              | Dépendance | Critère de Fin                                                                           | Temps |
|-----------------|--------------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------|-------|
| **INTEG-009**   | Créer migration Prisma : rattacher les `Borrower` existants dont l'email correspond à un `User.email` inscrit     | INTEG-002  | Migration appliquée, `Borrower.userId` peuplé pour les correspondances existantes        | 1h    |
| **INTEG-010**   | Test d'intégration : `GET /loans?role=borrower` retourne les prêts de l'emprunteur après liaison                  | INTEG-005  | Test Supertest passe, réponse non vide                                                   | 1h    |
| **INTEG-011**   | Test d'intégration : `GET /loans/{id}` accessible par l'emprunteur (via `resolveUserRole`)                        | INTEG-010  | Test Supertest 200 OK pour l'emprunteur                                                  | 30min |
| **INTEG-012**   | Test d'intégration : `GET /loans?role=borrower` par un utilisateur tiers (ni prêteur ni emprunteur) retourne vide | INTEG-010  | Test Supertest 200 avec `data: []`                                                       | 30min |

### Phase 4.5.4 : Correctifs OpenAPI + Review (Jour 3)

| ID              | Titre                                                                                                              | Dépendance | Critère de Fin                                                                           | Temps |
|-----------------|--------------------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------|-------|
| **INTEG-013**   | OpenAPI : documenter l'accès dual-perspective (`GET /loans/{id}`, `PATCH`, `DELETE` — qui peut faire quoi)         | INTEG-009  | Spec à jour, descriptions explicites sur les droits prêteur/emprunteur                   | 30min |
| **INTEG-014**   | OpenAPI : documenter que `borrowerId` n'est pertinent qu'en mode `role=lender`                                     | INTEG-013  | Param `borrowerId` : description mise à jour                                             | 15min |
| **INTEG-015**   | Review code + fix bugs d'intégration avec le frontend                                                              | INTEG-012  | Tous les tests passent, CI verte                                                         | 2h    |

🏁 **Livrable Sprint 4.5** : **Perspective emprunteur fonctionnelle** (`Borrower.userId` lié automatiquement
à l'inscription, `GET /loans?role=borrower` retourne les prêts, tests unitaires dual-perspective, migration
de rattachement des données existantes, OpenAPI documenté avec les droits par rôle).

---

## Sprint 4.6 : Contact Invitation System (5 jours)

### Objectif

Mettre en place le système d'invitation mutuelle pour la relation de contact. Avant ce sprint, n'importe qui pouvait
être ajouté comme contact sans consentement. Après ce sprint, un prêteur doit inviter un utilisateur inscrit, et
l'invitation doit être acceptée avant de pouvoir créer un prêt pour cette personne.

### Taches

| ID            | Titre                                                                                                         | Dépendance    | Critère de Fin                                                                                                   | Temps |
|---------------|---------------------------------------------------------------------------------------------------------------|---------------|------------------------------------------------------------------------------------------------------------------|-------|
| **CINV-001**  | Ajouter enum `InvitationStatus` (PENDING, ACCEPTED, REJECTED, EXPIRED) dans schema Prisma                     | -             | Enum créé, `prisma migrate dev` passe                                                                            | 30min |
| **CINV-002**  | Créer table `contact_invitations` (id, senderUserId, recipientEmail, recipientUserId?, status, createdAt, expiresAt, acceptedAt, rejectedAt) | CINV-001 | Table créée avec contrainte unique `(senderUserId, recipientEmail)`, migration appliquée       | 1h    |
| **CINV-003**  | Test TDD : `searchUsers(query, senderId)` — retourne utilisateurs correspondant à email/prénom/nom, exclut soi-même et contacts déjà acceptés | CINV-002 | Test RED écrit                                                                                | 30min |
| **CINV-004**  | Implémenter `searchUsers()` dans `ContactInvitationsService`                                                  | CINV-003      | Test CINV-003 GREEN                                                                                              | 1h    |
| **CINV-005**  | Test TDD : `sendInvitation(senderId, recipientEmail)` — cas nominaux + 404 user not found + 409 already sent + 400 self-invitation | CINV-004 | Tests RED écrits                                                                              | 1h    |
| **CINV-006**  | Implémenter `sendInvitation()` avec expiration 30 jours                                                       | CINV-005      | Tests CINV-005 GREEN                                                                                             | 1h30  |
| **CINV-007**  | Test TDD : `acceptInvitation(id, userId)` → crée Borrower chez émetteur + émet `ContactInvitationAccepted`   | CINV-006      | Test RED écrit                                                                                                   | 30min |
| **CINV-008**  | Implémenter `acceptInvitation()` — transaction : update statut + création Borrower                            | CINV-007      | Test CINV-007 GREEN, Borrower créé                                                                               | 1h30  |
| **CINV-009**  | Test TDD : `rejectInvitation(id, userId)` + `listReceivedInvitations(userId, status?)`                        | CINV-008      | Tests RED écrits                                                                                                 | 30min |
| **CINV-010**  | Implémenter `rejectInvitation()` + `listReceivedInvitations()`                                                | CINV-009      | Tests CINV-009 GREEN                                                                                             | 1h    |
| **CINV-011**  | Créer `contact-invitation.events.ts` (ContactInvitationAccepted, ContactInvitationRejected)                   | CINV-008      | Événements typés exportés                                                                                        | 30min |
| **CINV-012**  | Créer `ContactInvitationsController` : 6 endpoints (search, send, list, accept, reject, delete) avec Guards JWT | CINV-010   | Controllers créés, routes accessibles                                                                            | 1h30  |
| **CINV-013**  | Tests Supertest : 6 endpoints nominaux + cas d'erreur (404, 409, 400, 403)                                    | CINV-012      | Tests Supertest GREEN                                                                                            | 2h    |
| **CINV-014**  | Créer `ContactInvitationListener` : `@OnEvent('user.registered')` — lier invitations PENDING par email        | CINV-011      | Listener actif, test unitaire passe                                                                              | 1h    |
| **CINV-015**  | Créer `ContactInvitationsModule` (imports: PrismaModule, EventEmitter2 / providers / exports)                 | CINV-012      | Module importable dans AppModule                                                                                 | 30min |
| **CINV-016**  | Tests intégration inter-modules : Loan creation → vérifie contact ACCEPTED requis                             | CINV-015      | Test d'intégration passe                                                                                        | 1h    |
| **CINV-017**  | Buffer review + fix bugs + documentation OpenAPI endpoints ContactInvitations                                  | CINV-016      | CI verte, OpenAPI validé par Spectral                                                                            | 2h    |

🏁 **Livrable Sprint 4.6** : **Système d'invitation de contacts complet** (module `ContactInvitations` avec
6 endpoints, table `contact_invitations`, consentement explicite garanti, événements inter-modules, tests TDD +
Supertest complets). Un prêt ne peut être créé que pour un contact avec invitation ACCEPTED.

---

## Sprint 5 : Module Reminders + Notifications (5 jours)

### Objectif

Système de rappels 100% automatiques + Notifications push. **Pas de rappels manuels** -- les rappels sont
exclusivement geres par le système selon la politique fixe.

### Phase 5.0 : Setup FCM

| ID          | Titre                                                                                       | Dépendance | Critère de Fin                             | Temps |
| ----------- | ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------ | ----- |
| **REM-001** | Configurer Firebasé SDK (projet Firebase, service account, google-services.json, test push) | SETUP-001  | Notification push de test reçue sur device | 2h    |

### Phase 5.1 : Base de Données

| ID          | Titre                                                                                                              | Dépendance | Critère de Fin      | Temps |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------- | ----- |
| **REM-002** | Créer le schema Prisma `Reminder` (loanId FK, type enum, status enum, scheduledFor, sentAt, message, channel enum) | LOAN-002   | Migration appliquée | 45min |
| **REM-003** | Créer le schema Prisma `Notification` (userId FK, type enum, title, body, isRead, relatedLoanId FK)                | AUTH-001   | Migration appliquée | 30min |
| **REM-004** | Ajouter index sur `reminders(loanId, status)` et `notifications(userId, isRead)`                                   | REM-003    | Index créés         | 15min |

### Phase 5.2 : TDD -- Reminder Service

Cyclé TDD par comportement.

**Comportement 1 : Planification automatique des rappels**

| ID          | Titre                                                                                                                                                    | Dépendance        | Critère de Fin                    | Temps |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------- | ----- |
| **REM-005** | RED : Test création automatique de 5 rappels (PREVENTIVE J-3, ON_DUE_DATE J, FIRST_OVERDUE J+7, SECOND_OVERDUE J+14, FINAL_OVERDUE J+21) quand prêt créé | REM-004           | Test écrit, échoue                | 30min |
| **REM-006** | GREEN : Implémenter `ReminderPolicy.calculateDates()` (politique fixe : J-3, J, J+7, J+14, J+21)                                                         | REM-005           | Politique de calcul fonctionnelle | 1h    |
| **REM-007** | GREEN : Implémenter `ReminderService.scheduleReminders()` (création automatique via Prisma + BullMQ)                                                     | REM-006           | Test REM-005 passe                | 2h    |
| **REM-008** | GREEN : Écouter événement `LOAN_CREATED` (EventBus) pour déclenchér `scheduleReminders()`                                                                | REM-007, LOAN-008 | Pattern Observer appliqué         | 1h    |

**Comportement 2 : Envoi automatique des rappels**

| ID          | Titre                                                                                   | Dépendance | Critère de Fin                         | Temps |
| ----------- | --------------------------------------------------------------------------------------- | ---------- | -------------------------------------- | ----- |
| **REM-009** | RED : Test envoi automatique de rappel via CRON (status SCHEDULED -> SENT)              | REM-008    | Test écrit, échoue                     | 30min |
| **REM-010** | GREEN : Implémenter CRON Job `sendScheduledReminders()` (BullMQ chaque heure)           | REM-009    | Test REM-009 passe                     | 2h    |
| **REM-011** | GREEN : Implémenter `NotificationService.send()` (push FCM + création en DB via Prisma) | REM-001    | Notification créée en DB + push envoye | 2h    |

**Comportement 3 : Epuisement des rappels et abandon**

| ID          | Titre                                                                                      | Dépendance | Critère de Fin     | Temps |
| ----------- | ------------------------------------------------------------------------------------------ | ---------- | ------------------ | ----- |
| **REM-012** | RED : Test emission `AllRemindersExhaustedEvent` après le 5e rappel envoye (FINAL_OVERDUE) | REM-010    | Test écrit, échoue | 25min |
| **REM-013** | GREEN : Implémenter emission `AllRemindersExhaustedEvent` dans le CRON d'envoi             | REM-012    | Test REM-012 passe | 1h    |

> **Note** : L'événement `AllRemindersExhaustedEvent` est emis par le module Reminder après l'envoi du 5e rappel
> (FINAL_OVERDUE). Le module Loan écoute cet événement (via `@OnEvent`) pour passer le prêt en statut NOT_RETURNED.
> Le module Reminder ne connait pas les statuts de prêt -- découplage strict.

**Comportement 4 : Consultation des notifications**

| ID          | Titre                                                                       | Dépendance | Critère de Fin     | Temps |
| ----------- | --------------------------------------------------------------------------- | ---------- | ------------------ | ----- |
| **REM-014** | RED : Test `GET /notifications` (liste paginée avec filtre unreadOnly)      | REM-011    | Test écrit, échoue | 20min |
| **REM-015** | GREEN : Implémenter `NotificationService.findAll()` (pagination via Prisma) | REM-014    | Test REM-014 passe | 1h    |
| **REM-016** | RED : Test `PATCH /notifications/{id}/read` (marquer comme lu success 200)  | REM-015    | Test écrit, échoue | 15min |
| **REM-017** | GREEN : Implémenter `NotificationService.markAsRead()` (via Prisma)         | REM-016    | Test REM-016 passe | 30min |
| **REM-020** | RED : Test `POST /notifications/read-all` (marquer toutes comme lues 204)   | REM-017    | Test écrit, échoue | 15min |
| **REM-021** | GREEN : Implémenter `NotificationService.markAllAsRead()` (via Prisma)      | REM-020    | Test REM-020 passe | 30min |

### Phase 5.3 : Endpoints API

| ID          | Titre                                                                          | Dépendance | Critère de Fin     | Temps |
| ----------- | ------------------------------------------------------------------------------ | ---------- | ------------------ | ----- |
| **REM-018** | Créer `NotificationsController.findAll()` (GET /notifications)                 | REM-015    | Test REM-014 passe | 45min |
| **REM-019** | Créer `NotificationsController.markAsRead()` (PATCH /notifications/{id}/read)  | REM-017    | Test REM-016 passe | 30min |
| **REM-022** | Créer `NotificationsController.markAllAsRead()` (POST /notifications/read-all) | REM-021    | Test REM-020 passe | 30min |

🏁 **Livrable Sprint 5** : **Frontend reçoit des notifications push automatiques** (3 endpoints Notifications + système de rappels automatique en arrière-plan).

---

## Sprint 6 : Module History + Finalisation (4 jours)

### Objectif

Statistiques + Historique archivé + Tests E2E complets + Seed de données pour le frontend.

### Phase 6.1 : Base de Données

| ID           | Titre                                                                      | Dépendance | Critère de Fin | Temps |
| ------------ | -------------------------------------------------------------------------- | ---------- | -------------- | ----- |
| **HIST-001** | Ajouter index compose `loans(userId, status, returnedDate)` pour analytics | LOAN-002   | Index créé     | 15min |

### Phase 6.2 : TDD -- History Service

Cyclé TDD par comportement.

**Comportement 1 : Historique des prêts**

| ID           | Titre                                                                                      | Dépendance | Critère de Fin      | Temps |
| ------------ | ------------------------------------------------------------------------------------------ | ---------- | ------------------- | ----- |
| **HIST-002** | RED : Test `GET /history/loans` (filtre status RETURNED/NOT_RETURNED/ABANDONED)            | HIST-001   | Test écrit, échoue  | 20min |
| **HIST-003** | GREEN : Implémenter `HistoryService.getArchivedLoans()` (filtres date + status via Prisma) | HIST-002   | Test HIST-002 passe | 1h30  |

**Comportement 2 : Statistiques**

| ID           | Titre                                                                                         | Dépendance | Critère de Fin      | Temps |
| ------------ | --------------------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **HIST-004** | RED : Test `GET /history/statistics` (overview + byCategory + topBorrowers + mostLoanedItems) | HIST-003   | Test écrit, échoue  | 30min |
| **HIST-005** | GREEN : Implémenter `HistoryService.getStatistics()` (agregations Prisma)                     | HIST-004   | Test HIST-004 passe | 2h    |

**Comportement 3 : Trust Score emprunteur**

> **Definition du trustScore** : Ratio simple `(prêts retournés / total de prêts terminés) * 100` exprime en
> pourcentage. Un emprunteur sans prêt terminé à un score de `null` (non calculable). Pas d'algorithme
> complexe en V1 -- on pourra ponderer par anciennete ou délai en V2+.

| ID           | Titre                                                                                | Dépendance | Critère de Fin      | Temps |
| ------------ | ------------------------------------------------------------------------------------ | ---------- | ------------------- | ----- |
| **HIST-006** | RED : Test `GET /borrowers/{id}/statistics` (trustScore = returned/total \* 100)     | BORR-002   | Test écrit, échoue  | 25min |
| **HIST-007** | GREEN : Implémenter `BorrowerService.getStatistics()` (calcul trustScore via Prisma) | HIST-006   | Test HIST-006 passe | 1h30  |

### Phase 6.3 : Endpoints API

| ID           | Titre                                                                                   | Dépendance | Critère de Fin      | Temps |
| ------------ | --------------------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **HIST-008** | Créer `HistoryController.getLoans()` (GET /history/loans)                               | HIST-003   | Test HIST-002 passe | 45min |
| **HIST-009** | Créer `HistoryController.getStatistics()` (GET /history/statistics)                     | HIST-005   | Test HIST-004 passe | 45min |
| **HIST-010** | Ajouter endpoint `BorrowersController.getStatistics()` (GET /borrowers/{id}/statistics) | HIST-007   | Test HIST-006 passe | 30min |

**Comportement 4 : Historique de prêts par emprunteur**

| ID           | Titre                                                                         | Dépendance | Critère de Fin      | Temps |
| ------------ | ----------------------------------------------------------------------------- | ---------- | ------------------- | ----- |
| **HIST-011** | RED : Test `GET /borrowers/{id}/loans` (liste des prêts filtrée par statut)   | LOAN-010   | Test écrit, échoue  | 20min |
| **HIST-012** | GREEN : Implémenter `BorrowerService.getLoans()` (filtre status via Prisma)   | HIST-011   | Test HIST-011 passe | 1h    |
| **HIST-013** | Ajouter endpoint `BorrowersController.getLoans()` (GET /borrowers/{id}/loans) | HIST-012   | Test HIST-011 passe | 30min |

### Phase 6.4 : Tests E2E + Finalisation

| ID          | Titre                                                                                     | Dépendance | Critère de Fin                                | Temps |
| ----------- | ----------------------------------------------------------------------------------------- | ---------- | --------------------------------------------- | ----- |
| **E2E-001** | Écrire test E2E : Flow complet (register -> create loan -> confirm -> reminder -> return) | HIST-010   | Test E2E passe                                | 2h    |
| **E2E-002** | Verifier couverture de code (Domain 95%, Services 90%, Controllers 70%)                   | E2E-001    | Seuils respectes                              | 1h    |
| **E2E-003** | Configurer Swagger UI (documentation interactive accessible sur /api/docs)                | HIST-010   | Swagger UI affiché tous les endpoints         | 1h    |
| **E2E-004** | Créer script de seeding (données réalistes pour le frontend)                              | HIST-010   | Script executable, données de dev disponibles | 1h30  |

> **E2E-003 (Swagger UI)** : La spec OpenAPI est rédigée manuellement (`openapi.yaml`). Swagger UI est configuré pour
> servir cette spec -- pas de generation automatique depuis les decorateurs NestJS.

> **E2E-004 (Seeding)** : Script Prisma seed avec des prêteurs, emprunteurs, objets et prêts dans différents statuts.
> Indispensable pour le développement frontend en parallèle.

### Phase 6.5 : Migration Cloudflare R2 (Stockage Photos)

> **Note** : Le stockage photos/avatars utilise le disque local (`uploads/`) durant le développement.
> Cette phase bascule vers Cloudflare R2 pour la production. L'interface `PhotoStorageService` est déjà
> abstraite — seule l'implémentation concrète change.

| ID         | Titre                                                                                    | Dépendance | Critère de Fin                              | Temps |
| ---------- | ---------------------------------------------------------------------------------------- | ---------- | ------------------------------------------- | ----- |
| **R2-001** | Configurer Cloudflare R2 SDK (@aws-sdk/client-s3 + credentials R2)                       | ITEM-011   | Upload/download de test fonctionnel via SDK | 1h30  |
| **R2-002** | Implémenter `R2StorageService` (implémente l'interface PhotoStorageService existante)    | R2-001     | Upload, delete et getUrl fonctionnels       | 2h    |
| **R2-003** | Basculer l'injection : R2StorageService en prod, LocalStorageService en dev (`NODE_ENV`) | R2-002     | Tests passent en local, R2 utilisé en prod  | 45min |
| **R2-004** | Supprimer `useStaticAssets()` de main.ts (plus nécessaire avec R2 en prod)               | R2-003     | Build réussit, health check OK              | 15min |

### Phase 6.6 : Containerisation & Déploiement Production

| ID             | Titre                                                                                       | Dépendance | Critère de Fin                                       | Temps |
| -------------- | ------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------- | ----- |
| **DEPLOY-001** | Vérifier et optimiser le `Dockerfile` (taille image < 200 MB, health checks intégrés)       | SETUP-011  | Image optimisée, `docker run` fonctionne             | 1h    |
| **DEPLOY-002** | Créer `fly.toml` (app name, region `cdg`, release_command: `prisma migrate deploy`, checks) | DEPLOY-001 | `fly deploy --dry-run` passe                         | 1h    |
| **DEPLOY-003** | Provisionner PostgreSQL managed + Redis (Upstash) + Cloudflare R2 bucket sur Fly.io         | DEPLOY-002 | `fly postgres create` + Upstash + R2 configurés      | 1h30  |
| **DEPLOY-004** | Premier `fly deploy` + vérification health checks + smoke tests production                  | DEPLOY-003 | `GET /health` et `GET /ready` retournent 200         | 1h30  |
| **DEPLOY-005** | Configurer DNS (`api.return.app`) + certificat SSL (Let's Encrypt via Fly.io)               | DEPLOY-004 | `curl https://api.return.app/v1/health` retourne 200 | 30min |

> **Note DEPLOY-002** : Le `fly.toml` utilise `release_command = "npx prisma migrate deploy"` pour appliquer les
> migrations automatiquement avant de router le trafic vers la nouvelle version. Cette stratégie est décrite dans
> la section 7 de `01_ARCHITECTURE_TECHNIQUE.md`.

🏁 **Livrable Sprint 6** : **Backend complet déployé en production avec tests E2E, couverture respectée, Swagger UI, données de seed, Cloudflare R2 opérationnel et infrastructure Fly.io fonctionnelle.**

---

## Résumé des Sprints

| Sprint           | Durée           | Modules                          | Endpoints livres                                  | Tests          |
| ---------------- | --------------- | -------------------------------- | ------------------------------------------------- | -------------- |
| **Sprint 0**     | 3-4 jours       | Setup infrastructuré             | 2 (health + ready) + Docker                       | CI/CD          |
| **Sprint 1**     | 5 jours         | Auth + Users                     | 10 (Auth: 4, Users: 6)                            | ~20 tests      |
| **Sprint 2**     | 4 jours         | Borrowers                        | 5                                                 | ~8 tests       |
| **Sprint 3**     | 4 jours         | Items + Avatar                   | 7 (Items: 6, Avatar: 1)                           | ~10 tests      |
| **Sprint 4**     | 8 jours         | Loans (coeur métier)             | 8 + intégration inter-modules                     | ~20 tests      |
| **Sprint 4.5**   | 3 jours         | Corrections intégration Loans    | 0 (listener événement + migration rattachement + tests dual-perspective + doc OpenAPI) | ~12 tests      |
| **Sprint 4.6**   | 5 jours         | Contact Invitation System        | 6 (search, send, list, accept, reject, delete)    | ~17 tests      |
| **Sprint 5**     | 5 jours         | Reminders + Notifications        | 3 + système auto                                  | ~12 tests      |
| **Sprint 6**     | 4 jours         | History + R2 + Déploiement       | 5 (History: 2, Borrower stats/loans: 2, E2E) + R2 | E2E complet    |
| **TOTAL**        | **46-50 jours** | **8 modules + 1 correctif**     | **~46 endpoints** (+ 3 réservés V2)               | **~91+ tests** |

> **Endpoints réservés V2** : 3 endpoints Reminders (`GET /loans/{id}/reminders`, `GET /reminders/{id}`,
> `POST /reminders/{id}/cancel`) sont définis dans `openapi.yaml` mais ne sont pas implémentés en V1 car
> les rappels sont 100% automatiques. Ils seront implémentés quand les rappels manuels seront ajoutés (V2+).

> **Buffer intégré** : L'estimation de 38-42 jours (vs 30 jours initiaux) inclut un buffer pour les blockers
> techniques (configuration FCM, problèmes Docker, courbe d'apprentissage NestJS/Prisma/BullMQ) et les imprévus.
> Sans OCR ni rappels manuels, le scope est plus réaliste pour 2 développeurs.

---

## Points de Synchronisation Frontend/Backend

| Moment             | Frontend peut brancher               | Backend disponible                                         |
| ------------------ | ------------------------------------ | ---------------------------------------------------------- |
| **Fin Sprint 1**   | Authentification + Profil            | `/auth/*` + `/users/me`                                    |
| **Fin Sprint 2**   | Gestion emprunteurs                  | `/borrowers/*`                                             |
| **Fin Sprint 3**   | Enregistrement objets + photos       | `/items/*`                                                 |
| **Fin Sprint 4**   | Création et suivi de prêts (prêteur) | `/loans/*`                                                 |
| **Fin Sprint 4.5** | Perspective emprunteur fonctionnelle | `Borrower.userId` lié + `GET /loans?role=borrower` correct |
| **Fin Sprint 4.6** | Système d'invitation de contacts     | `/contact-invitations/*` — 6 endpoints + consentement explicite |
| **Fin Sprint 5**   | Notifications push                   | `/notifications/*` + rappels auto                          |
| **Fin Sprint 6**   | Statistiques complètes               | `/history/*` + seed data                                   |

---

## Checklist de Fin de Sprint

A valider avant de passer au sprint suivant :

- [ ] Tous les tests unitaires passent (couverture respectée)
- [ ] Tous les tests d'intégration passent
- [ ] Migration de basé de données appliquée sans erreur
- [ ] Spec OpenAPI (`openapi.yaml`) mise à jour si endpoints modifies
- [ ] Code review approuve (1 approval)
- [ ] CI/CD passe sur `main`
- [ ] Changelog mis à jour (Conventional Commits)

---

**Co-validé par** : Esdras GBEDOZIN & Ismael AIHOU
**Date de dernière mise à jour** : 5 mars 2026
**Version** : 1.3 -- Ajout Sprint 4.6 (Contact Invitation System)
