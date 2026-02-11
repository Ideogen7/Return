# 06_PLAN_GENERAL.md

**Return ↺ - Plan Général de Développement (Master Plan)**

---

## Vision d'Ensemble

**Équipe** : 2 Développeurs (Full-Stack)  
**Stratégie** : **Développement parallèle Backend/Frontend avec synchronisations progressives**  
**Durée totale** : **30 jours calendaires** (6 Sprints de 5 jours)
**Livraison MVP** : 8 Mars 2026

-----Contre Expertise--------
**30 jours calendaires = irréaliste (cohérent avec les contre-expertises 04 et 05)** : Ce plan consolide les roadmaps
backend et frontend qui totalisent chacune 30 jours. Mais 30 jours calendaires pour 2 développeurs = 60 person-days,
sans aucun buffer. En ajoutant les points de synchronisation mock→réel, le debugging d'intégration, les imprévus
techniques (FCM, Google Vision, Detox CI), et les absences, une estimation réaliste serait **45-60 jours calendaires** (
livraison fin mars/mi-avril 2026 au lieu du 8 mars).

**Date de début déjà dépassée** : Le document indique "Date de Début : 6 février 2026". Nous sommes le 10 février. Si le
développement n'a pas commencé, le planning est déjà en retard de 4 jours.
-----Fin Contre Expertise--------

---

## Architecture de Développement

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DÉVELOPPEMENT PARALLÈLE                       │
├──────────────────────────────┬──────────────────────────────────────┤
│  DÉVELOPPEUR 1 (Backend)     │  DÉVELOPPEUR 2 (Frontend)            │
├──────────────────────────────┼──────────────────────────────────────┤
│  NestJS + PostgreSQL + Redis │  React Native + Zustand + Mock API   │
│  TDD (Tests d'abord)         │  Prism Mock Server (openapi.yaml)    │
│  Prisma + Repository Pattern │  Detox E2E Tests                     │
├──────────────────────────────┴──────────────────────────────────────┤
│                     SYNCHRONISATION PAR SPRINT                      │
│  Sprint 1 : Auth → Frontend bascule vers Backend réel              │
│  Sprint 2 : Borrowers → Synchronisation                            │
│  Sprint 3 : Items → Synchronisation                                │
│  Sprint 4 : Loans → Synchronisation                                │
│  Sprint 5 : Reminders → Synchronisation                            │
│  Sprint 6 : History → Synchronisation complète                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Timeline des Sprints (Vue Gantt)

```
Sprint 0 : Setup Infrastructure (3-4 jours)
├─ Backend  : [███████████████████████████████] 100% (Setup NestJS, Prisma, JWT, CI/CD)
└─ Frontend : [███████████████████████████████] 100% (Setup RN, Navigation, Prism Mock)
   Synchronisation : Mock Server lancé ✅
   
Sprint 1 : Auth + Users (5 jours)
├─ Backend  : [████████████] 60% Jour 1-3 → [████████████████████] 100% Jour 5
│  └─ Livrables : POST /auth/register, /login, /refresh, /logout, GET /auth/me, PATCH /users/me
└─ Frontend : [████████████████████] 100% (Login, Register, Profile via Mock)
   🔄 SYNC POINT : Frontend bascule Auth → Backend réel (Jour 5)

Sprint 2 : Borrowers (3 jours)
├─ Backend  : [████████████] 60% Jour 1-2 → [████████████████████] 100% Jour 3
│  └─ Livrables : CRUD Borrowers (6 endpoints)
└─ Frontend : [████████████████████] 100% (Liste, Création, Édition via Mock)
   🔄 SYNC POINT : Frontend bascule Borrowers → Backend réel (Jour 3)

Sprint 3 : Items (4 jours)
├─ Backend  : [██████████] 50% Jour 1-2 → [████████████████████] 100% Jour 4
│  └─ Livrables : CRUD Items + OCR Google Vision + R2 Photos (6 endpoints)
└─ Frontend : [████████████████████] 100% (Liste, OCR, Upload Photos via Mock)
   🔄 SYNC POINT : Frontend bascule Items → Backend réel (Jour 4)

Sprint 4 : Loans (Cœur Métier) (7 jours)
├─ Backend  : [██████] 30% Jour 1-3 → [████████████] 60% Jour 5 → [████████████████████] 100% Jour 7
│  └─ Livrables : Workflow 7 statuts + Confirmation + CRON Timeout (7 endpoints)
└─ Frontend : [████████████████████] 100% (Création, Workflow, Confirmation via Mock)
   🔄 SYNC POINT : Frontend bascule Loans → Backend réel (Jour 7)

Sprint 5 : Reminders + Notifications (5 jours)
├─ Backend  : [██████████] 50% Jour 1-3 → [████████████████████] 100% Jour 5
│  └─ Livrables : Rappels auto + Manuel + FCM Push (6 endpoints)
└─ Frontend : [████████████████████] 100% (Notifications Push + Rappels via Mock)
   🔄 SYNC POINT : Frontend bascule Notifications → Backend réel (Jour 5)

Sprint 6 : History + Dashboard (3 jours)
├─ Backend  : [████████████] 60% Jour 1-2 → [████████████████████] 100% Jour 3
│  └─ Livrables : Statistiques + Historique + E2E complets (3 endpoints)
└─ Frontend : [████████████████████] 100% (Dashboard + Stats + Historique via Mock)
   🔄 SYNC POINT FINAL : Frontend 100% Backend réel (Jour 3)
```

---

## Jalons Majeurs (Milestones)

| Milestone                      | Date    | Critère de Succès                                           | Responsable |
|--------------------------------|---------|-------------------------------------------------------------|-------------|
| **M0 - Infrastructure Ready**  | Jour 4  | Backend démarrable + Mock Server lancé + CI/CD opérationnel | Dev 1 & 2   |
| **M1 - Auth Complet**          | Jour 9  | Login/Register fonctionnel Frontend → Backend réel          | Dev 1 & 2   |
| **M2 - Gestion Contacts**      | Jour 12 | CRUD Borrowers Frontend → Backend réel                      | Dev 1 & 2   |
| **M3 - Enregistrement Objets** | Jour 16 | OCR + Photos fonctionnel Frontend → Backend réel            | Dev 1 & 2   |
| **M4 - Prêts Fonctionnels**    | Jour 23 | Workflow 7 statuts complet Frontend → Backend réel          | Dev 1 & 2   |
| **M5 - Notifications Push**    | Jour 28 | Notifications temps réel fonctionnelles                     | Dev 1 & 2   |
| **M6 - MVP Complet**           | Jour 30 | App complète prête pour déploiement staging                 | Dev 1 & 2   |

-----Contre Expertise--------
**Jalons sans critères de succès mesurables** : Les milestones disent "Frontend → Backend réel" mais ne définissent pas
de critères de validation concrets. Par exemple, M1 "Login/Register fonctionnel" : combien de scénarios doivent passer ?
Quel est le seuil d'erreur acceptable ? Suggestion : associer à chaque milestone une liste de smoke tests spécifiques
qui constituent le go/no-go.

**Aucun milestone de "gel de scope"** : Il n'y a pas de point de décision pour réévaluer le scope si un sprint prend du
retard. Si le Sprint 4 (Loans, 7 jours) déborde de 3 jours, tout le planning glisse. Prévoir un checkpoint à
mi-parcours (Jour 15) pour décider : on continue comme prévu, ou on coupe l'OCR/les stats pour tenir la date ?
-----Fin Contre Expertise--------

---

## Répartition des Tâches (2 Développeurs)

### Sprint 0 : Setup (3-4 jours)

| Jour   | Dev 1 (Backend)                                  | Dev 2 (Frontend)                                |
|--------|--------------------------------------------------|-------------------------------------------------|
| **J1** | Setup NestJS + TypeScript + ESLint               | Setup React Native + TypeScript + ESLint        |
| **J2** | Prisma + PostgreSQL Docker + Redis               | React Navigation + Zustand + React Native Paper |
| **J3** | JWT Module + RFC 7807 Exception Filter + Winston | Axios + JWT Interceptor + AsyncStorage          |
| **J4** | CI/CD GitHub Actions (lint + tests)              | Prism Mock Server + CI/CD (Detox)               |

**Livrable** : Infrastructure complète prête pour développement.

---

### Sprint 1 : Auth + Users (5 jours)

| Jour   | Dev 1 (Backend)                                            | Dev 2 (Frontend)                          |
|--------|------------------------------------------------------------|-------------------------------------------|
| **J1** | Schemas Prisma User + RefreshToken + Migrations            | Store Zustand Auth + Actions              |
| **J2** | Tests TDD : register, login, refresh, logout, me           | Composants UI : LoginForm, RegisterForm   |
| **J3** | Implémentation Services + Controllers Auth                 | Écrans : LoginScreen, RegisterScreen      |
| **J4** | Tests TDD : updateProfile, changePassword + Implémentation | Écrans : ProfileScreen, EditProfileScreen |
| **J5** | Review + Fix bugs + Documentation Swagger                  | Navigation + AuthGuard + Tests Detox      |

🔄 **SYNC** : Frontend bascule Auth → Backend réel (fin J5).

---

### Sprint 2 : Borrowers (3 jours)

| Jour   | Dev 1 (Backend)                                 | Dev 2 (Frontend)                                  |
|--------|-------------------------------------------------|---------------------------------------------------|
| **J1** | Schema Prisma Borrower + Tests TDD CRUD         | Store Zustand Borrowers + Actions CRUD            |
| **J2** | Implémentation Services + Controllers Borrowers | Composants UI : BorrowerCard, BorrowerForm        |
| **J3** | Tests E2E + Review                              | Écrans : List, Create, Detail, Edit + Tests Detox |

🔄 **SYNC** : Frontend bascule Borrowers → Backend réel (fin J3).

---

### Sprint 3 : Items (4 jours)

| Jour   | Dev 1 (Backend)                            | Dev 2 (Frontend)                                       |
|--------|--------------------------------------------|--------------------------------------------------------|
| **J1** | Schemas Prisma Item + Photo + Migrations   | Store Zustand Items + Actions CRUD                     |
| **J2** | Tests TDD : CRUD Items + Google Vision OCR | Composants UI : ItemCard, ItemForm, PhotoPicker        |
| **J3** | Implémentation Services (OCR + R2 Photos)  | Composants UI : RecognitionResults, PhotoGallery       |
| **J4** | Implémentation Controllers + Tests E2E     | Écrans : List, Create, Recognize, Detail + Tests Detox |

🔄 **SYNC** : Frontend bascule Items → Backend réel (fin J4).

---

### Sprint 4 : Loans (7 jours)

| Jour   | Dev 1 (Backend)                                  | Dev 2 (Frontend)                                               |
|--------|--------------------------------------------------|----------------------------------------------------------------|
| **J1** | Schema Prisma Loan + Migrations + Index          | Store Zustand Loans + Actions                                  |
| **J2** | Tests TDD : createLoan, confirmLoan, contestLoan | Composants UI : LoanCard, StatusBadge                          |
| **J3** | Tests TDD : updateStatus, workflow transitions   | Composants UI : LoanWizard (3 steps)                           |
| **J4** | Implémentation LoanFactory + LoanStatusMachine   | Composants UI : LoanTimeline, ConfirmationDialog               |
| **J5** | Implémentation LoanService + EventBus            | Écrans : LoanListScreen, CreateLoanScreen                      |
| **J6** | CRON Job timeout 48h (BullMQ) + Controllers      | Écrans : LoanDetailScreen, ConfirmLoanScreen, ReturnLoanScreen |
| **J7** | Tests E2E workflow complet + Review              | Deep linking + Tests Detox (flow complet)                      |

🔄 **SYNC** : Frontend bascule Loans → Backend réel (fin J7).

---

### Sprint 5 : Reminders + Notifications (5 jours)

| Jour   | Dev 1 (Backend)                                     | Dev 2 (Frontend)                                    |
|--------|-----------------------------------------------------|-----------------------------------------------------|
| **J1** | Schemas Prisma Reminder + Notification + Migrations | Setup Firebase Cloud Messaging (FCM)                |
| **J2** | Tests TDD : scheduleReminders, sendManual, cancel   | Store Zustand Notifications + Actions               |
| **J3** | Implémentation ReminderStrategy + ReminderService   | Composants UI : NotificationCard, NotificationBadge |
| **J4** | CRON Job envoi rappels (BullMQ) + FCM Push          | Écrans : NotificationListScreen, SendReminderScreen |
| **J5** | Tests E2E + Review                                  | Tests Detox + Intégration avec LoanDetailScreen     |

🔄 **SYNC** : Frontend bascule Notifications → Backend réel (fin J5).

---

### Sprint 6 : History + Dashboard (3 jours)

| Jour   | Dev 1 (Backend)                                          | Dev 2 (Frontend)                                      |
|--------|----------------------------------------------------------|-------------------------------------------------------|
| **J1** | Tests TDD : getArchivedLoans, getStatistics, trustScore  | Store Zustand History + Actions                       |
| **J2** | Implémentation HistoryService + Agrégations Prisma       | Composants UI : StatCard, PieChart, TopBorrowersList  |
| **J3** | Tests E2E complets + Documentation finale + Pact publish | Écrans : Dashboard, History, Statistics + Tests Detox |

🔄 **SYNC FINAL** : Frontend 100% Backend réel (fin J3).

---

## Points de Synchronisation Détaillés

### 🔄 SYNC 1 : Auth (Fin Sprint 1 - Jour 9)

**Backend disponible** :

- `POST /auth/register` (201 Created, 409 Email exists)
- `POST /auth/login` (200 OK, 401 Invalid credentials)
- `POST /auth/refresh` (200 OK, 401 Invalid refresh token)
- `POST /auth/logout` (204 No Content)
- `GET /auth/me` (200 OK, 401 Unauthorized)
- `PATCH /users/me` (200 OK, 409 Email taken)
- `PATCH /users/me/password` (200 OK, 401 Wrong current password)

**Action Frontend** :

```typescript
// Dans apiClient.ts
const MOCK_MODULES = {
    auth: false,      // ✅ Backend réel activé
    borrowers: true,  // Mock encore actif
    items: true,
    loans: true,
    reminders: true,
    notifications: true,
    history: true,
};
```

**Tests de Validation** :

- [ ] Test Pact : `POST /auth/login` (contrat respecté)
- [ ] Test Detox : Login → Dashboard (flow complet)
- [ ] Test Detox : Register → Dashboard
- [ ] Test Detox : Édition profil
- [ ] Gestion erreur 401 (token expiré → refresh auto)

---

### 🔄 SYNC 2 : Borrowers (Fin Sprint 2 - Jour 12)

**Backend disponible** :

- `GET /borrowers` (200 OK, pagination)
- `POST /borrowers` (201 Created, 409 Email exists)
- `GET /borrowers/{id}` (200 OK, 404 Not found)
- `PATCH /borrowers/{id}` (200 OK)
- `DELETE /borrowers/{id}` (204 No Content, 409 Active loans)
- `GET /borrowers/{id}/statistics` (200 OK)

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,      // ✅ Backend réel
    borrowers: false, // ✅ Backend réel activé
    items: true,
    loans: true,
    reminders: true,
    notifications: true,
    history: true,
};
```

**Tests de Validation** :

- [ ] Test Pact : `POST /borrowers` (contrat respecté)
- [ ] Test Detox : Créer emprunteur → Affichage dans liste
- [ ] Test Detox : Supprimer emprunteur
- [ ] Gestion erreur 409 (email existe déjà)

---

### 🔄 SYNC 3 : Items (Fin Sprint 3 - Jour 16)

**Backend disponible** :

- `GET /items` (200 OK, filtres category/available)
- `POST /items` (201 Created, 400 MONEY sans value)
- `POST /items/recognize` (200 OK OCR, 503 Service unavailable)
- `GET /items/{id}` (200 OK, 404 Not found)
- `PATCH /items/{id}` (200 OK)
- `DELETE /items/{id}` (204 No Content, 409 Currently loaned)
- `POST /items/{id}/photos` (201 Created, max 5 photos)

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,     // ✅ Backend réel activé (OCR + R2)
    loans: true,
    reminders: true,
    notifications: true,
    history: true,
};
```

**Tests de Validation** :

- [ ] Test Pact : `POST /items/recognize` (OCR format respecté)
- [ ] Test Detox : OCR → Suggestions → Création objet
- [ ] Test upload photo réel vers R2
- [ ] Gestion erreur 503 (Google Vision unavailable)

---

### 🔄 SYNC 4 : Loans (Fin Sprint 4 - Jour 23)

**Backend disponible** :

- `GET /loans` (200 OK, filtres status/borrowerId/includeArchived)
- `POST /loans` (201 Created, status PENDING_CONFIRMATION)
- `GET /loans/{id}` (200 OK avec relations)
- `PATCH /loans/{id}` (200 OK)
- `DELETE /loans/{id}` (204 No Content, 409 Already returned)
- `PATCH /loans/{id}/status` (200 OK, 400 Invalid transition)
- `POST /loans/{id}/confirm` (200 OK → ACTIVE)
- `POST /loans/{id}/contest` (200 OK → CONTESTED)

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,
    loans: false,     // ✅ Backend réel activé (workflow complet)
    reminders: true,
    notifications: true,
    history: true,
};
```

**Tests de Validation** :

- [ ] Test Pact : `POST /loans` (contrat respecté)
- [ ] Test Detox : Créer prêt → Confirmer → Retourner (flow complet)
- [ ] Test Detox : Refus de prêt (CONTESTED)
- [ ] Test transition invalide (400 Bad Request)
- [ ] Deep linking : Email confirmation → App → Confirmation

---

### 🔄 SYNC 5 : Reminders + Notifications (Fin Sprint 5 - Jour 28)

**Backend disponible** :

- `GET /loans/{id}/reminders` (200 OK)
- `POST /loans/{id}/reminders/manual` (201 Created, 429 Rate limit)
- `GET /reminders/{id}` (200 OK)
- `POST /reminders/{id}/cancel` (204 No Content, 409 Already sent)
- `GET /notifications` (200 OK, filtre unreadOnly)
- `PATCH /notifications/{id}/read` (200 OK)
- `POST /notifications/read-all` (204 No Content)

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,
    loans: false,
    reminders: false,     // ✅ Backend réel activé
    notifications: false, // ✅ Backend réel activé (FCM)
    history: true,
};
```

**Tests de Validation** :

- [ ] Test Pact : `POST /loans/{id}/reminders/manual` (contrat respecté)
- [ ] Test Detox : Envoyer rappel manuel
- [ ] Test notification push réelle (via backend FCM)
- [ ] Gestion erreur 429 (10 rappels/heure)

---

### 🔄 SYNC FINAL : History (Fin Sprint 6 - Jour 30)

**Backend disponible** :

- `GET /history/loans` (200 OK, filtres date + status)
- `GET /history/statistics` (200 OK, overview + charts)
- `GET /borrowers/{id}/statistics` (200 OK, trustScore)

**Action Frontend** :

```typescript
const MOCK_MODULES = {
    auth: false,
    borrowers: false,
    items: false,
    loans: false,
    reminders: false,
    notifications: false,
    history: false,       // ✅ Backend réel activé (100% réel)
};
```

**Tests de Validation** :

- [ ] Test Pact : `GET /history/statistics` (contrat respecté)
- [ ] Test Detox : Navigation Dashboard → Statistiques
- [ ] Test E2E complet : Register → Create Loan → Confirm → Return → Stats
- [ ] Vérification couverture code (Backend 90%, Frontend 70%)

---

## Gestion des Risques

| Risque                                   | Probabilité | Impact | Mitigation                                          | Responsable |
|------------------------------------------|-------------|--------|-----------------------------------------------------|-------------|
| **Backend en retard (bloque Frontend)**  | Moyenne     | Élevé  | Frontend utilise Mock Server (pas de blocage)       | Dev 1 & 2   |
| **OCR Google Vision quota dépassé**      | Faible      | Moyen  | Mock OCR actif en dev, fallback manual input        | Dev 1       |
| **Notifications FCM non reçues**         | Moyenne     | Moyen  | Test avec Postman → FCM, logs Winston détaillés     | Dev 1 & 2   |
| **Tests E2E Detox instables**            | Élevée      | Faible | Retry automatique (3x), isolation des tests         | Dev 2       |
| **Migration Prisma échoue en prod**      | Faible      | Élevé  | Testcontainers pour migrations, backup DB           | Dev 1       |
| **Deep linking iOS/Android divergent**   | Moyenne     | Moyen  | Tests sur émulateurs + devices réels                | Dev 2       |
| **Timeout CRON Job (48h) non déclenché** | Faible      | Moyen  | Tests unitaires avec fake clock (Jest), logs BullMQ | Dev 1       |

-----Contre Expertise--------
**Gestion des risques incomplète** :

- **Risque "Tests Detox instables" → Impact "Faible"** : Sous-estimé. Si les tests E2E sont instables, la CI est bloquée
  et personne ne peut merger. L'impact réel est **Élevé**. La mitigation "retry 3x" masque le problème sans le résoudre.

- **Risque manquant : Scope creep** : Aucune mention du risque principal d'un MVP — le dépassement de scope. L'OCR, les
  statistiques avancées (trustScore, topBorrowers, mostLoanedItems), le deep linking, et les préférences de notification
  sont autant de features qui pourraient être coupées pour tenir la deadline. Il faut définir un **scope minimal** (
  auth + borrowers + loans + rappels basiques) vs **scope complet**.

- **Risque manquant : Rejet App Store** : Pas de mention du processus de review Apple/Google. Le premier submit prend
  souvent 1-2 semaines avec des allers-retours. Prévoir ce délai dans le planning post-MVP.
  -----Fin Contre Expertise--------

---

## Checklist de Livraison MVP (Jour 30)

### ✅ Backend

- [ ] 35 endpoints fonctionnels (100% openapi.yaml)
- [ ] Couverture de tests : Domain 100%, Services 90%, Repositories 80%, Controllers 70%
- [ ] Tous les tests E2E passent (flow complet register → loan → return)
- [ ] Documentation Swagger accessible `/api/docs`
- [ ] Contrat Pact publié sur Pact Broker

-----Contre Expertise--------
**Checklist de livraison MVP : points irréalistes ou contradictoires** :

- "Domain 100%" → on a recommandé 95% (cf. 02)
- "Contrat Pact publié" → Pact est overkill (cf. 02)
- "OCR Google Vision fonctionnel" → ROI douteux pour V1 (cf. 00, 04)
- "Accessibilité testée (iOS VoiceOver + Android TalkBack)" → aucun temps alloué dans les roadmaps
- "Backup DB automatique (daily)" → aucune tâche dans les roadmaps backend
- "Monitoring (Sentry)" → pas installé dans le Sprint 0
- "DNS configuré" → pas dans les roadmaps
- "CONTRIBUTING.md créé" → temps non alloué

Plusieurs items de cette checklist ne sont couverts par **aucune tâche** dans les roadmaps 04 et 05. Soit la checklist
est aspirationnelle (et doit être indiquée comme telle), soit il faut ajouter les tâches correspondantes dans les
sprints.
-----Fin Contre Expertise--------

- [ ] CI/CD passe sur `main` (0 erreur, 0 warning)
- [ ] Logs Winston en JSON (ERROR, WARN, INFO seulement en prod)
- [ ] Rate limiting actif (login 10/15min, OCR 100/jour, reminders 10/heure)
- [ ] CRON Jobs fonctionnels (timeout 48h + envoi rappels)
- [ ] Backup DB automatique (daily)

### ✅ Frontend

- [ ] 24 écrans fonctionnels (100% UI/UX)
- [ ] Tous les tests Detox E2E passent
- [ ] Gestion d'erreurs RFC 7807 complète (toasts + modales)
- [ ] Navigation fluide (pas de lag)
- [ ] Authentification persistante (Remember Me)
- [ ] Notifications push FCM fonctionnelles
- [ ] Deep linking fonctionnel (email → app)
- [ ] Upload photos vers R2 fonctionnel
- [ ] OCR Google Vision fonctionnel
- [ ] Accessibilité testée (iOS VoiceOver + Android TalkBack)

### ✅ Infrastructure

- [ ] Backend déployé sur Fly.io (staging + production)
- [ ] PostgreSQL managé (backup actif)
- [ ] Redis managé (cache + BullMQ)
- [ ] Cloudflare R2 configuré (photos)
- [ ] Google Cloud Vision API activée (quota monitoring)
- [ ] Firebase Cloud Messaging configuré
- [ ] DNS configuré (`api.return.app`, `staging-api.return.app`)
- [ ] SSL/TLS actif (Let's Encrypt)
- [ ] Monitoring (Sentry Backend + Frontend)

### ✅ Documentation

- [ ] README.md mis à jour (instructions installation)
- [ ] CHANGELOG.md généré (Conventional Commits)
- [ ] CONTRIBUTING.md créé (guide développeurs)
- [ ] openapi.yaml validé (Spectral lint)
- [ ] Schemas Prisma documentés
- [ ] Postman Collection exportée (tests manuels)

---

## Post-MVP (Backlog V2)

| Feature                                   | Priorité | Complexité | Sprint Estimé      |
|-------------------------------------------|----------|------------|--------------------|
| **Email Notifications** (en plus de push) | Haute    | Moyenne    | Sprint 7 (3j)      |
| **SMS Reminders** (Twilio)                | Moyenne  | Moyenne    | Sprint 8 (3j)      |
| **Export CSV/PDF** (historique)           | Moyenne  | Faible     | Sprint 8 (2j)      |
| **Multi-langue** (i18n)                   | Haute    | Moyenne    | Sprint 9 (4j)      |
| **Dark Mode**                             | Faible   | Faible     | Sprint 9 (2j)      |
| **Freemium Limits** (X loans/month)       | Haute    | Moyenne    | Sprint 10 (5j)     |
| **Web Version** (React)                   | Faible   | Élevée     | Sprint 11-13 (15j) |
| **AR Object Recognition** (ARKit/ARCore)  | Faible   | Élevée     | Sprint 14-15 (10j) |

-----Contre Expertise--------
**Post-MVP : i18n et Freemium à haute priorité mais absence de pré-requis** : L'i18n (Sprint 9) est marquée "Haute"
priorité, mais aucune préparation n'est faite en V1 (pas d'extraction de chaînes, pas de bibliothèque i18n installée).
Ajouter les chaînes i18n dès le Sprint 0 (i18next / react-i18next) coûte peu et économise une migration douloureuse plus
tard. De même, le Freemium (Sprint 10) nécessitera un système de comptage de prêts/mois — autant prévoir le tracking dès
V1.
-----Fin Contre Expertise--------

---

## Calendrier Récapitulatif (30 jours)

| Semaine       | Sprints                       | Modules Livrés                      | SYNC Points                                  |
|---------------|-------------------------------|-------------------------------------|----------------------------------------------|
| **Semaine 1** | Sprint 0 (3j) + Sprint 1 (2j) | Setup + Auth partiel                | -                                            |
| **Semaine 2** | Sprint 1 (3j) + Sprint 2 (2j) | Auth complet + Borrowers partiel    | 🔄 SYNC Auth (J9)                            |
| **Semaine 3** | Sprint 2 (1j) + Sprint 3 (4j) | Borrowers complet + Items           | 🔄 SYNC Borrowers (J12), SYNC Items (J16)    |
| **Semaine 4** | Sprint 4 (5j)                 | Loans (cœur métier)                 | -                                            |
| **Semaine 5** | Sprint 4 (2j) + Sprint 5 (3j) | Loans complet + Reminders partiel   | 🔄 SYNC Loans (J23)                          |
| **Semaine 6** | Sprint 5 (2j) + Sprint 6 (3j) | Reminders + Notifications + History | 🔄 SYNC Reminders (J28), 🔄 SYNC FINAL (J30) |

---

**Date de Début** : 6 février 2026  
**Date de Livraison MVP** : 8 mars 2026  
**First Public Release** : 15 mars 2026 (TestFlight iOS + Google Play Beta)

---

**Auteur** : Return Team (Technical Project Manager & Scrum Master)
**Version** : 1.0
**Date** : 8 février 2026

---

**Contre-expertise par :** Ismael AÏHOU
**Date :** 10 février 2026
