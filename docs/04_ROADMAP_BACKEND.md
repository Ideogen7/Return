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

| ID            | Titre                                                     | Dépendance | Critère de Fin                              | Temps |
|---------------|-----------------------------------------------------------|------------|---------------------------------------------|-------|
| **SETUP-001** | Initialiser le repository NestJS                          | -          | `npm run start` fonctionne                  | 30min |
| **SETUP-002** | Configurer TypeScript strict + ESLint + Prettier          | SETUP-001  | `npm run lint` passe sans erreur            | 30min |
| **SETUP-003** | Installer Prisma + PostgreSQL + Redis (Docker Compose)    | SETUP-001  | `docker compose up` démarre PostgreSQL + Redis, `npx prisma db push` fonctionne | 1h30  |
| **SETUP-004** | Configurer Winston (logs JSON structurés)                 | SETUP-001  | Logs écrits en JSON avec requestId          | 1h    |
| **SETUP-005** | Implémenter RFC 7807 Exception Filter global              | SETUP-004  | Erreur 404 retourné format RFC 7807         | 1h30  |
| **SETUP-006** | Configurer JWT Module (access + refresh tokens)           | SETUP-001  | JWT signe et vérifié avec `@nestjs/jwt`     | 1h    |
| **SETUP-007** | Créer le Guard d'authentification (JwtAuthGuard)          | SETUP-006  | Route protégée retourné 401 si pas de token | 1h    |
| **SETUP-008** | Implémenter endpoints `/health` et `/ready`               | SETUP-001  | Fly.io liveness/readiness probes opérationnelles | 45min |
| **SETUP-009** | Configurer gestion des environnements (.env, ConfigModule)| SETUP-001  | ConfigModule NestJS charge les variables par env (dev/prod), secrets documentes | 1h |
| **SETUP-010** | Setup CI/CD GitHub Actions (lint + tests + Spectral lint openapi.yaml + Docker build) | SETUP-002  | Pipeline passe sur `main`                   | 1h30  |
| **SETUP-011** | Créer `Dockerfile` multi-stage (Node.js 22 LTS, builder + runner) + `.dockerignore` | SETUP-001  | `docker build -t return-api .` réussit      | 1h    |
| **SETUP-012** | Créer `docker-compose.yml` complet (backend + PostgreSQL 17 + Redis 8)               | SETUP-003  | `docker compose up` démarre le stack local  | 45min |

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
|--------------|----------------------------------------------------------------------------|------------|-----------------------------------------------|-------|
| **AUTH-001** | Créer le schema Prisma `User` (email, password, rôle, firstName, lastName) | SETUP-003  | Migration appliquée, table `users` créée      | 30min |
| **AUTH-002** | Créer le schema Prisma `RefreshToken` (token, userId, expiresAt)           | AUTH-001   | Migration appliquée, relation 1-N avec `User` | 30min |
| **AUTH-003** | Ajouter index sur `users.email` (unique) et `refreshTokens.token`          | AUTH-002   | `EXPLAIN` montre index utilisé                | 15min |

### Phase 1.2 : TDD -- Auth Service (Jours 2-4)

Chaque comportement suit le cyclé complet RED -> GREEN -> REFACTOR -> COMMIT avant de passer au suivant.

**Comportement 1 : Register**

| ID           | Titre                                                                | Dépendance | Critère de Fin                                     | Temps |
|--------------|----------------------------------------------------------------------|------------|----------------------------------------------------|-------|
| **AUTH-004** | RED : Test `POST /auth/register` (success 201)                      | AUTH-003   | Test écrit, échoue                                 | 30min |
| **AUTH-005** | GREEN : Implémenter `AuthService.register()` (hash bcrypt, créer user via Prisma) | AUTH-004 | Test AUTH-004 passe                       | 1h    |
| **AUTH-006** | RED : Test `POST /auth/register` (erreur 400 si email déjà utilisé) | AUTH-005   | Test écrit, échoue                                 | 20min |
| **AUTH-007** | GREEN : Ajouter vérification d'unicite email dans `register()`      | AUTH-006   | Tests AUTH-004 et AUTH-006 passent                 | 30min |

**Comportement 2 : Login**

| ID           | Titre                                                                     | Dépendance | Critère de Fin                              | Temps |
|--------------|---------------------------------------------------------------------------|------------|---------------------------------------------|-------|
| **AUTH-008** | RED : Test `POST /auth/login` (success 200 avec tokens)                   | AUTH-007   | Test écrit, échoue                          | 30min |
| **AUTH-009** | GREEN : Implémenter `AuthService.login()` (vérifiér credentials, générér JWT) | AUTH-008 | Test AUTH-008 passe                        | 1h30  |
| **AUTH-010** | RED : Test `POST /auth/login` (erreur 401 si mot de passe invalide)       | AUTH-009   | Test écrit, échoue                          | 20min |
| **AUTH-011** | GREEN : Ajouter gestion d'erreur credentials invalides                    | AUTH-010   | Tests AUTH-008 et AUTH-010 passent          | 30min |

**Comportement 3 : Refresh Token**

| ID           | Titre                                                                                  | Dépendance | Critère de Fin     | Temps |
|--------------|----------------------------------------------------------------------------------------|------------|--------------------|-------|
| **AUTH-012** | RED : Test `POST /auth/refresh` (success 200 avec nouveau access token)                | AUTH-011   | Test écrit, échoue | 30min |
| **AUTH-013** | GREEN : Implémenter `AuthService.refreshToken()` (vérifiér refresh, générér nouveau access) | AUTH-012 | Test AUTH-012 passe | 1h |

**Comportement 4 : Logout (via Redis blacklist)**

> **Note** : La révocation JWT via Redis blacklist est confirmée pour la V1 (voir ADR-004 dans 01_ARCHITECTURE_TECHNIQUE). Redis est configuré ici pour le JWT blacklist. Il sera reutilisé au Sprint 4 pour BullMQ.

| ID           | Titre                                                                              | Dépendance | Critère de Fin     | Temps |
|--------------|------------------------------------------------------------------------------------|------------|--------------------|-------|
| **AUTH-014** | Configurer Redis (connexion + module NestJS) pour JWT blacklist                    | AUTH-013   | Redis connecté     | 45min |
| **AUTH-015** | RED : Test `POST /auth/logout` (success 204, token blackliste)                     | AUTH-014   | Test écrit, échoue | 20min |
| **AUTH-016** | GREEN : Implémenter `AuthService.logout()` (ajouter token à la blacklist Redis)    | AUTH-015   | Test AUTH-015 passe | 45min |

### Phase 1.3 : Endpoints Auth (Jour 4)

| ID           | Titre                                                        | Dépendance | Critère de Fin                              | Temps |
|--------------|--------------------------------------------------------------|------------|---------------------------------------------|-------|
| **AUTH-017** | Créer `AuthController.register()` (POST /auth/register)      | AUTH-007   | Tests AUTH-004 et AUTH-006 passent en E2E   | 45min |
| **AUTH-018** | Créer `AuthController.login()` (POST /auth/login)            | AUTH-011   | Tests AUTH-008 et AUTH-010 passent en E2E   | 45min |
| **AUTH-019** | Créer `AuthController.refresh()` (POST /auth/refresh)        | AUTH-013   | Test AUTH-012 passe en E2E                  | 30min |
| **AUTH-020** | Créer `AuthController.logout()` (POST /auth/logout)          | AUTH-016   | Test AUTH-015 passe en E2E                  | 30min |

### Phase 1.4 : Module Users -- Profil (Jour 5)

Cyclé TDD par comportement pour chaque endpoint utilisateur.

| ID           | Titre                                                                                           | Dépendance | Critère de Fin          | Temps |
|--------------|-------------------------------------------------------------------------------------------------|------------|-------------------------|-------|
| **USER-001** | RED : Test `GET /users/me` (success 200 avec infos utilisateur)                                 | AUTH-020   | Test écrit, échoue      | 20min |
| **USER-002** | GREEN : Implémenter `UserService.getProfile()` + `UsersController.getMe()`                     | USER-001   | Test USER-001 passe     | 45min |
| **USER-003** | RED : Test `PATCH /users/me` (update firstName/lastName)                                        | USER-002   | Test écrit, échoue      | 20min |
| **USER-004** | GREEN : Implémenter `UserService.updateProfile()` + `UsersController.updateMe()`               | USER-003   | Test USER-003 passe     | 1h    |
| **USER-005** | RED : Test `PATCH /users/me/password` (change password)                                         | USER-004   | Test écrit, échoue      | 20min |
| **USER-006** | GREEN : Implémenter `UserService.changePassword()` + `UsersController.changePassword()`        | USER-005   | Test USER-005 passe     | 1h    |
| **USER-007** | RED : Test `DELETE /users/me` (success 204, suppression compte)                                 | USER-006   | Test écrit, échoue      | 20min |
| **USER-008** | RED : Test `DELETE /users/me` (erreur 409 si prêts actifs)                                      | USER-007   | Test écrit, échoue      | 15min |
| **USER-009** | GREEN : Implémenter `UserService.deleteAccount()` + `UsersController.deleteMe()` (RGPD)        | USER-008   | Tests USER-007/008 passent | 1h30 |

**Comportement 5 : Settings utilisateur**

| ID           | Titre                                                                                           | Dépendance | Critère de Fin          | Temps |
|--------------|-------------------------------------------------------------------------------------------------|------------|-------------------------|-------|
| **USER-010** | RED : Test `GET /users/me/settings` (success 200, retourne préférences notifications + langue)  | USER-009   | Test écrit, échoue      | 15min |
| **USER-011** | GREEN : Implémenter `UserService.getSettings()` + `UsersController.getSettings()`               | USER-010   | Test USER-010 passe     | 45min |
| **USER-012** | RED : Test `PATCH /users/me/settings` (update enableReminders, defaultLanguage)                  | USER-011   | Test écrit, échoue      | 15min |
| **USER-013** | GREEN : Implémenter `UserService.updateSettings()` + `UsersController.updateSettings()`         | USER-012   | Test USER-012 passe     | 45min |

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

| ID           | Titre                                                                                  | Dépendance | Critère de Fin      | Temps |
|--------------|----------------------------------------------------------------------------------------|------------|---------------------|-------|
| **BORR-001** | Créer le schema Prisma `Borrower` (firstName, lastName, email, phoneNumber, userId FK, lenderUserId FK) | AUTH-001   | Migration appliquée | 30min |
| **BORR-002** | Ajouter index unique sur le couple `(lenderUserId, email)` et index sur `borrowers.lenderUserId` | BORR-001   | Index créés         | 15min |

> **Note** : L'unicité est sur le couple `(lenderUserId, email)` — un même email peut exister comme emprunteur chez
> plusieurs prêteurs différents. `lenderUserId` identifie le prêteur propriétaire du contact.
> `userId` (nullable) est la FK vers le compte Return de l'emprunteur (null si pas encore inscrit).

### Phase 2.2 : TDD -- Borrower Service

Cycle TDD par comportement (RED → GREEN → REFACTOR → COMMIT).

**Comportement 1 : Création**

| ID           | Titre                                                                       | Dépendance | Critère de Fin              | Temps |
|--------------|-----------------------------------------------------------------------------|------------|-----------------------------|-------|
| **BORR-003** | RED : Test `POST /borrowers` (success 201 avec header Location)             | BORR-002   | Test écrit, échoue          | 20min |
| **BORR-004** | RED : Test `POST /borrowers` (erreur 409 si email existe déjà pour ce prêteur) | BORR-003 | Test écrit, échoue          | 15min |
| **BORR-005** | GREEN : Implémenter `BorrowerService.create()` (vérification unicité `(lenderUserId, email)` via Prisma, retour Borrower avec statistics par défaut) | BORR-004 | Tests BORR-003 et BORR-004 passent | 1h |

**Comportement 2 : Lecture (avec ownership)**

| ID           | Titre                                                                            | Dépendance | Critère de Fin         | Temps |
|--------------|----------------------------------------------------------------------------------|------------|------------------------|-------|
| **BORR-006** | RED : Test `GET /borrowers` (liste paginée, triée, filtrée par lenderUserId)     | BORR-005   | Test écrit, échoue     | 20min |
| **BORR-007** | GREEN : Implémenter `BorrowerService.findAll()` (pagination + tri via Prisma, filtre lenderUserId) | BORR-006 | Test BORR-006 passe | 45min |
| **BORR-008** | RED : Test `GET /borrowers/{id}` (success 200 + 403 si pas propriétaire)         | BORR-007   | Test écrit, échoue     | 20min |
| **BORR-009** | GREEN : Implémenter `BorrowerService.findById()` (ownership check = 403, not found = 404) | BORR-008 | Test BORR-008 passe | 30min |

**Comportement 3 : Modification et suppression (avec ownership)**

| ID           | Titre                                                                            | Dépendance | Critère de Fin               | Temps |
|--------------|----------------------------------------------------------------------------------|------------|------------------------------|-------|
| **BORR-010** | RED : Test `PATCH /borrowers/{id}` (update success + 403 si pas propriétaire)    | BORR-009   | Test écrit, échoue           | 20min |
| **BORR-011** | GREEN : Implémenter `BorrowerService.update()` (ownership check + update via Prisma + 409 si email dupliqué) | BORR-010 | Test BORR-010 passe | 45min |
| **BORR-012** | RED : Test `DELETE /borrowers/{id}` (success 204 + 403 si pas propriétaire)      | BORR-011   | Test écrit, échoue           | 15min |
| **BORR-013** | RED : Test `DELETE /borrowers/{id}` (erreur 409 `active-loans-exist` si prêts actifs) | BORR-012 | Test écrit, échoue         | 15min |
| **BORR-014** | GREEN : Implémenter `BorrowerService.delete()` (ownership check + vérifier absence de prêts actifs via Prisma) | BORR-013 | Tests BORR-012 et BORR-013 passent | 1h |

### Phase 2.3 : Endpoints API

| ID           | Titre                                          | Dépendance | Critère de Fin                               | Temps |
|--------------|-------------------------------------------------|------------|----------------------------------------------|-------|
| **BORR-015** | Créer `BorrowersController` (5 endpoints CRUD avec header Location sur POST, @UseGuards JwtAuthGuard) | BORR-014   | Tous les tests BORR-003 à BORR-014 passent   | 1h30  |

🏁 **Livrable Sprint 2** : **Frontend peut gérer les emprunteurs** (5 endpoints Borrowers CRUD avec ownership, pagination, tri).

> **Note** : `GET /borrowers/{id}/statistics` (trustScore) est implémenté au Sprint 6 (HIST-006/007/010) car il nécessite les données de prêts (module Loans, Sprint 4). `GET /borrowers/{id}/loans` est également reporté au Sprint 6. En Sprint 2, le champ `statistics` de la réponse Borrower retourne un objet BorrowerStatistics avec des zéros par défaut.

---

## Sprint 3 : Module Items (4 jours)

### Objectif

Gerer les objets pretables + Upload photos vers Cloudflare R2. **Pas d'OCR en V1** -- la reconnaissance automatique
d'objets via Google Cloud Vision est reportee à la V2+ (hors scope MVP).

### Phase 3.1 : Base de Données + Setup R2

| ID           | Titre                                                                                  | Dépendance | Critère de Fin               | Temps |
|--------------|----------------------------------------------------------------------------------------|------------|------------------------------|-------|
| **ITEM-001** | Créer le schema Prisma `Item` (name, description, category, estimatedValue, userId FK) | AUTH-001   | Migration appliquée          | 30min |
| **ITEM-002** | Créer le schema Prisma `Photo` (url, thumbnailUrl, itemId FK)                          | ITEM-001   | Relation 1-N avec `Item`     | 30min |
| **ITEM-003** | Ajouter index sur `items.userId` et `items.category`                                   | ITEM-002   | Index créés                  | 15min |
| **ITEM-004** | Configurer Cloudflare R2 SDK (stockage photos)                                         | SETUP-001  | Upload de test fonctionne    | 1h    |

> **Note** : R2 est configuré ici (just-in-time) plutot qu'au Sprint 0, car c'est le premier sprint qui en a besoin.

### Phase 3.2 : TDD -- Item Service

Cyclé TDD par comportement.

**Comportement 1 : Création d'item**

| ID           | Titre                                                                         | Dépendance | Critère de Fin                          | Temps |
|--------------|-------------------------------------------------------------------------------|------------|-----------------------------------------|-------|
| **ITEM-005** | RED : Test `POST /items` (création manuelle success 201)                      | ITEM-003   | Test écrit, échoue                      | 20min |
| **ITEM-006** | RED : Test `POST /items` (erreur 400 si category=MONEY sans estimatedValue)   | ITEM-005   | Test écrit, échoue                      | 15min |
| **ITEM-007** | GREEN : Implémenter `ItemService.create()` (validation category+value via Prisma) | ITEM-006 | Tests ITEM-005 et ITEM-006 passent     | 1h    |

**Comportement 2 : Liste et consultation**

| ID           | Titre                                                                           | Dépendance | Critère de Fin       | Temps |
|--------------|---------------------------------------------------------------------------------|------------|----------------------|-------|
| **ITEM-008** | RED : Test `GET /items` (liste paginée avec filtres category/available)          | ITEM-007   | Test écrit, échoue   | 25min |
| **ITEM-009** | GREEN : Implémenter `ItemService.findAll()` (filtres + pagination via Prisma)   | ITEM-008   | Test ITEM-008 passe  | 1h    |
| **ITEM-009b** | RED : Test `GET /items/{id}` (success 200 avec photos)                         | ITEM-009   | Test écrit, échoue   | 15min |
| **ITEM-009c** | GREEN : Implémenter `ItemService.findById()` (avec relations photos via Prisma) | ITEM-009b | Test ITEM-009b passe | 30min |
| **ITEM-009d** | RED : Test `PATCH /items/{id}` (update name/description/category)              | ITEM-009c  | Test écrit, échoue   | 15min |
| **ITEM-009e** | GREEN : Implémenter `ItemService.update()` (via Prisma)                        | ITEM-009d  | Test ITEM-009d passe | 30min |

**Comportement 3 : Upload photos**

| ID           | Titre                                                                          | Dépendance | Critère de Fin       | Temps |
|--------------|--------------------------------------------------------------------------------|------------|----------------------|-------|
| **ITEM-010** | RED : Test `POST /items/{id}/photos` (upload success 201)                      | ITEM-009   | Test écrit, échoue   | 25min |
| **ITEM-011** | GREEN : Implémenter `PhotoStorageService` (interface + R2 implémentation)      | ITEM-004   | Upload/delete fonctionnel sur R2 | 2h |
| **ITEM-012** | GREEN : Implémenter `ItemService.addPhotos()` (max 5 photos, upload R2)       | ITEM-011   | Test ITEM-010 passe  | 1h30  |

**Comportement 4 : Suppression**

| ID           | Titre                                                                           | Dépendance | Critère de Fin       | Temps |
|--------------|---------------------------------------------------------------------------------|------------|----------------------|-------|
| **ITEM-013** | RED : Test `DELETE /items/{id}` (erreur 409 si prêt en cours)                   | ITEM-012   | Test écrit, échoue   | 15min |
| **ITEM-014** | GREEN : Implémenter `ItemService.delete()` (vérifiér absence de prêt actif via Prisma) | ITEM-013 | Test ITEM-013 passe | 1h |

### Phase 3.3 : Endpoints API

| ID           | Titre                                        | Dépendance | Critère de Fin                               | Temps |
|--------------|----------------------------------------------|------------|----------------------------------------------|-------|
| **ITEM-015** | Créer `ItemsController` (6 endpoints CRUD + photos) | ITEM-014   | Tous les tests ITEM-005 à ITEM-014 passent   | 2h    |

### Phase 3.4 : Avatar Utilisateur (après R2)

> **Note** : `PUT /users/me/avatar` est implémenté dans ce sprint car il dépend de `PhotoStorageService` (ITEM-011, interface R2). Le code réutilise la même interface de stockage que les photos d'items.

| ID           | Titre                                                                              | Dépendance | Critère de Fin          | Temps |
|--------------|------------------------------------------------------------------------------------|------------|-------------------------|-------|
| **USER-014** | RED : Test `PUT /users/me/avatar` (upload success 200, retourne URL)               | ITEM-011   | Test écrit, échoue      | 20min |
| **USER-015** | GREEN : Implémenter `UserService.updateAvatar()` (upload R2 via PhotoStorage)      | USER-014   | Test USER-014 passe     | 1h    |
| **USER-016** | Ajouter `UsersController.updateAvatar()` (PUT /users/me/avatar)                    | USER-015   | Test E2E passe          | 30min |

🏁 **Livrable Sprint 3** : **Frontend peut gérer les objets avec photos** (6 endpoints Items + 1 endpoint Users: avatar).

---

## Sprint 4 : Module Loans (Coeur Métier) (8 jours)

### Objectif

Gestion complète du cyclé de vie des prêts (8 statuts, workflow de confirmation, clôture).

### Phase 4.0 : Setup BullMQ

| ID           | Titre                                                                    | Dépendance | Critère de Fin                           | Temps |
|--------------|--------------------------------------------------------------------------|------------|------------------------------------------|-------|
| **LOAN-001** | Configurer BullMQ (file de jobs asynchrones sur Redis existant)          | AUTH-014   | Redis connecte, queue créée, job de test exécuté | 1h |

> **Note** : Redis est déjà installe depuis le Sprint 1 (AUTH-014) pour le JWT blacklist. Ici on ajouté BullMQ pour les
> jobs asynchrones (CRON timeout 48h, futur scheduling de rappels).

### Phase 4.1 : Base de Données

| ID           | Titre                                                                                                                                 | Dépendance                   | Critère de Fin                | Temps |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------|------------------------------|-------------------------------|-------|
| **LOAN-002** | Créer le schema Prisma `Loan` (itemId FK, lenderId FK, borrowerId FK, status enum, returnDate, confirmationDate, returnedDate, notes) | ITEM-001, AUTH-001, BORR-001 | Migration appliquée           | 1h    |
| **LOAN-003** | Ajouter index compose `loans(userId, status)` pour filtrage rapide                                                                    | LOAN-002                     | Index créé                    | 15min |
| **LOAN-004** | Ajouter contrainte CHECK `returnDate > createdAt`                                                                                     | LOAN-002                     | Contrainte PostgreSQL ajoutée | 20min |

### Phase 4.2 : TDD -- Création de pret

Cyclé TDD par comportement.

**Comportement 1 : Créer un pret**

| ID           | Titre                                                                                        | Dépendance | Critère de Fin                          | Temps |
|--------------|----------------------------------------------------------------------------------------------|------------|-----------------------------------------|-------|
| **LOAN-005** | RED : Test `POST /loans` (success 201, status=PENDING_CONFIRMATION)                          | LOAN-004   | Test écrit, échoue                      | 30min |
| **LOAN-006** | RED : Test `POST /loans` (erreur 400 si returnDate < today)                                  | LOAN-005   | Test écrit, échoue                      | 15min |
| **LOAN-007** | GREEN : Implémenter `LoanFactory.toCreateInput()` (validation business rules)                | LOAN-004   | Pattern Factory appliqué                | 1h30  |
| **LOAN-008** | GREEN : Implémenter `LoanService.create()` (appel Factory + EventBus LOAN_CREATED via Prisma) | LOAN-007  | Tests LOAN-005 et LOAN-006 passent      | 2h    |

> **Note** : Le frontend créé l'item et le borrower d'abord via les endpoints dédiés (Sprint 2-3), puis passe les UUIDs
> au `POST /loans`. Un endpoint = une responsabilite (SRP).

**Comportement 2 : Lister et consulter**

| ID           | Titre                                                                            | Dépendance | Critère de Fin         | Temps |
|--------------|----------------------------------------------------------------------------------|------------|------------------------|-------|
| **LOAN-009** | RED : Test `GET /loans` (liste paginée avec filtres status/borrowerId)            | LOAN-008   | Test écrit, échoue     | 25min |
| **LOAN-010** | GREEN : Implémenter `LoanService.findAll()` (filtres + pagination via Prisma)    | LOAN-009   | Test LOAN-009 passe    | 1h    |
| **LOAN-011** | RED : Test `GET /loans/{id}` (success 200 avec relations item+borrower)           | LOAN-010   | Test écrit, échoue     | 20min |
| **LOAN-012** | GREEN : Implémenter `LoanService.findById()` (avec relations via Prisma)         | LOAN-011   | Test LOAN-011 passe    | 45min |

### Phase 4.3 : TDD -- Workflow de Statut

**Comportement 3 : Confirmation / Contestation**

| ID           | Titre                                                                                     | Dépendance | Critère de Fin          | Temps |
|--------------|-------------------------------------------------------------------------------------------|------------|-------------------------|-------|
| **LOAN-013** | RED : Test `POST /loans/{id}/confirm` (PENDING_CONFIRMATION -> ACTIVE)                    | LOAN-012   | Test écrit, échoue      | 20min |
| **LOAN-014** | RED : Test `POST /loans/{id}/contest` (PENDING_CONFIRMATION -> DISPUTED)                  | LOAN-013   | Test écrit, échoue      | 20min |
| **LOAN-015** | GREEN : Implémenter `LoanStatusMachine` (validateur de transitions)                       | LOAN-004   | Machine à états créée   | 2h    |
| **LOAN-016** | GREEN : Implémenter `LoanService.confirm()` et `LoanService.contest()`                   | LOAN-015   | Tests LOAN-013 et LOAN-014 passent | 1h30 |

**Comportement 4 : Transitions de statut**

| ID           | Titre                                                                                         | Dépendance | Critère de Fin          | Temps |
|--------------|-----------------------------------------------------------------------------------------------|------------|-------------------------|-------|
| **LOAN-017** | RED : Test ACTIVE -> AWAITING_RETURN si returnDate dépassée                                   | LOAN-016   | Test écrit, échoue      | 20min |
| **LOAN-018** | RED : Test AWAITING_RETURN -> RETURNED                                                        | LOAN-017   | Test écrit, échoue      | 20min |
| **LOAN-019** | RED : Test AWAITING_RETURN -> NOT_RETURNED après 5 rappels (via AllRemindersExhaustedEvent)    | LOAN-018   | Test écrit, échoue      | 25min |
| **LOAN-020** | RED : Test transition invalidé retourné 400 (ex: DISPUTED -> ACTIVE)                          | LOAN-019   | Test écrit, échoue      | 20min |
| **LOAN-021** | GREEN : Implémenter `LoanService.updateStatus()` (validation via StatusMachine)               | LOAN-020   | Tests LOAN-017 à LOAN-020 passent | 2h |

> **Note sur LOAN-019** : La transition AWAITING_RETURN -> NOT_RETURNED est déclenchée par un événement
> `AllRemindersExhaustedEvent` emis par le module Reminder (Sprint 5). Le module Loan écoute cet événement via
> `@OnEvent` -- il ne connait pas le nombre de rappels (découplage inter-modules). Le test mocke cet événement.

**Comportement 5 : Timeout 48h auto-confirmation**

| ID           | Titre                                                                                         | Dépendance        | Critère de Fin     | Temps |
|--------------|-----------------------------------------------------------------------------------------------|-------------------|--------------------|-------|
| **LOAN-022** | RED : Test timeout auto 48h (PENDING_CONFIRMATION -> ACTIVE_BY_DEFAULT via CRON)              | LOAN-021          | Test écrit, échoue | 30min |
| **LOAN-023** | GREEN : Implémenter CRON Job timeout 48h (PENDING -> ACTIVE_BY_DEFAULT via BullMQ)            | LOAN-022, LOAN-001 | Test LOAN-022 passe | 2h   |

**Comportement 6 : Modification et suppression de prêt**

| ID           | Titre                                                                                         | Dépendance        | Critère de Fin            | Temps |
|--------------|-----------------------------------------------------------------------------------------------|--------------------|---------------------------|-------|
| **LOAN-030** | RED : Test `PATCH /loans/{id}` (update notes/returnDate success 200)                          | LOAN-012           | Test écrit, échoue        | 20min |
| **LOAN-031** | GREEN : Implémenter `LoanService.update()` (via Prisma)                                       | LOAN-030           | Test LOAN-030 passe       | 45min |
| **LOAN-032** | RED : Test `DELETE /loans/{id}` (soft delete success 204, erreur 409 si déjà rendu)           | LOAN-031           | Test écrit, échoue        | 25min |
| **LOAN-033** | GREEN : Implémenter `LoanService.delete()` (soft delete + annulation rappels via EventBus)    | LOAN-032           | Test LOAN-032 passe       | 1h    |

### Phase 4.4 : Endpoints API

| ID           | Titre                                                             | Dépendance | Critère de Fin                          | Temps |
|--------------|-------------------------------------------------------------------|------------|-----------------------------------------|-------|
| **LOAN-024** | Créer `LoansController.create()` (POST /loans)                    | LOAN-008   | Tests LOAN-005 et LOAN-006 passent      | 1h    |
| **LOAN-025** | Créer `LoansController.findAll()` (GET /loans)                    | LOAN-010   | Test LOAN-009 passe                     | 45min |
| **LOAN-026** | Créer `LoansController.findOne()` (GET /loans/{id})               | LOAN-012   | Test LOAN-011 passe                     | 30min |
| **LOAN-027** | Créer `LoansController.confirm()` (POST /loans/{id}/confirm)      | LOAN-016   | Test LOAN-013 passe                     | 30min |
| **LOAN-028** | Créer `LoansController.contest()` (POST /loans/{id}/contest)      | LOAN-016   | Test LOAN-014 passe                     | 30min |
| **LOAN-029** | Créer `LoansController.updateStatus()` (PATCH /loans/{id}/status) | LOAN-021   | Tests LOAN-017 à LOAN-020 passent       | 1h    |
| **LOAN-034** | Créer `LoansController.update()` (PATCH /loans/{id})              | LOAN-031   | Test LOAN-030 passe                     | 30min |
| **LOAN-035** | Créer `LoansController.delete()` (DELETE /loans/{id})             | LOAN-033   | Test LOAN-032 passe                     | 30min |

🏁 **Livrable Sprint 4** : **Frontend peut créer et suivre des prêts (workflow complet)** (8 endpoints Loans).

---

## Sprint 5 : Module Reminders + Notifications (5 jours)

### Objectif

Système de rappels 100% automatiques + Notifications push. **Pas de rappels manuels** -- les rappels sont
exclusivement geres par le système selon la politique fixe.

### Phase 5.0 : Setup FCM

| ID          | Titre                                                                                      | Dépendance | Critère de Fin                              | Temps |
|-------------|--------------------------------------------------------------------------------------------|------------|---------------------------------------------|-------|
| **REM-001** | Configurer Firebasé SDK (projet Firebase, service account, google-services.json, test push) | SETUP-001  | Notification push de test reçue sur device   | 2h    |

### Phase 5.1 : Base de Données

| ID          | Titre                                                                                                              | Dépendance | Critère de Fin      | Temps |
|-------------|--------------------------------------------------------------------------------------------------------------------|------------|---------------------|-------|
| **REM-002** | Créer le schema Prisma `Reminder` (loanId FK, type enum, status enum, scheduledFor, sentAt, message, channel enum) | LOAN-002   | Migration appliquée | 45min |
| **REM-003** | Créer le schema Prisma `Notification` (userId FK, type enum, title, body, isRead, relatedLoanId FK)                | AUTH-001   | Migration appliquée | 30min |
| **REM-004** | Ajouter index sur `reminders(loanId, status)` et `notifications(userId, isRead)`                                   | REM-003    | Index créés         | 15min |

### Phase 5.2 : TDD -- Reminder Service

Cyclé TDD par comportement.

**Comportement 1 : Planification automatique des rappels**

| ID          | Titre                                                                                                                | Dépendance        | Critère de Fin                     | Temps |
|-------------|----------------------------------------------------------------------------------------------------------------------|-------------------|------------------------------------|-------|
| **REM-005** | RED : Test création automatique de 5 rappels (PREVENTIVE J-3, ON_DUE_DATE J, FIRST_OVERDUE J+7, SECOND_OVERDUE J+14, FINAL_OVERDUE J+21) quand prêt créé | REM-004 | Test écrit, échoue | 30min |
| **REM-006** | GREEN : Implémenter `ReminderPolicy.calculateDates()` (politique fixe : J-3, J, J+7, J+14, J+21) | REM-005 | Politique de calcul fonctionnelle | 1h |
| **REM-007** | GREEN : Implémenter `ReminderService.scheduleReminders()` (création automatique via Prisma + BullMQ) | REM-006 | Test REM-005 passe | 2h |
| **REM-008** | GREEN : Écouter événement `LOAN_CREATED` (EventBus) pour déclenchér `scheduleReminders()` | REM-007, LOAN-008 | Pattern Observer appliqué | 1h |

**Comportement 2 : Envoi automatique des rappels**

| ID          | Titre                                                                                      | Dépendance | Critère de Fin       | Temps |
|-------------|--------------------------------------------------------------------------------------------|------------|----------------------|-------|
| **REM-009** | RED : Test envoi automatique de rappel via CRON (status SCHEDULED -> SENT)                 | REM-008    | Test écrit, échoue   | 30min |
| **REM-010** | GREEN : Implémenter CRON Job `sendScheduledReminders()` (BullMQ chaque heure)              | REM-009    | Test REM-009 passe   | 2h    |
| **REM-011** | GREEN : Implémenter `NotificationService.send()` (push FCM + création en DB via Prisma)    | REM-001    | Notification créée en DB + push envoye | 2h |

**Comportement 3 : Epuisement des rappels et abandon**

| ID          | Titre                                                                                      | Dépendance | Critère de Fin       | Temps |
|-------------|--------------------------------------------------------------------------------------------|------------|----------------------|-------|
| **REM-012** | RED : Test emission `AllRemindersExhaustedEvent` après le 5e rappel envoye (FINAL_OVERDUE) | REM-010    | Test écrit, échoue   | 25min |
| **REM-013** | GREEN : Implémenter emission `AllRemindersExhaustedEvent` dans le CRON d'envoi             | REM-012    | Test REM-012 passe   | 1h    |

> **Note** : L'événement `AllRemindersExhaustedEvent` est emis par le module Reminder après l'envoi du 5e rappel
> (FINAL_OVERDUE). Le module Loan écoute cet événement (via `@OnEvent`) pour passer le prêt en statut NOT_RETURNED.
> Le module Reminder ne connait pas les statuts de prêt -- découplage strict.

**Comportement 4 : Consultation des notifications**

| ID          | Titre                                                                        | Dépendance | Critère de Fin       | Temps |
|-------------|------------------------------------------------------------------------------|------------|----------------------|-------|
| **REM-014** | RED : Test `GET /notifications` (liste paginée avec filtre unreadOnly)       | REM-011    | Test écrit, échoue   | 20min |
| **REM-015** | GREEN : Implémenter `NotificationService.findAll()` (pagination via Prisma)  | REM-014    | Test REM-014 passe   | 1h    |
| **REM-016** | RED : Test `PATCH /notifications/{id}/read` (marquer comme lu success 200)   | REM-015    | Test écrit, échoue   | 15min |
| **REM-017** | GREEN : Implémenter `NotificationService.markAsRead()` (via Prisma)          | REM-016    | Test REM-016 passe   | 30min |
| **REM-020** | RED : Test `POST /notifications/read-all` (marquer toutes comme lues 204)    | REM-017    | Test écrit, échoue   | 15min |
| **REM-021** | GREEN : Implémenter `NotificationService.markAllAsRead()` (via Prisma)       | REM-020    | Test REM-020 passe   | 30min |

### Phase 5.3 : Endpoints API

| ID          | Titre                                                                         | Dépendance | Critère de Fin          | Temps |
|-------------|-------------------------------------------------------------------------------|------------|-------------------------|-------|
| **REM-018** | Créer `NotificationsController.findAll()` (GET /notifications)                | REM-015    | Test REM-014 passe      | 45min |
| **REM-019** | Créer `NotificationsController.markAsRead()` (PATCH /notifications/{id}/read) | REM-017    | Test REM-016 passe      | 30min |
| **REM-022** | Créer `NotificationsController.markAllAsRead()` (POST /notifications/read-all) | REM-021   | Test REM-020 passe      | 30min |

🏁 **Livrable Sprint 5** : **Frontend reçoit des notifications push automatiques** (3 endpoints Notifications + système de rappels automatique en arrière-plan).

---

## Sprint 6 : Module History + Finalisation (4 jours)

### Objectif

Statistiques + Historique archivé + Tests E2E complets + Seed de données pour le frontend.

### Phase 6.1 : Base de Données

| ID           | Titre                                                                      | Dépendance | Critère de Fin | Temps |
|--------------|----------------------------------------------------------------------------|------------|----------------|-------|
| **HIST-001** | Ajouter index compose `loans(userId, status, returnedDate)` pour analytics | LOAN-002   | Index créé     | 15min |

### Phase 6.2 : TDD -- History Service

Cyclé TDD par comportement.

**Comportement 1 : Historique des prêts**

| ID           | Titre                                                                                     | Dépendance | Critère de Fin         | Temps |
|--------------|-------------------------------------------------------------------------------------------|------------|------------------------|-------|
| **HIST-002** | RED : Test `GET /history/loans` (filtre status RETURNED/NOT_RETURNED/ABANDONED)            | HIST-001   | Test écrit, échoue     | 20min |
| **HIST-003** | GREEN : Implémenter `HistoryService.getArchivedLoans()` (filtres date + status via Prisma) | HIST-002  | Test HIST-002 passe    | 1h30  |

**Comportement 2 : Statistiques**

| ID           | Titre                                                                                     | Dépendance | Critère de Fin         | Temps |
|--------------|-------------------------------------------------------------------------------------------|------------|------------------------|-------|
| **HIST-004** | RED : Test `GET /history/statistics` (overview + byCategory + topBorrowers + mostLoanedItems) | HIST-003 | Test écrit, échoue    | 30min |
| **HIST-005** | GREEN : Implémenter `HistoryService.getStatistics()` (agregations Prisma)                 | HIST-004   | Test HIST-004 passe    | 2h    |

**Comportement 3 : Trust Score emprunteur**

> **Definition du trustScore** : Ratio simple `(prêts retournés / total de prêts terminés) * 100` exprime en
> pourcentage. Un emprunteur sans prêt terminé à un score de `null` (non calculable). Pas d'algorithme
> complexe en V1 -- on pourra ponderer par anciennete ou délai en V2+.

| ID           | Titre                                                                              | Dépendance | Critère de Fin         | Temps |
|--------------|------------------------------------------------------------------------------------|------------|------------------------|-------|
| **HIST-006** | RED : Test `GET /borrowers/{id}/statistics` (trustScore = returned/total * 100)    | BORR-002   | Test écrit, échoue     | 25min |
| **HIST-007** | GREEN : Implémenter `BorrowerService.getStatistics()` (calcul trustScore via Prisma) | HIST-006 | Test HIST-006 passe    | 1h30  |

### Phase 6.3 : Endpoints API

| ID           | Titre                                                                                   | Dépendance | Critère de Fin         | Temps |
|--------------|-----------------------------------------------------------------------------------------|------------|------------------------|-------|
| **HIST-008** | Créer `HistoryController.getLoans()` (GET /history/loans)                               | HIST-003   | Test HIST-002 passe    | 45min |
| **HIST-009** | Créer `HistoryController.getStatistics()` (GET /history/statistics)                     | HIST-005   | Test HIST-004 passe    | 45min |
| **HIST-010** | Ajouter endpoint `BorrowersController.getStatistics()` (GET /borrowers/{id}/statistics) | HIST-007   | Test HIST-006 passe    | 30min |

**Comportement 4 : Historique de prêts par emprunteur**

| ID           | Titre                                                                                   | Dépendance | Critère de Fin         | Temps |
|--------------|-----------------------------------------------------------------------------------------|------------|------------------------|-------|
| **HIST-011** | RED : Test `GET /borrowers/{id}/loans` (liste des prêts filtrée par statut)             | LOAN-010   | Test écrit, échoue     | 20min |
| **HIST-012** | GREEN : Implémenter `BorrowerService.getLoans()` (filtre status via Prisma)             | HIST-011   | Test HIST-011 passe    | 1h    |
| **HIST-013** | Ajouter endpoint `BorrowersController.getLoans()` (GET /borrowers/{id}/loans)           | HIST-012   | Test HIST-011 passe    | 30min |

### Phase 6.4 : Tests E2E + Finalisation

| ID          | Titre                                                                                         | Dépendance | Critère de Fin                              | Temps |
|-------------|-----------------------------------------------------------------------------------------------|------------|---------------------------------------------|-------|
| **E2E-001** | Écrire test E2E : Flow complet (register -> create loan -> confirm -> reminder -> return)      | HIST-010   | Test E2E passe                              | 2h    |
| **E2E-002** | Verifier couverture de code (Domain 95%, Services 90%, Controllers 70%)                        | E2E-001    | Seuils respectes                            | 1h    |
| **E2E-003** | Configurer Swagger UI (documentation interactive accessible sur /api/docs)                      | HIST-010   | Swagger UI affiché tous les endpoints       | 1h    |
| **E2E-004** | Créer script de seeding (données réalistes pour le frontend)                                   | HIST-010   | Script executable, données de dev disponibles | 1h30 |

> **E2E-003 (Swagger UI)** : La spec OpenAPI est rédigée manuellement (`openapi.yaml`). Swagger UI est configuré pour
> servir cette spec -- pas de generation automatique depuis les decorateurs NestJS.

> **E2E-004 (Seeding)** : Script Prisma seed avec des prêteurs, emprunteurs, objets et prêts dans différents statuts.
> Indispensable pour le développement frontend en parallèle.

### Phase 6.5 : Containerisation & Déploiement Production

| ID            | Titre                                                                                         | Dépendance | Critère de Fin                              | Temps |
|---------------|-----------------------------------------------------------------------------------------------|------------|---------------------------------------------|-------|
| **DEPLOY-001** | Vérifier et optimiser le `Dockerfile` (taille image < 200 MB, health checks intégrés)        | SETUP-011  | Image optimisée, `docker run` fonctionne    | 1h    |
| **DEPLOY-002** | Créer `fly.toml` (app name, region `cdg`, release_command: `prisma migrate deploy`, checks)   | DEPLOY-001 | `fly deploy --dry-run` passe                | 1h    |
| **DEPLOY-003** | Provisionner PostgreSQL managed + Redis (Upstash) sur Fly.io                                 | DEPLOY-002 | `fly postgres create` + Upstash configuré   | 1h    |
| **DEPLOY-004** | Premier `fly deploy` + vérification health checks + smoke tests production                    | DEPLOY-003 | `GET /health` et `GET /ready` retournent 200 | 1h30  |
| **DEPLOY-005** | Configurer DNS (`api.return.app`) + certificat SSL (Let's Encrypt via Fly.io)                 | DEPLOY-004 | `curl https://api.return.app/v1/health` retourne 200 | 30min |

> **Note DEPLOY-002** : Le `fly.toml` utilise `release_command = "npx prisma migrate deploy"` pour appliquer les
> migrations automatiquement avant de router le trafic vers la nouvelle version. Cette stratégie est décrite dans
> la section 7 de `01_ARCHITECTURE_TECHNIQUE.md`.

🏁 **Livrable Sprint 6** : **Backend complet déployé en production avec tests E2E, couverture respectée, Swagger UI, données de seed et infrastructure Fly.io opérationnelle.**

---

## Résumé des Sprints

| Sprint       | Durée           | Modules                   | Endpoints livres                          | Tests              |
|--------------|-----------------|---------------------------|-------------------------------------------|--------------------|
| **Sprint 0** | 3-4 jours       | Setup infrastructuré      | 2 (health + ready) + Docker               | CI/CD              |
| **Sprint 1** | 5 jours         | Auth + Users              | 10 (Auth: 4, Users: 6)                    | ~20 tests          |
| **Sprint 2** | 4 jours         | Borrowers                 | 5                                          | ~8 tests           |
| **Sprint 3** | 4 jours         | Items + Avatar            | 7 (Items: 6, Avatar: 1)                   | ~10 tests          |
| **Sprint 4** | 8 jours         | Loans (coeur métier)      | 8                                          | ~16 tests          |
| **Sprint 5** | 5 jours         | Reminders + Notifications | 3 + système auto                           | ~12 tests          |
| **Sprint 6** | 4 jours         | History + Déploiement     | 5 (History: 2, Borrower stats/loans: 2, E2E) | E2E complet     |
| **TOTAL**    | **38-42 jours** | **7 modules**             | **~40 endpoints** (+ 3 réservés V2)        | **~66+ tests**     |

> **Endpoints réservés V2** : 3 endpoints Reminders (`GET /loans/{id}/reminders`, `GET /reminders/{id}`,
> `POST /reminders/{id}/cancel`) sont définis dans `openapi.yaml` mais ne sont pas implémentés en V1 car
> les rappels sont 100% automatiques. Ils seront implémentés quand les rappels manuels seront ajoutés (V2+).

> **Buffer intégré** : L'estimation de 38-42 jours (vs 30 jours initiaux) inclut un buffer pour les blockers
> techniques (configuration FCM, problèmes Docker, courbe d'apprentissage NestJS/Prisma/BullMQ) et les imprévus.
> Sans OCR ni rappels manuels, le scope est plus réaliste pour 2 développeurs.

---

## Points de Synchronisation Frontend/Backend

| Moment           | Frontend peut brancher       | Backend disponible                  |
|------------------|------------------------------|-------------------------------------|
| **Fin Sprint 1** | Authentification + Profil    | `/auth/*` + `/users/me`             |
| **Fin Sprint 2** | Gestion emprunteurs          | `/borrowers/*`                      |
| **Fin Sprint 3** | Enregistrement objets + photos | `/items/*`                        |
| **Fin Sprint 4** | Création et suivi de prêts   | `/loans/*`                          |
| **Fin Sprint 5** | Notifications push           | `/notifications/*` + rappels auto   |
| **Fin Sprint 6** | Statistiques complètes       | `/history/*` + seed data            |

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
**Date de dernière mise à jour** : 12 février 2026
**Version** : 1.1 -- MVP Baseline (post contre-expertise)
