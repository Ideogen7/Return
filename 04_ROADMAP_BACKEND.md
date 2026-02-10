# 04_ROADMAP_BACKEND.md
**Return ↺ - Roadmap de Développement Backend (NestJS)**

---

## Stratégie de Développement (2 Développeurs)

**Approche** : Développement itératif par **Sprints verticaux** (1 sprint = 1 module fonctionnel complet).

**Principe** :
1. Chaque Sprint livre un module **end-to-end** (DB → Services → API → Tests).
2. Le Frontend peut se connecter au Backend dès la fin du Sprint 1 (Auth).
3. Pas de "Big Bang" final : Les modules sont intégrés progressivement.

**Durée estimée** : 6 Sprints de 5 jours (30 jours calendaires).

---

## Sprint 0 : Setup Projet (3-4 jours)

### 🎯 Objectif
Mettre en place l'infrastructure Backend avant tout développement fonctionnel.

### Tâches

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **SETUP-001** | Initialiser le repository NestJS | - | `npm run start` fonctionne | 30min |
| **SETUP-002** | Configurer TypeScript strict + ESLint + Prettier | SETUP-001 | `npm run lint` passe sans erreur | 30min |
| **SETUP-003** | Installer Prisma + PostgreSQL (Docker Compose) | SETUP-001 | `npx prisma db push` fonctionne | 1h |
| **SETUP-004** | Configurer Winston (logs JSON structurés) | SETUP-001 | Logs écrits en JSON avec requestId | 1h |
| **SETUP-005** | Implémenter RFC 7807 Exception Filter global | SETUP-004 | Erreur 404 retourne format RFC 7807 | 1h30 |
| **SETUP-006** | Configurer JWT Module (access + refresh tokens) | SETUP-001 | JWT signé et vérifié avec `@nestjs/jwt` | 1h |
| **SETUP-007** | Créer le Guard d'authentification (JwtAuthGuard) | SETUP-006 | Route protégée retourne 401 si pas de token | 1h |
| **SETUP-008** | Installer Redis (BullMQ pour jobs asynchrones) | SETUP-003 | Redis connecté, queue créée | 1h |
| **SETUP-009** | Configurer Cloudflare R2 SDK (stockage photos) | SETUP-001 | Upload de test fonctionne | 1h |
| **SETUP-010** | Setup CI/CD GitHub Actions (lint + tests) | SETUP-002 | Pipeline passe sur `main` et `develop` | 1h30 |

-----Contre Expertise--------
**Setup prématuré de R2 et Redis** : SETUP-008 (Redis/BullMQ) n'est utilisé qu'au Sprint 4 (CRON timeout 48h) et SETUP-009 (Cloudflare R2) qu'au Sprint 3 (photos). Configurer des services 2-3 sprints à l'avance = maintenance de configuration inutilisée, risque de drift de config. Mieux vaut installer au moment du besoin réel (just-in-time setup) : R2 au Sprint 3 et Redis au Sprint 4.

**Éléments manquants au Sprint 0** :
- **Health check endpoint** : Aucun `/health` prévu pour le monitoring Fly.io (readiness/liveness probes). Indispensable pour le déploiement.
- **Gestion des environnements** : Pas de tâche pour `.env`, secrets management, configurations par environnement (dev/staging/prod).
- **FCM (Firebase)** : Le SDK Firebase pour les push notifications (Sprint 5) n'est configuré nulle part. FCM nécessite un projet Firebase, un service account, et un `google-services.json`. À prévoir ici ou au Sprint 5.
-----Fin Contre Expertise--------

**Livrable Sprint 0** : 🚀 Backend démarrable avec auth JWT fonctionnel (pas de BDD métier encore).

---

## Sprint 1 : Module Auth + Users (5 jours)

### 🎯 Objectif
Authentification complète + Gestion de profil. **Le Frontend peut s'y connecter dès la fin du Sprint.**

### Phase 1.1 : Base de Données (Jour 1)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-001** | Créer le schema Prisma `User` (email, password, role, firstName, lastName) | SETUP-003 | Migration appliquée, table `users` créée | 30min |
| **AUTH-002** | Créer le schema Prisma `RefreshToken` (token, userId, expiresAt) | AUTH-001 | Migration appliquée, relation 1-N avec `User` | 30min |
| **AUTH-003** | Ajouter index sur `users.email` (unique) et `refreshTokens.token` | AUTH-002 | `EXPLAIN` montre index utilisé | 15min |

### Phase 1.2 : Tests (TDD) (Jour 2)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-004** | TEST : Écrire le test de `POST /auth/register` (success 201) | AUTH-003 | Test écrit (échoue car pas de code) | 30min |
| **AUTH-005** | TEST : Écrire le test de `POST /auth/register` (erreur 400 si email déjà utilisé) | AUTH-004 | Test écrit (échoue) | 20min |
| **AUTH-006** | TEST : Écrire le test de `POST /auth/login` (success 200 avec tokens) | AUTH-004 | Test écrit (échoue) | 30min |
| **AUTH-007** | TEST : Écrire le test de `POST /auth/login` (erreur 401 si mot de passe invalide) | AUTH-006 | Test écrit (échoue) | 20min |
| **AUTH-008** | TEST : Écrire le test de `POST /auth/refresh` (success 200 avec nouveau access token) | AUTH-006 | Test écrit (échoue) | 30min |
| **AUTH-009** | TEST : Écrire le test de `POST /auth/logout` (success 204, refresh token invalidé) | AUTH-006 | Test écrit (échoue) | 20min |
| **AUTH-010** | TEST : Écrire le test de `GET /auth/me` (success 200 avec infos utilisateur) | AUTH-006 | Test écrit (échoue) | 20min |

-----Contre Expertise--------
**Faux TDD : tous les tests d'un coup** : La Phase 1.2 écrit les 7 tests en une seule journée (Jour 2), puis l'implémentation en Jour 3-4. Ce n'est **pas du TDD**, c'est du "test-first waterfall". Le vrai cycle TDD (RED-GREEN-REFACTOR-COMMIT tel que décrit en 02_NORMES) impose d'écrire UN test → le code minimal → refactorer → commiter, **avant** de passer au test suivant. Écrire 7 tests qui échouent tous simultanément ne donne aucun feedback incrémental et complique le debugging. Ce problème se répète dans **tous les sprints** de cette roadmap (Phases x.2 systématiquement groupées). Restructurer le plan pour entremêler tests et implémentation par fonctionnalité.
-----Fin Contre Expertise--------

### Phase 1.3 : Logique Métier (Jour 3)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-011** | Implémenter `UserRepository` (interface + implémentation Prisma) | AUTH-003 | Principe DIP respecté (service dépend de l'interface) | 1h |
| **AUTH-012** | Implémenter `AuthService.register()` (hash password avec bcrypt, créer user) | AUTH-011 | Test AUTH-004 passe ✅ | 1h |
| **AUTH-013** | Implémenter `AuthService.login()` (vérifier credentials, générer JWT) | AUTH-012 | Tests AUTH-006 et AUTH-007 passent ✅ | 1h30 |
| **AUTH-014** | Implémenter `AuthService.refreshToken()` (vérifier refresh token, générer nouveau access token) | AUTH-013 | Test AUTH-008 passe ✅ | 1h |
| **AUTH-015** | Implémenter `AuthService.logout()` (invalider refresh token en Redis) | AUTH-014 | Test AUTH-009 passe ✅ | 45min |

-----Contre Expertise--------
**AUTH-015 : Logout via Redis contradictoire avec l'ADR-004** : Cette tâche prévoit "invalider refresh token en Redis", mais l'ADR-004 (01_ARCHITECTURE_TECHNIQUE) classe la révocation Redis comme **dette technique**, pas V1. Soit on l'implémente dès le Sprint 1 (et l'ADR est faux), soit on fait un logout simple (suppression du refresh token en base de données PostgreSQL) et Redis viendra plus tard. Incohérence à trancher.
-----Fin Contre Expertise--------

### Phase 1.4 : Endpoints API (Jour 4)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-016** | Créer `AuthController.register()` (POST /auth/register) | AUTH-012 | Test AUTH-004 et AUTH-005 passent ✅ | 45min |
| **AUTH-017** | Créer `AuthController.login()` (POST /auth/login) | AUTH-013 | Tests AUTH-006 et AUTH-007 passent ✅ | 45min |
| **AUTH-018** | Créer `AuthController.refresh()` (POST /auth/refresh) | AUTH-014 | Test AUTH-008 passe ✅ | 30min |
| **AUTH-019** | Créer `AuthController.logout()` (POST /auth/logout) | AUTH-015 | Test AUTH-009 passe ✅ | 30min |
| **AUTH-020** | Créer `AuthController.me()` (GET /auth/me) avec JwtAuthGuard | SETUP-007, AUTH-013 | Test AUTH-010 passe ✅ | 30min |

### Phase 1.5 : Module Users (Profil) (Jour 5)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **USER-001** | TEST : Écrire le test de `PATCH /users/me` (update firstName/lastName) | AUTH-020 | Test écrit (échoue) | 20min |
| **USER-002** | TEST : Écrire le test de `PATCH /users/me/password` (change password) | AUTH-020 | Test écrit (échoue) | 20min |
| **USER-003** | Implémenter `UserService.updateProfile()` | AUTH-011 | Test USER-001 passe ✅ | 1h |
| **USER-004** | Implémenter `UserService.changePassword()` (vérifier ancien mot de passe) | USER-003 | Test USER-002 passe ✅ | 1h |
| **USER-005** | Créer `UsersController.updateMe()` (PATCH /users/me) | USER-003 | Test USER-001 passe ✅ | 30min |
| **USER-006** | Créer `UsersController.changePassword()` (PATCH /users/me/password) | USER-004 | Test USER-002 passe ✅ | 30min |

**Livrable Sprint 1** : 🎉 **Frontend peut s'authentifier + gérer profil** (5 endpoints Auth + 2 endpoints Users).

---

## Sprint 2 : Module Borrowers (3 jours)

### 🎯 Objectif
Gérer les contacts (emprunteurs). **Simple CRUD, pas de logique complexe.**

### Phase 2.1 : Base de Données

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-001** | Créer le schema Prisma `Borrower` (firstName, lastName, email, phoneNumber, userId FK) | AUTH-001 | Migration appliquée | 30min |
| **BORR-002** | Ajouter index sur `borrowers.email` (unique) et `borrowers.userId` | BORR-001 | Index créés | 15min |

-----Contre Expertise--------
**Borrower.email unique : problème de modèle** : BORR-002 impose un index unique sur `borrowers.email`. Mais un emprunteur est un **contact** du prêteur, pas un utilisateur de l'app. Si Alice et Bob prêtent tous deux à Charlie (même email), chacun crée un contact "Charlie" → conflit d'unicité. L'unicité devrait être sur le couple `(userId, email)` (unique par prêteur), pas sur `email` seul. De même, BORR-004 teste "erreur 409 si email existe déjà" : cela devrait être "si email existe déjà **pour ce prêteur**".
-----Fin Contre Expertise--------

### Phase 2.2 : Tests (TDD)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-003** | TEST : `POST /borrowers` (success 201) | BORR-002 | Test écrit (échoue) | 20min |
| **BORR-004** | TEST : `POST /borrowers` (erreur 409 si email existe déjà) | BORR-003 | Test écrit (échoue) | 15min |
| **BORR-005** | TEST : `GET /borrowers` (liste paginée) | BORR-003 | Test écrit (échoue) | 20min |
| **BORR-006** | TEST : `GET /borrowers/{id}` (success 200) | BORR-003 | Test écrit (échoue) | 15min |
| **BORR-007** | TEST : `PATCH /borrowers/{id}` (update success) | BORR-003 | Test écrit (échoue) | 15min |
| **BORR-008** | TEST : `DELETE /borrowers/{id}` (success 204) | BORR-003 | Test écrit (échoue) | 15min |
| **BORR-009** | TEST : `DELETE /borrowers/{id}` (erreur 409 si prêts actifs) | BORR-008 | Test écrit (échoue) | 15min |

### Phase 2.3 : Logique Métier

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-010** | Implémenter `BorrowerRepository` (interface + Prisma) | BORR-002 | Interface créée | 45min |
| **BORR-011** | Implémenter `BorrowerService.create()` (vérifier unicité email) | BORR-010 | Tests BORR-003 et BORR-004 passent ✅ | 1h |
| **BORR-012** | Implémenter `BorrowerService.findAll()` (pagination) | BORR-010 | Test BORR-005 passe ✅ | 45min |
| **BORR-013** | Implémenter `BorrowerService.findById()` | BORR-010 | Test BORR-006 passe ✅ | 30min |
| **BORR-014** | Implémenter `BorrowerService.update()` | BORR-010 | Test BORR-007 passe ✅ | 45min |
| **BORR-015** | Implémenter `BorrowerService.delete()` (vérifier absence de prêts actifs) | BORR-010 | Tests BORR-008 et BORR-009 passent ✅ | 1h |

### Phase 2.4 : Endpoints API

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-016** | Créer `BorrowersController` (6 endpoints CRUD) | BORR-015 | Tous les tests BORR-003 à BORR-009 passent ✅ | 1h30 |

**Livrable Sprint 2** : 🎉 **Frontend peut gérer les emprunteurs** (6 endpoints Borrowers).

---

## Sprint 3 : Module Items (4 jours)

### 🎯 Objectif
Gérer les objets prêtables + Reconnaissance OCR + Upload photos.

### Phase 3.1 : Base de Données

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-001** | Créer le schema Prisma `Item` (name, description, category, estimatedValue, userId FK) | AUTH-001 | Migration appliquée | 30min |
| **ITEM-002** | Créer le schema Prisma `Photo` (url, thumbnailUrl, itemId FK) | ITEM-001 | Relation 1-N avec `Item` | 30min |
| **ITEM-003** | Ajouter index sur `items.userId` et `items.category` | ITEM-002 | Index créés | 15min |

-----Contre Expertise--------
**OCR Google Vision : coût et ROI douteux en V1** : ITEM-013 prévoit 2h pour implémenter `GoogleVisionService` avec retry. C'est très optimiste : il faut un compte GCP, une clé API, la gestion de billing/quotas, le parsing de la réponse Vision API, et la transformation en suggestions d'items. On a déjà soulevé dans la contre-expertise de la bible (00) que l'OCR est un scope creep pour V1. La saisie manuelle + photo descriptive suffit amplement. Si maintenu malgré tout, prévoir au minimum 4-6h et un fallback propre en cas de dépassement de quota ou d'indisponibilité de l'API.
-----Fin Contre Expertise--------

### Phase 3.2 : Tests (TDD)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-004** | TEST : `POST /items` (création manuelle success 201) | ITEM-003 | Test écrit (échoue) | 20min |
| **ITEM-005** | TEST : `POST /items` (erreur 400 si category=MONEY sans estimatedValue) | ITEM-004 | Test écrit (échoue) | 15min |
| **ITEM-006** | TEST : `GET /items` (liste paginée avec filtres category/available) | ITEM-004 | Test écrit (échoue) | 25min |
| **ITEM-007** | TEST : `POST /items/recognize` (OCR success 200 avec suggestions) | ITEM-004 | Test écrit (échoue) | 30min |
| **ITEM-008** | TEST : `POST /items/recognize` (erreur 503 si Google Vision down) | ITEM-007 | Test écrit (échoue) | 15min |
| **ITEM-009** | TEST : `POST /items/{id}/photos` (upload success 201) | ITEM-004 | Test écrit (échoue) | 25min |
| **ITEM-010** | TEST : `DELETE /items/{id}` (erreur 409 si prêt en cours) | ITEM-004 | Test écrit (échoue) | 15min |

### Phase 3.3 : Logique Métier

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-011** | Implémenter `ItemRepository` (interface + Prisma) | ITEM-003 | Interface créée | 45min |
| **ITEM-012** | Implémenter `PhotoStorageService` (interface + R2 implementation) | SETUP-009 | Upload/delete fonctionnel sur R2 | 2h |
| **ITEM-013** | Implémenter `GoogleVisionService` (reconnaissance d'objets via API) | ITEM-003 | Appel API fonctionnel, retry si échec | 2h |
| **ITEM-014** | Implémenter `ItemService.create()` (validation category+value) | ITEM-011 | Tests ITEM-004 et ITEM-005 passent ✅ | 1h |
| **ITEM-015** | Implémenter `ItemService.recognizeFromPhoto()` (appel Google Vision) | ITEM-013 | Tests ITEM-007 et ITEM-008 passent ✅ | 1h30 |
| **ITEM-016** | Implémenter `ItemService.addPhotos()` (max 5 photos, upload R2) | ITEM-012 | Test ITEM-009 passe ✅ | 1h30 |
| **ITEM-017** | Implémenter `ItemService.delete()` (vérifier absence de prêt actif) | ITEM-011 | Test ITEM-010 passe ✅ | 1h |

### Phase 3.4 : Endpoints API

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-018** | Créer `ItemsController` (CRUD + recognize + photos) | ITEM-017 | Tous les tests ITEM-004 à ITEM-010 passent ✅ | 2h |

**Livrable Sprint 3** : 🎉 **Frontend peut gérer les objets avec OCR et photos** (6 endpoints Items).

---

## Sprint 4 : Module Loans (Cœur Métier) (7 jours)

### 🎯 Objectif
Gestion complète du cycle de vie des prêts (7 statuts, workflow de confirmation, clôture).

### Phase 4.1 : Base de Données

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-001** | Créer le schema Prisma `Loan` (itemId FK, lenderId FK, borrowerId FK, status enum, returnDate, confirmationDate, returnedDate, notes) | ITEM-001, AUTH-001, BORR-001 | Migration appliquée | 1h |
| **LOAN-002** | Ajouter index composé `loans(userId, status)` pour filtrage rapide | LOAN-001 | Index créé | 15min |
| **LOAN-003** | Ajouter contrainte CHECK `returnDate > createdAt` | LOAN-001 | Contrainte PostgreSQL ajoutée | 20min |

### Phase 4.2 : Tests (TDD) - Création

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-004** | TEST : `POST /loans` (success 201, status=PENDING_CONFIRMATION) | LOAN-003 | Test écrit (échoue) | 30min |
| **LOAN-005** | TEST : `POST /loans` (erreur 400 si returnDate < today) | LOAN-004 | Test écrit (échoue) | 15min |
| **LOAN-006** | TEST : `POST /loans` (créer item+borrower inline si UUID non fourni) | LOAN-004 | Test écrit (échoue) | 25min |

-----Contre Expertise--------
**LOAN-006 : création inline item+borrower = God-endpoint** : Cet endpoint créerait potentiellement 3 entités (Loan + Item + Borrower) dans une seule requête. Cela viole le SRP prôné en 02_NORMES, complexifie la gestion d'erreur (que faire si l'item est créé mais le loan échoue ? Rollback ?), et crée une transaction lourde. Recommandation : le frontend crée l'item et le borrower d'abord via les endpoints dédiés (Sprint 2-3), puis passe les UUIDs au `POST /loans`. Un endpoint = une responsabilité.
-----Fin Contre Expertise--------
| **LOAN-007** | TEST : `GET /loans` (liste paginée avec filtres status/borrowerId) | LOAN-004 | Test écrit (échoue) | 25min |
| **LOAN-008** | TEST : `GET /loans/{id}` (success 200 avec relations item+borrower) | LOAN-004 | Test écrit (échoue) | 20min |

### Phase 4.3 : Tests (TDD) - Workflow de Statut

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-009** | TEST : `POST /loans/{id}/confirm` (PENDING_CONFIRMATION → ACTIVE) | LOAN-004 | Test écrit (échoue) | 20min |
| **LOAN-010** | TEST : `POST /loans/{id}/contest` (PENDING_CONFIRMATION → CONTESTED) | LOAN-004 | Test écrit (échoue) | 20min |
| **LOAN-011** | TEST : Timeout auto 48h (PENDING_CONFIRMATION → ACTIVE_BY_DEFAULT via CRON) | LOAN-004 | Test écrit (échoue) | 30min |
| **LOAN-012** | TEST : `PATCH /loans/{id}/status` (ACTIVE → AWAITING_RETURN si returnDate dépassée) | LOAN-004 | Test écrit (échoue) | 20min |
| **LOAN-013** | TEST : `PATCH /loans/{id}/status` (AWAITING_RETURN → RETURNED) | LOAN-004 | Test écrit (échoue) | 20min |
| **LOAN-014** | TEST : `PATCH /loans/{id}/status` (AWAITING_RETURN → NOT_RETURNED après 3 rappels) | LOAN-004 | Test écrit (échoue) | 25min |
| **LOAN-015** | TEST : Transition invalide retourne 400 (ex: CONTESTED → ACTIVE) | LOAN-004 | Test écrit (échoue) | 20min |

-----Contre Expertise--------
**LOAN-014 : transition dépendante des rappels = couplage inter-modules** : La transition "AWAITING_RETURN → NOT_RETURNED après 3 rappels" signifie que le module Loan doit **connaître** le nombre de rappels envoyés pour décider d'une transition. C'est un couplage fort entre Loan et Reminder, en contradiction directe avec le pattern Observer/EventBus qui prône le découplage inter-modules. La transition devrait être déclenchée par un événement du module Reminder (`AllRemindersExhaustedEvent`) que le module Loan écoute, sans que Loan sache combien de rappels il y a eu.

**LOAN-011 : timeout 48h d'auto-confirmation** : On a déjà signalé dans la contre-expertise de la bible (00) que le consentement implicite après 48h est juridiquement questionnable. La roadmap l'implémente sans réserve. À minima, prévoir un flag de configuration pour activer/désactiver ce comportement.
-----Fin Contre Expertise--------

### Phase 4.4 : Logique Métier - Factory + Service

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-016** | Implémenter `LoanRepository` (interface + Prisma) | LOAN-003 | Interface créée | 45min |
| **LOAN-017** | Implémenter `LoanFactory.create()` (validation business rules) | LOAN-016 | Pattern Factory appliqué | 1h30 |
| **LOAN-018** | Implémenter `LoanService.create()` (appel Factory + EventBus LOAN_CREATED) | LOAN-017 | Tests LOAN-004 à LOAN-006 passent ✅ | 2h |
| **LOAN-019** | Implémenter `LoanService.findAll()` (filtres + pagination) | LOAN-016 | Test LOAN-007 passe ✅ | 1h |
| **LOAN-020** | Implémenter `LoanService.findById()` (avec relations) | LOAN-016 | Test LOAN-008 passe ✅ | 45min |

### Phase 4.5 : Logique Métier - Workflow de Statut

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-021** | Implémenter `LoanStatusMachine` (validateur de transitions) | LOAN-016 | Machine à états créée | 2h |
| **LOAN-022** | Implémenter `LoanService.confirm()` (changement PENDING → ACTIVE) | LOAN-021 | Test LOAN-009 passe ✅ | 1h |
| **LOAN-023** | Implémenter `LoanService.contest()` (changement PENDING → CONTESTED) | LOAN-021 | Test LOAN-010 passe ✅ | 1h |
| **LOAN-024** | Implémenter `LoanService.updateStatus()` (validation via StatusMachine) | LOAN-021 | Tests LOAN-012 à LOAN-015 passent ✅ | 2h |
| **LOAN-025** | Implémenter CRON Job timeout 48h (PENDING → ACTIVE_BY_DEFAULT via BullMQ) | LOAN-021, SETUP-008 | Test LOAN-011 passe ✅ | 2h |

### Phase 4.6 : Endpoints API

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-026** | Créer `LoansController.create()` (POST /loans) | LOAN-018 | Tests LOAN-004 à LOAN-006 passent ✅ | 1h |
| **LOAN-027** | Créer `LoansController.findAll()` (GET /loans) | LOAN-019 | Test LOAN-007 passe ✅ | 45min |
| **LOAN-028** | Créer `LoansController.findOne()` (GET /loans/{id}) | LOAN-020 | Test LOAN-008 passe ✅ | 30min |
| **LOAN-029** | Créer `LoansController.confirm()` (POST /loans/{id}/confirm) | LOAN-022 | Test LOAN-009 passe ✅ | 30min |
| **LOAN-030** | Créer `LoansController.contest()` (POST /loans/{id}/contest) | LOAN-023 | Test LOAN-010 passe ✅ | 30min |
| **LOAN-031** | Créer `LoansController.updateStatus()` (PATCH /loans/{id}/status) | LOAN-024 | Tests LOAN-012 à LOAN-015 passent ✅ | 1h |

**Livrable Sprint 4** : 🎉 **Frontend peut créer et suivre des prêts (workflow complet)** (7 endpoints Loans).

---

## Sprint 5 : Module Reminders + Notifications (5 jours)

### 🎯 Objectif
Système de rappels automatiques + Notifications push.

### Phase 5.1 : Base de Données

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **REM-001** | Créer le schema Prisma `Reminder` (loanId FK, type enum, status enum, scheduledFor, sentAt, message, channel enum) | LOAN-001 | Migration appliquée | 45min |
| **REM-002** | Créer le schema Prisma `Notification` (userId FK, type enum, title, body, isRead, relatedLoanId FK) | AUTH-001 | Migration appliquée | 30min |
| **REM-003** | Ajouter index sur `reminders(loanId, status)` et `notifications(userId, isRead)` | REM-002 | Index créés | 15min |

### Phase 5.2 : Tests (TDD)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **REM-004** | TEST : Création automatique de 5 rappels (PREVENTIVE, ON_DUE_DATE, 3x OVERDUE) quand prêt créé | REM-003 | Test écrit (échoue) | 30min |

-----Contre Expertise--------
**Nombre de rappels incohérent entre les documents** : REM-004 mentionne "5 rappels (PREVENTIVE, ON_DUE_DATE, 3x OVERDUE)", mais la bible projet (00) décrit 4 rappels (J-3, J+3, J+10, J+17) sans "ON_DUE_DATE" le jour J. L'OpenAPI spec (`openapi.yaml`) peut encore avoir un schéma différent. Il faut aligner **toutes** les sources sur un nombre et un calendrier unique de rappels. C'est une donnée métier fondamentale qui ne peut pas varier d'un document à l'autre.
-----Fin Contre Expertise--------
| **REM-005** | TEST : `POST /loans/{id}/reminders/manual` (envoi manuel success 201) | REM-003 | Test écrit (échoue) | 20min |
| **REM-006** | TEST : `POST /loans/{id}/reminders/manual` (erreur 429 si > 10/heure) | REM-005 | Test écrit (échoue) | 20min |
| **REM-007** | TEST : `POST /reminders/{id}/cancel` (annulation success 204) | REM-005 | Test écrit (échoue) | 15min |
| **REM-008** | TEST : Envoi automatique de rappel via CRON (status SCHEDULED → SENT) | REM-003 | Test écrit (échoue) | 30min |
| **REM-009** | TEST : `GET /notifications` (liste paginée avec filtre unreadOnly) | REM-003 | Test écrit (échoue) | 20min |
| **REM-010** | TEST : `PATCH /notifications/{id}/read` (marquer comme lu success 200) | REM-009 | Test écrit (échoue) | 15min |

### Phase 5.3 : Logique Métier

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **REM-011** | Implémenter `ReminderRepository` (interface + Prisma) | REM-003 | Interface créée | 45min |
| **REM-012** | Implémenter `NotificationRepository` (interface + Prisma) | REM-003 | Interface créée | 30min |
| **REM-013** | Implémenter `ReminderStrategy` (calcul dates de rappel selon type) | REM-011 | Pattern Strategy appliqué | 2h |
| **REM-014** | Implémenter `ReminderService.scheduleReminders()` (création automatique) | REM-013 | Test REM-004 passe ✅ | 2h |
| **REM-015** | Écouter événement `LOAN_CREATED` (EventBus) pour déclencher `scheduleReminders()` | REM-014, LOAN-018 | Pattern Observer appliqué | 1h |
| **REM-016** | Implémenter `ReminderService.sendManual()` (rate limiting 10/heure) | REM-011 | Tests REM-005 et REM-006 passent ✅ | 1h30 |
| **REM-017** | Implémenter `ReminderService.cancel()` | REM-011 | Test REM-007 passe ✅ | 45min |
| **REM-018** | Implémenter CRON Job `sendScheduledReminders()` (BullMQ chaque heure) | REM-011 | Test REM-008 passe ✅ | 2h |
| **REM-019** | Implémenter `NotificationService.send()` (push FCM + création en DB) | REM-012 | Notification créée en DB | 2h |

-----Contre Expertise--------
**FCM (Firebase) : absent du Sprint 0** : REM-019 implémente les push notifications via FCM, mais le SDK Firebase, le service account, et les credentials ne sont configurés nulle part dans le Sprint 0 (ni ailleurs). FCM nécessite un projet Firebase, un fichier `google-services.json`, la configuration côté mobile, et un test d'envoi. Ajouter une tâche SETUP dédiée, soit au Sprint 0 soit en début de Sprint 5.

**REM-013 : ReminderStrategy** : On a déjà soulevé en 02_NORMES que le Strategy Pattern est sur-ingénieré pour V1 (une seule politique de rappel fixe). Ici, 2h sont allouées à l'implémenter. Un simple service avec la logique en dur suffit, refactorer en Strategy quand un deuxième algorithme sera nécessaire.
-----Fin Contre Expertise--------

### Phase 5.4 : Endpoints API

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **REM-020** | Créer `RemindersController.sendManual()` (POST /loans/{id}/reminders/manual) | REM-016 | Tests REM-005 et REM-006 passent ✅ | 45min |
| **REM-021** | Créer `RemindersController.cancel()` (POST /reminders/{id}/cancel) | REM-017 | Test REM-007 passe ✅ | 30min |
| **REM-022** | Créer `NotificationsController.findAll()` (GET /notifications) | REM-019 | Test REM-009 passe ✅ | 45min |
| **REM-023** | Créer `NotificationsController.markAsRead()` (PATCH /notifications/{id}/read) | REM-019 | Test REM-010 passe ✅ | 30min |

**Livrable Sprint 5** : 🎉 **Frontend reçoit des notifications et peut envoyer des rappels manuels** (4 endpoints Reminders + 2 endpoints Notifications).

---

## Sprint 6 : Module History + Finalisation (3 jours)

### 🎯 Objectif
Statistiques + Historique archivé + Tests E2E complets.

### Phase 6.1 : Base de Données

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-001** | Ajouter index composé `loans(userId, status, returnedDate)` pour analytics | LOAN-001 | Index créé | 15min |

### Phase 6.2 : Tests (TDD)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-002** | TEST : `GET /history/loans` (filtre status RETURNED/NOT_RETURNED) | HIST-001 | Test écrit (échoue) | 20min |
| **HIST-003** | TEST : `GET /history/statistics` (overview + byCategory + topBorrowers + mostLoanedItems) | HIST-001 | Test écrit (échoue) | 30min |
| **HIST-004** | TEST : `GET /borrowers/{id}/statistics` (trustScore calculation) | BORR-001 | Test écrit (échoue) | 25min |

-----Contre Expertise--------
**trustScore sans règles métier définies** : HIST-004 et HIST-007 implémentent un "trustScore" pour les emprunteurs, mais **aucun document** (bible, architecture, OpenAPI) ne définit la formule de calcul. Taux de retour à l'heure ? Pondération par ancienneté ? Pénalité par jour de retard ? Score sur 100 ou sur 5 ? Sans spécification métier précise, le développeur inventera un algorithme arbitraire qui devra être retravaillé.
-----Fin Contre Expertise--------

### Phase 6.3 : Logique Métier

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-005** | Implémenter `HistoryService.getArchivedLoans()` (filtres date + status) | LOAN-016 | Test HIST-002 passe ✅ | 1h30 |
| **HIST-006** | Implémenter `HistoryService.getStatistics()` (agrégations Prisma) | LOAN-016 | Test HIST-003 passe ✅ | 2h |
| **HIST-007** | Implémenter `BorrowerService.getStatistics()` (calcul trustScore) | BORR-010 | Test HIST-004 passe ✅ | 1h30 |

### Phase 6.4 : Endpoints API

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-008** | Créer `HistoryController.getLoans()` (GET /history/loans) | HIST-005 | Test HIST-002 passe ✅ | 45min |
| **HIST-009** | Créer `HistoryController.getStatistics()` (GET /history/statistics) | HIST-006 | Test HIST-003 passe ✅ | 45min |
| **HIST-010** | Ajouter endpoint `BorrowersController.getStatistics()` (GET /borrowers/{id}/statistics) | HIST-007 | Test HIST-004 passe ✅ | 30min |

### Phase 6.5 : Tests E2E + Documentation

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **E2E-001** | Écrire test E2E : Flow complet (register → create loan → confirm → send reminder → return) | HIST-010 | Test E2E passe ✅ | 2h |
| **E2E-002** | Vérifier couverture de code (Domain 100%, Services 90%, Repositories 80%, Controllers 70%) | E2E-001 | Seuils respectés | 1h |
| **E2E-003** | Générer documentation OpenAPI automatique (Swagger UI accessible sur /api/docs) | HIST-010 | Swagger UI affiche tous les endpoints | 1h |
| **E2E-004** | Publier contrat Pact pour tests de contrat Frontend | E2E-003 | Fichier .pact publié sur Pact Broker | 30min |

**Livrable Sprint 6** : 🚀 **Backend complet avec 100% de couverture de tests + Documentation Swagger**.

---

## Résumé des Sprints

| Sprint | Durée | Modules | Endpoints livrés | Tests |
|--------|-------|---------|------------------|-------|
| **Sprint 0** | 3-4 jours | Setup infrastructure | 0 | ✅ CI/CD |
| **Sprint 1** | 5 jours | Auth + Users | 7 (Auth: 5, Users: 2) | ✅ 10 tests |
| **Sprint 2** | 3 jours | Borrowers | 6 | ✅ 9 tests |
| **Sprint 3** | 4 jours | Items | 6 | ✅ 10 tests |
| **Sprint 4** | 7 jours | Loans (cœur métier) | 7 | ✅ 15 tests |
| **Sprint 5** | 5 jours | Reminders + Notifications | 6 | ✅ 10 tests |
| **Sprint 6** | 3 jours | History + E2E | 3 | ✅ E2E complet |
| **TOTAL** | **30 jours** | **7 modules** | **35 endpoints** | **✅ 54+ tests** |

-----Contre Expertise--------
**Estimation globale : 30 jours calendaires irréaliste** : 35 endpoints + 54 tests + OCR + push notifications + CRON jobs + CI/CD + E2E pour 2 développeurs en 30 jours calendaires. Aucun buffer pour les bugs, les blockers techniques (configuration FCM, quotas GCP, problèmes Docker), la courbe d'apprentissage (Prisma, BullMQ, NestJS EventBus), ou les absences. En pratique, un facteur x2 à x2.5 est courant en développement logiciel. Recommandation : prévoir **45-60 jours** ou réduire le scope V1 (supprimer OCR, simplifier les statistiques, reporter les push notifications à la V1.1).

**Seeding/fixtures de données manquant** : Aucune tâche dans aucun sprint pour créer des données de test ou des scripts de seed. Pourtant, le frontend a besoin de données réalistes pour développer en parallèle (en complément du mock Prism). Prévoir une tâche de seeding au Sprint 1 ou 2.

**Migration strategy absente** : Pas de tâche pour gérer les migrations Prisma en production (rollback en cas d'échec, data migration pour les schémas existants). Dès le Sprint 1, la DB de production existera — les sprints suivants ajouteront des tables et des colonnes. Comment gérer un rollback si le Sprint 3 échoue ?
-----Fin Contre Expertise--------

---

## Points de Synchronisation Frontend/Backend

| Moment | Frontend peut brancher | Backend disponible |
|--------|------------------------|-------------------|
| **Fin Sprint 1** | Authentification + Profil | `/auth/*` + `/users/me` |
| **Fin Sprint 2** | Gestion contacts | `/borrowers/*` |
| **Fin Sprint 3** | Enregistrement objets (OCR) | `/items/*` |
| **Fin Sprint 4** | Création et suivi de prêts | `/loans/*` |
| **Fin Sprint 5** | Notifications temps réel | `/reminders/*` + `/notifications/*` |
| **Fin Sprint 6** | Statistiques complètes | `/history/*` |

---

## Checklist de Fin de Sprint

À valider avant de passer au sprint suivant :

- [ ] Tous les tests unitaires passent (couverture respectée)
- [ ] Tous les tests d'intégration passent
- [ ] Migration de base de données appliquée sans erreur
- [ ] Documentation Swagger mise à jour (endpoints visibles)
- [ ] Code review approuvé (2 approvals)
- [ ] CI/CD passe sur `develop` et `main`
- [ ] Contract Pact publié (si changement d'API)
- [ ] Changelog mis à jour (Conventional Commits)

-----Contre Expertise--------
**Checklist hérite des problèmes identifiés en 02_NORMES** :
- "2 approvals" → mathématiquement impossible à 2 développeurs (cf. contre-expertise 02)
- "Contract Pact publié" → Pact est overkill pour l'équipe, l'OpenAPI-first approach suffit (cf. contre-expertise 02)
- "CI/CD sur develop et main" → la branche `develop` est superflue avec GitHub Flow (cf. contre-expertise 02)
-----Fin Contre Expertise--------

---

**Auteur** : Return Team (Backend)
**Version** : 1.0
**Date** : 8 février 2026

---

**Contre-expertise par :** Ismael AÏHOU
**Date :** 10 février 2026
