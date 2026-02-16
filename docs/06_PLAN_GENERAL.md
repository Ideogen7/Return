# 06_PLAN_GENERAL.md

**Return ↺ — Plan Général de Développement (Master Plan)**

**Version** : 1.1 — MVP Baseline (post contre-expertise)
**Co-validé par** : Esdras GBEDOZIN & Ismael AIHOU
**Date** : 12 février 2026

---

## Vision d'Ensemble

**Équipe** : 2 Développeurs (Full-Stack)
**Stratégie** : **Développement parallèle Backend/Frontend avec synchronisations progressives**
**Durée totale** : **45 jours calendaires** (~8 semaines avec buffers)
**Livraison MVP estimée** : 45 jours après le début effectif du projet

> **Note sur l'estimation** : L'estimation initiale de 30 jours était irréaliste. Les 45 jours incluent
> 7 sprints de travail effectif (34 jours) + 6 buffers inter-sprints (6 jours) + 5 jours de marge générale
> pour absorber le debugging d'intégration, les imprévus techniques (FCM, CI) et les points de synchronisation
> mock vers réel. Cette estimation est basée sur le retour d'expérience de projets similaires.

**Principes directeurs** :

- Le Frontend développe contre un Mock Server (Prism + openapi.yaml) et bascule module par module vers le Backend réel
- Chaque sprint se termine par un point de synchronisation avec des tests d'intégration valides
- GitHub Flow : branches `feature/*` et `fix/*` mergees directement dans `main` (1 approval, CI verte)
- Tests API valides via Spectral (lint OpenAPI) + Prism (mock) + Supertest (intégration)

---

## Architecture de Développement

```
+---------------------------------------------------------------------------+
|                       DEVELOPPEMENT PARALLELE                              |
+--------------------------------------+------------------------------------+
|  DEVELOPPEUR 1 (Backend)             |  DEVELOPPEUR 2 (Frontend)          |
+--------------------------------------+------------------------------------+
|  NestJS + PostgreSQL + Redis         |  Expo (React Native) + Zustand     |
|  TDD (Tests d'abord)                |  Prism Mock Server (openapi.yaml)  |
|  Prisma ORM (direct dans services)   |  RNTL Tests                        |
|  class-validator + class-transformer |  react-i18next (i18n FR/EN)        |
|  Redis blacklist (révocation JWT)    |  React Native Paper (UI)           |
+--------------------------------------+------------------------------------+
|                     SYNCHRONISATION PAR SPRINT                             |
|  Sprint 1 : Auth -> Frontend basculé vers Backend réel                    |
|  Sprint 2 : Borrowers -> Synchronisation                                  |
|  Sprint 3 : Items (Photos) -> Synchronisation                             |
|  Sprint 4 : Loans -> Synchronisation                                      |
|  Sprint 5 : Reminders + Notifications -> Synchronisation                  |
|  Sprint 6 : History + Déploiement -> Synchronisation complète + Go Live   |
+---------------------------------------------------------------------------+
```

---

## Timeline des Sprints (Vue Gantt)

```
Sprint 0 : Setup Infrastructuré (4 jours)
+- Backend  : [===============================] 100% (Setup NestJS, Prisma, JWT, CI/CD)
+- Frontend : [===============================] 100% (Setup Expo, Navigation, Prism Mock, i18n)
   Synchronisation : Mock Server lance

--- Buffer (1 jour) ---

Sprint 1 : Auth + Users (5 jours)
+- Backend  : [============] 60% Jour 1-3 -> [====================] 100% Jour 5
|  +- Livrables : POST /auth/register, /login, /refresh, /logout, GET /users/me, PATCH /users/me, PATCH /users/me/password, DELETE /users/me, GET /users/me/settings, PATCH /users/me/settings
+- Frontend : [====================] 100% (Login, Register, Profile via Mock)
   SYNC POINT : Frontend basculé Auth -> Backend réel (Jour 5)

--- Buffer (1 jour) ---

Sprint 2 : Borrowers (4 jours)
+- Backend  : [============] 60% Jour 1-2 -> [====================] 100% Jour 4
|  +- Livrables : CRUD Borrowers (5 endpoints)
+- Frontend : [====================] 100% (Liste, Création, Édition via Mock)
   SYNC POINT : Frontend basculé Borrowers -> Backend réel (Jour 4)

--- Buffer (1 jour) ---

Sprint 3 : Items - Photos (4 jours)
+- Backend  : [==========] 50% Jour 1-2 -> [====================] 100% Jour 4
|  +- Livrables : CRUD Items + R2 Photos + Avatar utilisateur (7 endpoints)
+- Frontend : [====================] 100% (Liste, Upload Photos via Mock)
   SYNC POINT : Frontend basculé Items -> Backend réel (Jour 4)

--- Buffer (1 jour) ---

Sprint 4 : Loans - Coeur Métier (8 jours)
+- Backend  : [======] 30% Jour 1-3 -> [============] 60% Jour 5 -> [====================] 100% Jour 8
|  +- Livrables : Workflow 8 statuts + Confirmation + CRON Timeout + Redis/BullMQ (8 endpoints)
+- Frontend : [====================] 100% (Création, Workflow, Confirmation via Mock)
   SYNC POINT : Frontend basculé Loans -> Backend réel (Jour 8)

--- Buffer (1 jour) ---

Sprint 5 : Reminders automatiques + Notifications (5 jours)
+- Backend  : [==========] 50% Jour 1-3 -> [====================] 100% Jour 5
|  +- Livrables : 5 rappels auto (J-3, J, J+7, J+14, J+21) + FCM Push (3 endpoints notifications)
+- Frontend : [====================] 100% (Notifications Push + Rappels via Mock)
   SYNC POINT : Frontend basculé Notifications -> Backend réel (Jour 5)

--- Buffer (1 jour) ---

Sprint 6 : History + Déploiement + Polish (4 jours)
+- Backend  : [============] 60% Jour 1-2 -> [====================] 100% Jour 4
|  +- Livrables : Statistiques + Historique + Borrower loans + Déploiement Fly.io (5 endpoints)
+- Frontend : [====================] 100% (Dashboard + Stats + Historique via Mock)
   SYNC POINT FINAL : Frontend 100% Backend réel (Jour 4)
```

**Total** : 4 + 1 + 5 + 1 + 4 + 1 + 4 + 1 + 8 + 1 + 5 + 1 + 4 = **40 jours** + **5 jours de marge générale** = **45 jours calendaires**

> **Utilisation de la marge** : Les 5 jours de marge générale sont reserves à :
> - Debugging d'intégration entre Backend et Frontend (2 jours)
> - Imprévus techniques : configuration FCM, CI/CD, problèmes de build Expo (2 jours)
> - Smoke tests finaux et corrections pre-déploiement (1 jour)
>
> Ces jours ne sont pas assignes à un sprint spécifique. Ils sont consommes au besoin durant le projet.

---

## Jalons Majeurs (Milestones)

| Milestone | Jour | Critère de Succes | Go/No-Go |
|---|---|---|---|
| **M0 — Infrastructuré Ready** | Jour 4 | Backend demarre + Mock Server lancé + CI/CD opérationnel (incl. Spectral lint openapi.yaml) + i18n configuré | Smoke tests : `npm run start:dev` (backend) demarre sans erreur ; `npx expo start` (frontend) affiché l'écran d'accueil ; pipeline CI passe au vert (Spectral valide openapi.yaml) |
| **M1 — Auth Complet** | Jour 10 | Login/Register fonctionnel Frontend vers Backend réel | Smoke tests : `POST /auth/register` retourné 201 ; `POST /auth/login` retourné un JWT validé ; refresh token fonctionne ; `DELETE /users/me` supprime le compte ; Frontend affiché le Dashboard après login |
| **M2 — Gestion Contacts** | Jour 15 | CRUD Borrowers Frontend vers Backend réel | Smoke tests : créer un emprunteur retourné 201 ; lister retourné la pagination ; supprimer retourné 204 ; erreur 409 si email déjà pris ; Frontend affiché la liste des emprunteurs |
| **M-CHECK — Checkpoint Mi-Parcours** | Jour 20-22 | Evaluation du scope restant vs temps disponible | Decision formelle : on continue le plan complet OU on coupe des features non-essentielles (stats avancees, deep linking, dashboard détaillé) pour tenir la date. Documenter la decision dans un ADR |
| **M3 — Enregistrement Objets (Photos)** | Jour 20 | Upload photos + CRUD Items Frontend vers Backend réel | Smoke tests : `POST /items` avec type OBJECT retourné 201 ; `POST /items` avec type MONEY retourné 201 ; upload photo vers R2 retourné URL ; `DELETE /items/{id}` avec prêt actif retourné 409 |
| **M4 — Prêts Fonctionnels** | Jour 29 | Workflow 8 statuts complet Frontend vers Backend réel | Smoke tests : créer prêt (PENDING) -> confirmer (ACTIVE) -> retournér (RETURNED) ; créer prêt -> contester (DISPUTED) ; timeout 48h passe en ACTIVE_BY_DEFAULT ; transition invalidé retourné 400 |
| **M5 — Notifications Push** | Jour 35 | Rappels automatiques et notifications temps réel fonctionnels | Smoke tests : rappel J-3 planifié à la création du prêt ; notification push reçue sur device physique ; `GET /notifications` retourné la liste ; `PATCH /notifications/{id}/read` marque comme lu |
| **M6 — MVP Complet** | Jour 45 | App complète prete pour déploiement production | Smoke tests : flow complet register -> créer item -> créer prêt -> confirmer -> retournér -> consulter stats ; déploiement Fly.io OK ; build Expo OK (iOS + Android) |

---

## Repartition des Taches (2 Développeurs)

### Sprint 0 : Setup (4 jours)

| Jour | Dev 1 (Backend) | Dev 2 (Frontend) |
|---|---|---|
| **J1** | Setup NestJS + TypeScript + ESLint + Prettier | Setup Expo (React Native) + TypeScript + ESLint + Prettier |
| **J2** | Prisma + PostgreSQL Docker + Redis Docker + `docker-compose.yml` | React Navigation + Zustand + React Native Paper |
| **J3** | JWT Module (Passport.js) + Redis blacklist + RFC 7807 Exception Filter + Winston | Axios + JWT Interceptor + AsyncStorage securise + react-i18next (FR/EN) |
| **J4** | CI/CD GitHub Actions (lint + tests + Spectral lint openapi.yaml + Docker build) + `Dockerfile` | Prism Mock Server + CI/CD (lint + RNTL tests) |

**Livrable** : Infrastructuré complète prete pour développement.

---

### Sprint 1 : Auth + Users (5 jours)

| Jour | Dev 1 (Backend) | Dev 2 (Frontend) |
|---|---|---|
| **J1** | Schemas Prisma User + RefreshToken + Migrations | Store Zustand Auth + Actions |
| **J2** | Tests TDD : register, login, refresh, logout | Composants UI : LoginForm, RegisterForm |
| **J3** | Implémentation Services + Controllers Auth + Redis blacklist logout | Écrans : LoginScreen, RegisterScreen |
| **J4** | Tests TDD : updateProfile, changePassword, deleteAccount, getSettings, updateSettings + Implémentation | Écrans : ProfileScreen, EditProfileScreen, SettingsScreen |
| **J5** | Review + Fix bugs + Documentation Swagger | Navigation + AuthGuard + Tests RNTL |

SYNC : Frontend basculé Auth vers Backend réel (fin J5).

---

### Sprint 2 : Borrowers (4 jours)

| Jour | Dev 1 (Backend) | Dev 2 (Frontend) |
|---|---|---|
| **J1** | Schema Prisma Borrower + Tests TDD CRUD | Store Zustand Borrowers + Actions CRUD |
| **J2** | Implémentation Services + Controllers Borrowers | Composants UI : BorrowerCard, BorrowerForm |
| **J3** | Tests Supertest + Review | Écrans : List, Create, Detail, Edit + Tests RNTL |
| **J4** | Buffer intégration + fix bugs sync | Buffer intégration + fix bugs sync |

SYNC : Frontend basculé Borrowers vers Backend réel (fin J4).

---

### Sprint 3 : Items — Photos (4 jours)

| Jour | Dev 1 (Backend) | Dev 2 (Frontend) |
|---|---|---|
| **J1** | Schemas Prisma Item + Photo + Migrations | Store Zustand Items + Actions CRUD |
| **J2** | Tests TDD : CRUD Items + R2 Photos upload | Composants UI : ItemCard, ItemForm, PhotoPicker |
| **J3** | Implémentation Services (R2 Photos, types OBJECT + MONEY) | Composants UI : PhotoGallery |
| **J4** | Implémentation Controllers + PUT /users/me/avatar (réutilise R2) + Tests Supertest | Écrans : ItemList, CreateItem, ItemDetail + Tests RNTL |

SYNC : Frontend basculé Items vers Backend réel (fin J4).

---

### Sprint 4 : Loans (8 jours)

| Jour | Dev 1 (Backend) | Dev 2 (Frontend) |
|---|---|---|
| **J1** | Schema Prisma Loan + Migrations + Index | Store Zustand Loans + Actions |
| **J2** | Tests TDD : createLoan (type OBJECT + MONEY), confirmLoan, contestLoan | Composants UI : LoanCard, StatusBadge |
| **J3** | Tests TDD : updateStatus, workflow transitions (8 statuts) | Composants UI : LoanWizard (3 steps) |
| **J4** | Implémentation LoanFactory + LoanStatusMachine | Composants UI : LoanTimeline, ConfirmationDialog |
| **J5** | Implémentation LoanService + EventEmitter2 | Écrans : LoanListScreen, CreateLoanScreen |
| **J6** | Setup Redis + BullMQ + CRON Job timeout 48h + Controllers | Écrans : LoanDetailScreen, ConfirmLoanScreen, ReturnLoanScreen |
| **J7** | Tests Supertest workflow complet + Review | Tests RNTL (flow complet création -> confirmation -> retour) |
| **J8** | Buffer intégration + fix bugs sync | Buffer intégration + fix bugs sync |

SYNC : Frontend basculé Loans vers Backend réel (fin J8).

> **Note** : Redis et BullMQ sont configurés dans ce sprint car c'est le premier besoin réel (CRON timeout 48h).
> Cela evite de configurér Redis pour BullMQ au Sprint 0 alors qu'il n'est pas utilisé avant le Sprint 4.
> Redis est toutefois configuré dès leSprint 0 pour la blacklist JWT (logout/révocation).

---

### Sprint 5 : Reminders automatiques + Notifications (5 jours)

| Jour | Dev 1 (Backend) | Dev 2 (Frontend) |
|---|---|---|
| **J1** | Schemas Prisma Reminder + Notification + Migrations | Setup Firebasé Cloud Messaging (FCM) |
| **J2** | Tests TDD : scheduleReminders (5 rappels auto : J-3, J, J+7, J+14, J+21) | Store Zustand Notifications + Actions |
| **J3** | Implémentation politique de rappels fixe + ReminderService | Composants UI : NotificationCard, NotificationBadge |
| **J4** | CRON Job envoi rappels (BullMQ) + FCM Push | Écrans : NotificationListScreen |
| **J5** | Tests Supertest + Review | Tests RNTL + Intégration avec LoanDetailScreen |

SYNC : Frontend basculé Notifications vers Backend réel (fin J5).

> **Note** : Les rappels sont 100% automatiques avec une politique fixe (J-3, J, J+7, J+14, J+21).
> Pas de rappels manuels en V1. Les rappels manuels sont reportes en V2.

---

### Sprint 6 : History + Déploiement + Polish (4 jours)

| Jour | Dev 1 (Backend) | Dev 2 (Frontend) |
|---|---|---|
| **J1** | Tests TDD : getArchivedLoans, getStatistics, trustScore, borrowerLoans | Store Zustand History + Actions |
| **J2** | Implémentation HistoryService + Agregations Prisma + BorrowerService.getLoans() | Composants UI : StatCard, PieChart, TopBorrowersList |
| **J3** | Smoke tests d'intégration complets + Documentation finale | Écrans : Dashboard, History, Statistics + Tests RNTL |
| **J4** | Vérification Dockerfile + `fly.toml` + Déploiement production Fly.io + Smoke tests | Polish UI + Fix bugs finaux + Build Expo (iOS + Android) |

SYNC FINAL : Frontend 100% Backend réel (fin J4).

---

## Points de Synchronisation Détaillés

### SYNC 1 : Auth (Fin Sprint 1 — Jour 10)

**Backend disponible** :

- `POST /auth/register` (201 Created, 409 Email exists)
- `POST /auth/login` (200 OK, 401 Invalid credentials)
- `POST /auth/refresh` (200 OK, 401 Invalid refresh token)
- `POST /auth/logout` (204 No Content — token ajouté à la blacklist Redis)
- `GET /users/me` (200 OK)
- `PATCH /users/me` (200 OK, 409 Email taken)
- `PATCH /users/me/password` (200 OK, 401 Wrong current password)
- `DELETE /users/me` (204 No Content — suppression de compte et données associées)
- `GET /users/me/settings` (200 OK — préférences notifications + langue)
- `PATCH /users/me/settings` (200 OK — update enableReminders, defaultLanguage)

**Action Frontend** :

```typescript
// Dans apiClient.ts
const MOCK_MODULES = {
    auth: false,      // Backend réel active
    borrowers: true,  // Mock encore actif
    items: true,
    loans: true,
    reminders: true,
    notifications: true,
    history: true,
};
```

**Smoke tests de validation** :

- [ ] Supertest : `POST /auth/register` retourne 201 avec JWT
- [ ] Supertest : `POST /auth/login` retourne 200 avec access + refresh tokens
- [ ] Supertest : `POST /auth/logout` ajoute le token à la blacklist Redis
- [ ] Supertest : `GET /users/me` retourne les infos utilisateur
- [ ] Supertest : `GET /users/me/settings` retourne les paramètres
- [ ] Supertest : `DELETE /users/me` retourne 204 et supprime les données
- [ ] RNTL : Login vers Dashboard (flow complet)
- [ ] RNTL : Register vers Dashboard
- [ ] RNTL : Édition profil
- [ ] RNTL : Paramètres notifications + langue
- [ ] Gestion erreur 401 (token expire -> refresh auto)

---

### SYNC 2 : Borrowers (Fin Sprint 2 — Jour 15)

**Backend disponible** :

- `GET /borrowers` (200 OK, pagination)
- `POST /borrowers` (201 Created, 409 Email exists)
- `GET /borrowers/{id}` (200 OK, 404 Not found)
- `PATCH /borrowers/{id}` (200 OK)
- `DELETE /borrowers/{id}` (204 No Content, 409 Active loans)

> **Note** : `GET /borrowers/{id}/statistics` et `GET /borrowers/{id}/loans` ne sont pas disponibles à ce stade.
> Ils nécessitent les données de prêts (module Loans, Sprint 4) et sont implémentés au Sprint 6.

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,      // Backend réel
    borrowers: false, // Backend réel active
    items: true,
    loans: true,
    reminders: true,
    notifications: true,
    history: true,
};
```

**Smoke tests de validation** :

- [ ] Supertest : `POST /borrowers` retourné 201
- [ ] Supertest : `DELETE /borrowers/{id}` avec prêts actifs retourné 409
- [ ] RNTL : Créer emprunteur -> Affichage dans liste
- [ ] RNTL : Supprimer emprunteur
- [ ] Gestion erreur 409 (email existe deja)

---

### SYNC 3 : Items (Fin Sprint 3 — Jour 20)

**Backend disponible** :

- `GET /items` (200 OK, filtres category/available)
- `POST /items` (201 Created, 400 MONEY sans value)
- `GET /items/{id}` (200 OK, 404 Not found)
- `PATCH /items/{id}` (200 OK)
- `DELETE /items/{id}` (204 No Content, 409 Currently loaned)
- `POST /items/{id}/photos` (201 Created, max 5 photos)
- `PUT /users/me/avatar` (200 OK — upload photo de profil via R2)

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,     // Backend réel active (R2 Photos)
    loans: true,
    reminders: true,
    notifications: true,
    history: true,
};
```

**Smoke tests de validation** :

- [ ] Supertest : `POST /items` avec type OBJECT retourné 201
- [ ] Supertest : `POST /items` avec type MONEY retourné 201
- [ ] Supertest : `POST /items/{id}/photos` upload vers R2
- [ ] Supertest : `PUT /users/me/avatar` upload vers R2
- [ ] RNTL : Création objet avec photo
- [ ] Gestion erreur 400 (type MONEY sans montant)

---

### SYNC 4 : Loans (Fin Sprint 4 — Jour 29)

**Backend disponible** :

- `GET /loans` (200 OK, filtres status/borrowerId/includeArchived)
- `POST /loans` (201 Created, status PENDING_CONFIRMATION)
- `GET /loans/{id}` (200 OK avec relations)
- `PATCH /loans/{id}` (200 OK)
- `DELETE /loans/{id}` (204 No Content, 409 Already returned)
- `PATCH /loans/{id}/status` (200 OK, 400 Invalid transition)
- `POST /loans/{id}/confirm` (200 OK -> ACTIVE)
- `POST /loans/{id}/contest` (200 OK -> DISPUTED)

> **Note** : 8 endpoints Loans implémentés au total (CRUD + confirm + contest + updateStatus).

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,
    loans: false,     // Backend réel active (workflow complet)
    reminders: true,
    notifications: true,
    history: true,
};
```

**Smoke tests de validation** :

- [ ] Supertest : `POST /loans` retourné 201 avec status PENDING_CONFIRMATION
- [ ] Supertest : workflow complet PENDING -> ACTIVE -> RETURNED
- [ ] Supertest : `POST /loans/{id}/contest` retourné DISPUTED
- [ ] Supertest : transition invalidé retourné 400
- [ ] RNTL : Créer prêt -> Confirmer -> Retourner (flow complet)
- [ ] RNTL : Refus de prêt (DISPUTED)
- [ ] Vérification CRON timeout 48h (PENDING -> ACTIVE_BY_DEFAULT)

---

### SYNC 5 : Reminders + Notifications (Fin Sprint 5 — Jour 35)

**Backend disponible** :

- `GET /loans/{id}/reminders` (200 OK)
- `GET /reminders/{id}` (200 OK)
- `POST /reminders/{id}/cancel` (204 No Content, 409 Already sent)
- `GET /notifications` (200 OK, filtre unreadOnly)
- `PATCH /notifications/{id}/read` (200 OK)
- `POST /notifications/read-all` (204 No Content)

> **Note** : Les rappels sont 100% automatiques (politique fixe J-3, J, J+7, J+14, J+21).
> 5 rappels planifiés automatiquement à la création d'un prêt avec date d'échéance.
> Les 3 endpoints `/reminders/*` ne sont pas utilisés en V1 (réservés pour rappels manuels V2+).
> **Endpoints actifs en V1** : 3 endpoints notifications (`GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all`).

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,
    loans: false,
    reminders: false,     // Backend réel active
    notifications: false, // Backend réel active (FCM)
    history: true,
};
```

**Smoke tests de validation** :

- [ ] Supertest : `GET /loans/{id}/reminders` retourné 5 rappels planifiés
- [ ] Supertest : `GET /notifications` retourné la liste paginée
- [ ] Supertest : `PATCH /notifications/{id}/read` marque comme lu
- [ ] Test notification push réelle (via backend FCM sur device physique)
- [ ] RNTL : liste des notifications + marquage lu
- [ ] Vérification que les 5 rappels sont planifiés automatiquement à la création d'un pret

---

### SYNC FINAL : History + Déploiement (Fin Sprint 6 — Jour 45)

**Backend disponible** :

- `GET /history/loans` (200 OK, filtres date + status)
- `GET /history/statistics` (200 OK, overview + charts)
- `GET /borrowers/{id}/statistics` (200 OK, trustScore)
- `GET /borrowers/{id}/loans` (200 OK, filtres status)

> **Note** : `GET /borrowers/{id}/statistics` et `GET /borrowers/{id}/loans` sont implémentés dans ce sprint
> car ils nécessitent les données de prêts (module Loans, Sprint 4). Le backend est également déployé sur Fly.io
> dans ce sprint (Dockerfile + fly.toml + `fly deploy`).

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,
    loans: false,
    reminders: false,
    notifications: false,
    history: false,       // Backend réel active (100% réel)
};
```

**Smoke tests de validation** :

- [ ] Supertest : `GET /history/statistics` retourné les stats correctes
- [ ] Supertest : `GET /history/loans` retourné l'historique paginé
- [ ] RNTL : Navigation Dashboard -> Statistiques
- [ ] Smoke test complet : Register -> Create Item -> Create Loan -> Confirm -> Return -> Stats
- [ ] Vérification couverture code : Domain 95%, Services 90%, Controllers 70%

---

## Gestion des Risques

| Risque | Probabilite | Impact | Mitigation | Responsable |
|---|---|---|---|---|
| **Scope creep** | Elevee | Eleve | Scope minimal défini : auth + borrowers + items + loans + rappels auto. Checkpoint mi-parcours (M-CHECK jour 20-22) pour reevaluer. Features non-essentielles identifiées et coupables : stats avancees, deep linking, dashboard détaillé | Dev 1 & 2 |
| **Backend en retard (bloque Frontend)** | Moyenne | Eleve | Frontend utilisé le Mock Server Prism (pas de blocage). Le Frontend peut avancer indépendamment sur tous les écrans | Dev 1 & 2 |
| **Rejet App Store** | Moyenne | Moyen | Prevoir 1-2 semaines post-MVP pour review Apple/Google. Preparer les assets (screenshots, description, politique de confidentialite) en avance. Première soumission = allers-retours probables | Dev 1 & 2 |
| **Notifications FCM non reçues** | Moyenne | Moyen | Tester avec Postman -> FCM dès leSprint 5, logs Winston détaillés. Prevoir un fallback in-app (polling notifications) | Dev 1 & 2 |
| **Migration Prisma échoue en prod** | Faible | Eleve | Testcontainers pour valider les migrations en CI. Tester chaque migration sur une copie de la DB avant application en prod | Dev 1 |
| **Timeout CRON Job (48h) non déclenché** | Faible | Moyen | Tests unitaires avec fake clock (Jest `jest.useFakeTimers()`), logs BullMQ détaillés | Dev 1 |
| **Build Expo échoue (iOS/Android)** | Moyenne | Moyen | Tester les builds EAS regulierement (pas seulement au Sprint 6). Première tentative de build au Sprint 3 au plus tard | Dev 2 |

---

## Checklist de Livraison MVP (Jour 45)

### Backend

- [ ] ~40 endpoints fonctionnels (conformes à openapi.yaml, 3 endpoints Reminders réservés V2)
- [ ] Couverture de tests : Domain 95%, Services 90%, Controllers 70%
- [ ] Smoke tests d'intégration passent (flow complet register -> loan -> return)
- [ ] Documentation Swagger accessible `/api/docs`
- [ ] CI/CD passe sur `main` (0 erreur, 0 warning)
- [ ] Logs Winston en JSON (ERROR, WARN, INFO seulement en prod)
- [ ] Rate limiting actif (login 10/15min, photos 30/jour)
- [ ] CRON Jobs fonctionnels (timeout 48h + envoi rappels automatiques)
- [ ] Redis blacklist JWT opérationnelle (logout = révocation immédiate)
- [ ] Validation class-validator sur tous les DTOs

### Frontend

- [ ] ~20 écrans fonctionnels
- [ ] Tous les tests RNTL passent
- [ ] Gestion d'erreurs RFC 7807 complète (toasts + modales)
- [ ] Navigation fluide (pas de lag)
- [ ] Authentification persistante (Remember Me)
- [ ] Notifications push FCM fonctionnelles
- [ ] Upload photos vers R2 fonctionnel
- [ ] i18n FR/EN fonctionnel (react-i18next)
- [ ] Types de prêts : Objet et Argent

### Infrastructuré

- [ ] Dockerfile multi-stage fonctionnel (image < 200 MB)
- [ ] `docker-compose.yml` pour développement local (NestJS + PostgreSQL + Redis)
- [ ] `fly.toml` configuré (region `cdg`, release_command: prisma migrate deploy)
- [ ] Backend déployé sur Fly.io (production, 1 region Europe West)
- [ ] PostgreSQL manage (Fly.io)
- [ ] Redis manage (cache + BullMQ + blacklist JWT)
- [ ] Cloudflare R2 configuré (photos)
- [ ] Firebasé Cloud Messaging configuré
- [ ] DNS configuré (`api.return.app`)
- [ ] SSL/TLS actif (Let's Encrypt via Fly.io)
- [ ] CI/CD : lint + tests + Spectral + Docker build

### Documentation

> Les items ci-dessous sont des objectifs de qualite. Ils ne sont pas bloquants pour la livraison MVP
> mais doivent etre complètes dans les jours suivant le déploiement.

- [ ] README.md mis à jour (instructions installation)
- [ ] CHANGELOG.md généré (Conventional Commits)
- [ ] openapi.yaml validé (Spectral lint passe sans erreur)
- [ ] Schemas Prisma documentes
- [ ] Postman Collection exportee (tests manuels)

---

## Post-MVP (Backlog V2)

| Feature | Priorite | Complexite | Sprint Estime | Notes |
|---|---|---|---|---|
| **OCR (Google Cloud Vision)** | Haute | Moyenne | Sprint 7 (3j) | Reconnaissance automatique d'objets via photo. Reporte de V1 pour reduire le scope MVP |
| **Email Notifications** (en plus de push) | Haute | Moyenne | Sprint 8 (3j) | Resend ou SendGrid |
| **Rappels Manuels** | Moyenne | Faible | Sprint 8 (2j) | Permettre au prêteur d'envoyer un rappel manuel en plus des 5 automatiques |
| **SMS Reminders** (Twilio) | Moyenne | Moyenne | Sprint 9 (3j) | |
| **Export CSV/PDF** (historique) | Moyenne | Faible | Sprint 9 (2j) | |
| **Dark Mode** | Faible | Faible | Sprint 10 (2j) | |
| **Freemium Limits** (X loans/month) | Haute | Moyenne | Sprint 10 (5j) | Champ `subscription_tier` prévu des V1 |
| **Detox E2E Tests** | Moyenne | Moyenne | Sprint 11 (3j) | Tests E2E sur emulateurs iOS/Android. RNTL couvre le MVP |
| **Accessibilité** (VoiceOver + TalkBack) | Moyenne | Moyenne | Sprint 11 (3j) | |
| **Web Version** (React) | Faible | Elevee | Sprint 12-14 (15j) | |
| **AR Object Recognition** (ARKit/ARCore) | Faible | Elevee | Sprint 15-16 (10j) | |

> **Note sur l'i18n** : Les fondations i18n (react-i18next) sont installees dès leSprint 0 de la V1.
> L'application est bilingue FR/EN dès lelancement. Il n'y à donc pas de sprint i18n dédié en V2 —
> l'ajout de nouvelles langues se fera incrementalement.

---

## Calendrier Récapitulatif (45 jours ~ 8 semaines)

| Semaine | Sprints | Modules Livres | SYNC Points |
|---|---|---|---|
| **Semaine 1** | Sprint 0 (4j) + buffer (1j) | Setup complet (NestJS, Expo, CI/CD, i18n, Mock Server, Redis blacklist, Docker) | — |
| **Semaine 2** | Sprint 1 (5j) | Auth + Users | SYNC Auth (J10) |
| **Semaine 3** | Buffer (1j) + Sprint 2 (4j) | Borrowers | SYNC Borrowers (J15) |
| **Semaine 4** | Buffer (1j) + Sprint 3 (4j) | Items + Photos R2 | SYNC Items (J20) |
| **Semaine 5** | Buffer (1j) + Sprint 4 début (4j) | Loans (coeur métier) — partie 1 | M-CHECK : checkpoint mi-parcours (J20-22) |
| **Semaine 6** | Sprint 4 fin (4j) + buffer (1j) | Loans complet | SYNC Loans (J29) |
| **Semaine 7** | Sprint 5 (5j) | Reminders automatiques + Notifications Push | SYNC Reminders (J35) |
| **Semaine 8** | Buffer (1j) + Sprint 6 (4j) | History + Dashboard + Polish + Déploiement | SYNC FINAL (J45) |

---

**Date de Livraison MVP** : Jour 45 après le début effectif du projet
**First Public Release** : ~2 semaines après le MVP (TestFlight iOS + Google Play Beta — prevoir les allers-retours avec les stores)

---

**Co-validé par** : Esdras GBEDOZIN & Ismael AIHOU
**Date de dernière mise à jour** : 12 février 2026
**Version** : 1.1 — MVP Baseline (post contre-expertise)
