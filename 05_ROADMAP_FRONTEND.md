# 05_ROADMAP_FRONTEND.md
**Return ↺ - Roadmap de Développement Frontend (React Native)**

---

## Stratégie de Développement (2 Développeurs)

**Approche** : Développement **MOCK-FIRST** en parallèle du Backend.

**Principe** :
1. Le Frontend utilise **Prism Mock Server** dès le Sprint 0 (pas d'attente du Backend).
2. Chaque Sprint livre des **écrans complets** connectés au mock.
3. Le **basculement mock → backend réel** se fait progressivement (1 module à la fois).
4. Les 2 développeurs avancent en parallèle sans blocage.

**Durée estimée** : 6 Sprints de 5 jours (30 jours calendaires).

---

## Sprint 0 : Setup Projet (3-4 jours)

### 🎯 Objectif
Mettre en place l'infrastructure Frontend avant tout développement fonctionnel.

### Tâches

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **SETUP-001** | Initialiser projet React Native (Expo ou React Native CLI) | - | `npx expo start` ou `npx react-native start` fonctionne | 30min |
| **SETUP-002** | Configurer TypeScript strict + ESLint + Prettier | SETUP-001 | `npm run lint` passe sans erreur | 30min |
| **SETUP-003** | Installer React Navigation 6.x (Stack + Tab Navigator) | SETUP-001 | Navigation fonctionne entre 2 écrans de test | 1h |
| **SETUP-004** | Installer Zustand (state management) | SETUP-001 | Store créé et accessible dans composants | 45min |
| **SETUP-005** | Installer React Native Paper (UI components) | SETUP-001 | Bouton + TextInput affichés avec thème | 45min |
| **SETUP-006** | Configurer Axios (HTTP client) + intercepteurs JWT | SETUP-001 | Requête authentifiée avec Bearer token | 1h30 |
| **SETUP-007** | Lancer Prism Mock Server (basé sur openapi.yaml) | - | `prism mock openapi.yaml` accessible sur http://localhost:3000 | 15min |
| **SETUP-008** | Créer service API `apiClient.ts` (basé sur Axios) avec switch mock/real | SETUP-006 | Variable `USE_MOCK=true` pointe vers Prism | 1h |
| **SETUP-009** | Configurer React Native Async Storage (persistence tokens) | SETUP-001 | Token sauvegardé et récupéré après redémarrage | 1h |
| **SETUP-010** | Setup CI/CD GitHub Actions (lint + tests Detox) | SETUP-002 | Pipeline passe sur `main` et `develop` | 1h30 |

**Livrable Sprint 0** : 🚀 App démarrable avec navigation + mock API fonctionnel.

---

## Sprint 1 : Module Auth + Profil (5 jours)

### 🎯 Objectif
Authentification complète + Édition de profil. **Se connecte au Mock Server immédiatement.**

### Phase 1.1 : Gestion d'État (Zustand Store) (Jour 1)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-001** | Créer `useAuthStore` (state: user, accessToken, isAuthenticated) | SETUP-004 | Store créé avec actions login/logout | 1h |
| **AUTH-002** | Créer action `login(email, password)` (appelle `/auth/login`) | AUTH-001, SETUP-008 | Action fonctionnelle (appelle mock API) | 1h30 |
| **AUTH-003** | Créer action `register(email, password, firstName, lastName)` | AUTH-001 | Action fonctionnelle (appelle mock API) | 1h |
| **AUTH-004** | Créer action `logout()` (supprime token + reset state) | AUTH-001 | Action efface token en AsyncStorage | 45min |
| **AUTH-005** | Créer action `refreshToken()` (appelle `/auth/refresh` si token expiré) | AUTH-001 | Token rafraîchi automatiquement via intercepteur Axios | 1h30 |

### Phase 1.2 : Composants UI (Dumb) (Jour 2)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-006** | Créer composant `LoginForm` (email + password + bouton) | SETUP-005 | Formulaire affiché, validation basic | 1h |
| **AUTH-007** | Créer composant `RegisterForm` (email + password + firstName + lastName) | SETUP-005 | Formulaire affiché, validation mot de passe fort | 1h30 |
| **AUTH-008** | Créer composant `ProfileCard` (affichage infos user) | SETUP-005 | Card affiche firstName, lastName, email | 45min |
| **AUTH-009** | Créer composant `EditProfileForm` (édition firstName/lastName) | SETUP-005 | Formulaire éditable avec bouton "Sauvegarder" | 1h |
| **AUTH-010** | Créer composant `ChangePasswordForm` (ancien + nouveau mot de passe) | SETUP-005 | Formulaire avec validation | 1h |

### Phase 1.3 : Écrans (Smart Components) (Jour 3)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-011** | Créer écran `LoginScreen` (connecte LoginForm au store) | AUTH-002, AUTH-006 | Connexion réussie redirige vers Dashboard | 1h |
| **AUTH-012** | Créer écran `RegisterScreen` (connecte RegisterForm au store) | AUTH-003, AUTH-007 | Inscription réussie redirige vers Dashboard | 1h |
| **AUTH-013** | Créer écran `ProfileScreen` (affiche ProfileCard + bouton "Éditer") | AUTH-001, AUTH-008 | Affiche infos utilisateur connecté | 45min |
| **AUTH-014** | Créer écran `EditProfileScreen` (connecte EditProfileForm au store) | AUTH-009 | Sauvegarde mise à jour profil via API mock | 1h |
| **AUTH-015** | Créer écran `ChangePasswordScreen` (connecte ChangePasswordForm au store) | AUTH-010 | Change mot de passe via API mock | 1h |

### Phase 1.4 : Navigation + Guards (Jour 4)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-016** | Configurer Stack Navigator Auth (Login → Register) | SETUP-003, AUTH-011, AUTH-012 | Navigation fonctionnelle entre Login et Register | 30min |
| **AUTH-017** | Configurer Stack Navigator App (Dashboard → Profile → EditProfile → ChangePassword) | SETUP-003, AUTH-013, AUTH-014, AUTH-015 | Navigation fonctionnelle dans l'app | 45min |
| **AUTH-018** | Créer `AuthGuard` (redirect vers Login si pas authentifié) | AUTH-001, SETUP-003 | Accès à Dashboard impossible sans login | 1h |
| **AUTH-019** | Implémenter "Remember Me" (persist token en AsyncStorage) | SETUP-009, AUTH-002 | Token persiste après redémarrage app | 1h |
| **AUTH-020** | Gérer refresh automatique du token (via intercepteur Axios) | AUTH-005, SETUP-006 | Token expiré → refresh automatique → requête rejouée | 1h30 |

### Phase 1.5 : Tests + Gestion d'Erreurs (Jour 5)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **AUTH-021** | Afficher erreur RFC 7807 si login échoue (401 ou 400) | AUTH-011 | Message "Email ou mot de passe incorrect" affiché | 1h |
| **AUTH-022** | Afficher erreur si email déjà utilisé lors de register (409) | AUTH-012 | Message "Cet email est déjà utilisé" affiché | 45min |
| **AUTH-023** | Écrire test Detox : Flow login → Dashboard | AUTH-018 | Test E2E passe ✅ | 1h30 |
| **AUTH-024** | Écrire test Detox : Flow register → Dashboard | AUTH-018 | Test E2E passe ✅ | 1h |
| **AUTH-025** | Écrire test Detox : Édition profil | AUTH-014 | Test E2E passe ✅ | 1h |

**Livrable Sprint 1** : 🎉 **Authentification + Profil complets** (connectés au Mock Server).

---

## Sprint 2 : Module Borrowers (3 jours)

### 🎯 Objectif
CRUD complet des contacts (emprunteurs). **Simple liste + formulaire.**

### Phase 2.1 : Gestion d'État (Zustand Store)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-001** | Créer `useBorrowerStore` (state: borrowers[], selectedBorrower) | SETUP-004 | Store créé avec actions CRUD | 1h |
| **BORR-002** | Créer actions `fetchBorrowers()`, `createBorrower()`, `updateBorrower()`, `deleteBorrower()` | BORR-001 | Actions appellent API mock | 2h |

### Phase 2.2 : Composants UI (Dumb)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-003** | Créer composant `BorrowerCard` (affichage firstName, lastName, email) | SETUP-005 | Card affichée dans liste | 45min |
| **BORR-004** | Créer composant `BorrowerForm` (création/édition emprunteur) | SETUP-005 | Formulaire avec validation email | 1h30 |
| **BORR-005** | Créer composant `BorrowerStatsBadge` (trustScore + nb prêts) | SETUP-005 | Badge coloré selon trustScore | 1h |

### Phase 2.3 : Écrans (Smart Components)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-006** | Créer écran `BorrowerListScreen` (FlatList de BorrowerCard) | BORR-002, BORR-003 | Liste paginée avec bouton "+ Nouveau" | 1h30 |
| **BORR-007** | Créer écran `CreateBorrowerScreen` (BorrowerForm) | BORR-002, BORR-004 | Création d'emprunteur via API mock | 1h |
| **BORR-008** | Créer écran `BorrowerDetailScreen` (stats + bouton "Éditer" + "Supprimer") | BORR-002, BORR-005 | Détails emprunteur affichés | 1h |
| **BORR-009** | Créer écran `EditBorrowerScreen` (BorrowerForm pré-rempli) | BORR-002, BORR-004 | Mise à jour emprunteur via API mock | 1h |

### Phase 2.4 : Navigation + Tests

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **BORR-010** | Ajouter onglet "Contacts" dans Tab Navigator | SETUP-003, BORR-006 | Onglet accessible depuis Dashboard | 30min |
| **BORR-011** | Gérer erreur 409 si email emprunteur existe déjà | BORR-007 | Message "Email déjà utilisé" affiché | 45min |
| **BORR-012** | Écrire test Detox : Créer emprunteur | BORR-007 | Test E2E passe ✅ | 1h |
| **BORR-013** | Écrire test Detox : Supprimer emprunteur | BORR-008 | Test E2E passe ✅ | 1h |

**Livrable Sprint 2** : 🎉 **Gestion des contacts complète** (connectée au Mock Server).

---

## Sprint 3 : Module Items (OCR + Photos) (4 jours)

### 🎯 Objectif
Enregistrement d'objets avec reconnaissance automatique (OCR) + upload photos.

### Phase 3.1 : Gestion d'État (Zustand Store)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-001** | Créer `useItemStore` (state: items[], selectedItem) | SETUP-004 | Store créé avec actions CRUD | 1h |
| **ITEM-002** | Créer actions `fetchItems()`, `createItem()`, `recognizeItem(photo)`, `uploadPhotos()`, `deleteItem()` | ITEM-001 | Actions appellent API mock | 2h30 |

### Phase 3.2 : Composants UI (Dumb)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-003** | Créer composant `ItemCard` (photo + nom + catégorie + valeur) | SETUP-005 | Card affichée dans liste | 1h |
| **ITEM-004** | Créer composant `ItemForm` (création manuelle avec sélecteur catégorie) | SETUP-005 | Formulaire avec dropdown ItemCategory | 1h30 |
| **ITEM-005** | Créer composant `PhotoPicker` (sélection photo via ImagePicker) | SETUP-001 | Bouton "Prendre une photo" fonctionne | 1h30 |
| **ITEM-006** | Créer composant `RecognitionResults` (affichage suggestions OCR) | SETUP-005 | Liste de suggestions avec bouton "Sélectionner" | 1h |
| **ITEM-007** | Créer composant `PhotoGallery` (carousel de photos de l'objet, max 5) | SETUP-005 | Swiper affiche photos avec bouton "+" pour ajouter | 1h30 |

### Phase 3.3 : Écrans (Smart Components)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-008** | Créer écran `ItemListScreen` (FlatList de ItemCard avec filtres category) | ITEM-002, ITEM-003 | Liste filtrée avec bouton "+ Nouveau" | 1h30 |
| **ITEM-009** | Créer écran `CreateItemManualScreen` (ItemForm) | ITEM-002, ITEM-004 | Création manuelle via API mock | 1h |
| **ITEM-010** | Créer écran `RecognizeItemScreen` (PhotoPicker + RecognitionResults) | ITEM-002, ITEM-005, ITEM-006 | Photo envoyée → suggestions affichées (mock OCR) | 2h |
| **ITEM-011** | Créer écran `ItemDetailScreen` (PhotoGallery + infos + boutons) | ITEM-002, ITEM-007 | Détails objet affichés | 1h |
| **ITEM-012** | Créer écran `EditItemScreen` (ItemForm pré-rempli) | ITEM-002, ITEM-004 | Mise à jour objet via API mock | 1h |

### Phase 3.4 : Navigation + Tests

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **ITEM-013** | Ajouter onglet "Objets" dans Tab Navigator | SETUP-003, ITEM-008 | Onglet accessible | 30min |
| **ITEM-014** | Gérer erreur 400 si category=MONEY sans estimatedValue | ITEM-009 | Message "Montant obligatoire pour MONEY" affiché | 45min |
| **ITEM-015** | Gérer erreur 503 si Google Vision unavailable (OCR) | ITEM-010 | Message "Service temporairement indisponible" affiché | 45min |
| **ITEM-016** | Écrire test Detox : Créer objet manuellement | ITEM-009 | Test E2E passe ✅ | 1h |
| **ITEM-017** | Écrire test Detox : Reconnaître objet via photo | ITEM-010 | Test E2E passe ✅ | 1h30 |

**Livrable Sprint 3** : 🎉 **Enregistrement d'objets avec OCR** (connecté au Mock Server).

---

## Sprint 4 : Module Loans (Cœur Métier) (7 jours)

### 🎯 Objectif
Gestion complète du cycle de vie des prêts (création, confirmation, suivi, clôture).

### Phase 4.1 : Gestion d'État (Zustand Store)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-001** | Créer `useLoanStore` (state: loans[], filters, selectedLoan) | SETUP-004 | Store créé avec actions CRUD | 1h30 |
| **LOAN-002** | Créer actions `fetchLoans(filters)`, `createLoan()`, `confirmLoan()`, `contestLoan()`, `updateStatus()` | LOAN-001 | Actions appellent API mock | 3h |

### Phase 4.2 : Composants UI (Dumb) (Jours 1-2)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-003** | Créer composant `LoanCard` (photo objet + nom + emprunteur + status badge) | SETUP-005 | Card affichée dans liste | 1h30 |
| **LOAN-004** | Créer composant `StatusBadge` (PENDING_CONFIRMATION en orange, ACTIVE en vert, AWAITING_RETURN en rouge, etc.) | SETUP-005 | Badge coloré selon status | 1h |
| **LOAN-005** | Créer composant `LoanWizard` (step 1: sélection objet, step 2: sélection emprunteur, step 3: date retour + notes) | SETUP-005 | Wizard 3 étapes fonctionnel | 3h |
| **LOAN-006** | Créer composant `LoanTimeline` (affichage historique statuts) | SETUP-005 | Timeline verticale avec dates | 2h |
| **LOAN-007** | Créer composant `ConfirmationDialog` (pour emprunteur : "Accepter" / "Refuser") | SETUP-005 | Dialog modale avec 2 boutons | 1h |

### Phase 4.3 : Écrans (Smart Components) (Jours 3-4)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-008** | Créer écran `LoanListScreen` (FlatList de LoanCard avec filtres status + onglets "En cours" / "Archivés") | LOAN-002, LOAN-003, LOAN-004 | Liste filtrée avec bouton "+ Nouveau prêt" | 2h |
| **LOAN-009** | Créer écran `CreateLoanScreen` (LoanWizard) | LOAN-002, LOAN-005 | Création prêt via API mock (objet + emprunteur inline ou existant) | 2h30 |
| **LOAN-010** | Créer écran `LoanDetailScreen` (infos complètes + LoanTimeline + boutons actions selon status) | LOAN-002, LOAN-006 | Affichage détails + actions contextuelles | 2h |
| **LOAN-011** | Créer écran `ConfirmLoanScreen` (pour emprunteur : ConfirmationDialog) | LOAN-002, LOAN-007 | Confirmation → status ACTIVE, Refus → status CONTESTED | 1h30 |
| **LOAN-012** | Créer écran `ReturnLoanScreen` (bouton "Confirmer le retour") | LOAN-002 | Changement status → RETURNED via API mock | 1h |

### Phase 4.4 : Navigation + Workflow (Jour 5)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-013** | Ajouter onglet "Prêts" dans Tab Navigator (écran par défaut) | SETUP-003, LOAN-008 | Onglet accessible | 30min |
| **LOAN-014** | Implémenter deep linking pour confirmation emprunteur (lien email → app → ConfirmLoanScreen) | LOAN-011 | Lien `return://loans/{id}/confirm` fonctionne | 2h |
| **LOAN-015** | Afficher boutons conditionnels selon status (ex: bouton "Envoyer rappel" si AWAITING_RETURN) | LOAN-010 | Boutons corrects selon machine à états | 1h30 |

### Phase 4.5 : Tests (Jours 6-7)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **LOAN-016** | Gérer erreur 400 si returnDate < today | LOAN-009 | Message "Date de retour invalide" affiché | 45min |
| **LOAN-017** | Écrire test Detox : Flow complet (créer prêt → confirmer → retourner) | LOAN-012 | Test E2E passe ✅ | 2h |
| **LOAN-018** | Écrire test Detox : Refus de prêt par emprunteur | LOAN-011 | Test E2E passe ✅ | 1h30 |
| **LOAN-019** | Écrire test Detox : Filtrage par status | LOAN-008 | Test E2E passe ✅ | 1h |

**Livrable Sprint 4** : 🎉 **Gestion complète des prêts** (workflow 7 statuts connecté au Mock Server).

---

## Sprint 5 : Module Notifications + Reminders (5 jours)

### 🎯 Objectif
Recevoir notifications push + Envoyer rappels manuels.

### Phase 5.1 : Setup Notifications (Jour 1)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **NOTIF-001** | Installer Firebase Cloud Messaging (FCM) SDK | SETUP-001 | FCM initialisé, token device récupéré | 2h |
| **NOTIF-002** | Configurer gestion des notifications foreground/background | NOTIF-001 | Notification affichée même si app ouverte | 1h30 |
| **NOTIF-003** | Créer service `notificationService.ts` (subscribe/unsubscribe topics) | NOTIF-001 | Service créé | 1h |

### Phase 5.2 : Gestion d'État (Zustand Store)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **NOTIF-004** | Créer `useNotificationStore` (state: notifications[], unreadCount) | SETUP-004 | Store créé | 1h |
| **NOTIF-005** | Créer actions `fetchNotifications()`, `markAsRead()`, `markAllAsRead()` | NOTIF-004 | Actions appellent API mock | 1h30 |
| **NOTIF-006** | Créer action `sendManualReminder(loanId, message?)` | NOTIF-004 | Action appelle API mock | 1h |

### Phase 5.3 : Composants UI (Dumb) (Jour 2)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **NOTIF-007** | Créer composant `NotificationCard` (affichage notif avec badge "non lu") | SETUP-005 | Card affichée dans liste | 1h |
| **NOTIF-008** | Créer composant `NotificationBadge` (badge rouge avec count sur icône) | SETUP-005 | Badge affiché dans header | 45min |
| **NOTIF-009** | Créer composant `ReminderForm` (message personnalisé optionnel) | SETUP-005 | Formulaire avec textarea + bouton "Envoyer" | 1h |

### Phase 5.4 : Écrans (Smart Components) (Jour 3)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **NOTIF-010** | Créer écran `NotificationListScreen` (FlatList de NotificationCard avec filtre unreadOnly) | NOTIF-005, NOTIF-007 | Liste paginée avec bouton "Tout marquer comme lu" | 1h30 |
| **NOTIF-011** | Créer écran `SendReminderScreen` (ReminderForm) | NOTIF-006, NOTIF-009 | Envoi rappel manuel via API mock | 1h |
| **NOTIF-012** | Ajouter NotificationBadge dans header | NOTIF-005, NOTIF-008 | Badge mis à jour en temps réel | 1h |

### Phase 5.5 : Intégration + Tests (Jours 4-5)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **NOTIF-013** | Ajouter bouton "Envoyer un rappel" dans LoanDetailScreen | LOAN-010, NOTIF-011 | Bouton redirige vers SendReminderScreen | 45min |
| **NOTIF-014** | Gérer erreur 429 si > 10 rappels/heure | NOTIF-011 | Message "Limite de 10 rappels par heure atteinte" affiché | 45min |
| **NOTIF-015** | Simuler réception notification push (via Postman → FCM) | NOTIF-002 | Notification reçue et affichée | 1h |
| **NOTIF-016** | Écrire test Detox : Marquer notification comme lue | NOTIF-010 | Test E2E passe ✅ | 1h |
| **NOTIF-017** | Écrire test Detox : Envoyer rappel manuel | NOTIF-011 | Test E2E passe ✅ | 1h30 |

**Livrable Sprint 5** : 🎉 **Notifications push + Rappels manuels** (connectés au Mock Server).

---

## Sprint 6 : Module History + Dashboard (3 jours)

### 🎯 Objectif
Statistiques + Historique archivé + Écran Dashboard avec overview.

### Phase 6.1 : Gestion d'État (Zustand Store)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-001** | Créer `useHistoryStore` (state: archivedLoans[], statistics) | SETUP-004 | Store créé | 1h |
| **HIST-002** | Créer actions `fetchArchivedLoans(filters)`, `fetchStatistics()` | HIST-001 | Actions appellent API mock | 1h30 |

### Phase 6.2 : Composants UI (Dumb)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-003** | Créer composant `StatCard` (KPI : nb prêts actifs, taux de retour, etc.) | SETUP-005 | Card avec chiffre + icône | 1h |
| **HIST-004** | Créer composant `PieChart` (répartition par catégorie via Victory Native) | SETUP-001 | Graphique circulaire affiché | 2h |
| **HIST-005** | Créer composant `TopBorrowersList` (top 5 emprunteurs les plus fréquents) | SETUP-005 | Liste avec trustScore badge | 1h |

### Phase 6.3 : Écrans (Smart Components)

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-006** | Créer écran `DashboardScreen` (4 StatCard + PieChart + boutons rapides) | HIST-002, HIST-003, HIST-004 | Dashboard complet affiché | 2h |
| **HIST-007** | Créer écran `HistoryScreen` (liste archivedLoans avec filtres date + status) | HIST-002 | Liste paginée avec filtres | 1h30 |
| **HIST-008** | Créer écran `StatisticsScreen` (StatCards + PieChart + TopBorrowersList) | HIST-002, HIST-003, HIST-004, HIST-005 | Statistiques complètes affichées | 2h |

### Phase 6.4 : Navigation + Tests

| ID | Titre | Dépendance | Critère de Fin | Temps |
|----|-------|------------|----------------|-------|
| **HIST-009** | Ajouter onglet "Historique" dans Tab Navigator | SETUP-003, HIST-007 | Onglet accessible | 30min |
| **HIST-010** | Définir DashboardScreen comme écran par défaut après login | AUTH-018, HIST-006 | Dashboard affiché après login | 30min |
| **HIST-011** | Écrire test Detox : Navigation vers Statistiques | HIST-008 | Test E2E passe ✅ | 1h |

**Livrable Sprint 6** : 🎉 **Dashboard + Statistiques + Historique** (connectés au Mock Server).

---

## Basculement Mock → Backend Réel

### Stratégie de Basculement Progressif

**Principe** : Ne pas tout basculer d'un coup. Activer module par module.

| Sprint Backend Terminé | Module à Basculer | Action Frontend | Temps |
|------------------------|-------------------|-----------------|-------|
| **Sprint 1 (Auth)** | Auth + Users | `USE_MOCK=false` pour endpoints `/auth/*` et `/users/*` | 1h |
| **Sprint 2 (Borrowers)** | Borrowers | `USE_MOCK=false` pour endpoints `/borrowers/*` | 30min |
| **Sprint 3 (Items)** | Items | `USE_MOCK=false` pour endpoints `/items/*` | 1h (tester upload réel) |
| **Sprint 4 (Loans)** | Loans | `USE_MOCK=false` pour endpoints `/loans/*` | 1h30 (tester workflow statuts) |
| **Sprint 5 (Reminders)** | Reminders + Notifications | `USE_MOCK=false` pour endpoints `/reminders/*` + `/notifications/*` | 1h30 (tester push réel) |
| **Sprint 6 (History)** | History | `USE_MOCK=false` pour endpoints `/history/*` | 30min |

**Implémentation dans `apiClient.ts`** :
```typescript
const MOCK_MODULES = {
  auth: false,        // Backend réel activé
  borrowers: false,   // Backend réel activé
  items: true,        // Mock encore actif
  loans: true,        // Mock encore actif
  reminders: true,    // Mock encore actif
  notifications: true,// Mock encore actif
  history: true,      // Mock encore actif
};

export const API_BASE_URL = (endpoint: string) => {
  const module = endpoint.split('/')[1]; // Ex: /auth/login → 'auth'
  
  if (MOCK_MODULES[module]) {
    return __DEV__ ? 'http://localhost:3000/v1' : 'https://mock.return.app/v1';
  } else {
    return __DEV__ ? 'http://localhost:3001/v1' : 'https://api.return.app/v1';
  }
};
```

**Checklist de Basculement** :
- [ ] Tests de contrat Pact passent (contrat respecté)
- [ ] Tests E2E Detox rejoués avec backend réel
- [ ] Gestion d'erreurs testée (401, 403, 404, 409, 429, 500)
- [ ] Upload de photos testé (si module Items)
- [ ] Notifications push testées (si module Reminders)

---

## Résumé des Sprints Frontend

| Sprint | Durée | Modules | Écrans livrés | Tests E2E |
|--------|-------|---------|---------------|-----------|
| **Sprint 0** | 3-4 jours | Setup infrastructure | 0 | ✅ CI/CD |
| **Sprint 1** | 5 jours | Auth + Profil | 5 (Login, Register, Profile, EditProfile, ChangePassword) | ✅ 3 tests |
| **Sprint 2** | 3 jours | Borrowers | 4 (List, Create, Detail, Edit) | ✅ 2 tests |
| **Sprint 3** | 4 jours | Items | 5 (List, CreateManual, Recognize, Detail, Edit) | ✅ 2 tests |
| **Sprint 4** | 7 jours | Loans | 5 (List, Create, Detail, Confirm, Return) | ✅ 3 tests |
| **Sprint 5** | 5 jours | Notifications + Reminders | 2 (NotificationList, SendReminder) | ✅ 2 tests |
| **Sprint 6** | 3 jours | Dashboard + History | 3 (Dashboard, History, Statistics) | ✅ 1 test |
| **TOTAL** | **30 jours** | **7 modules** | **24 écrans** | **✅ 13+ tests** |

---

## Points de Synchronisation Frontend/Backend

| Moment | Frontend bascule vers | Backend disponible |
|--------|----------------------|-------------------|
| **Fin Sprint 1 Backend** | Auth + Users réel | `/auth/*` + `/users/me` |
| **Fin Sprint 2 Backend** | Borrowers réel | `/borrowers/*` |
| **Fin Sprint 3 Backend** | Items réel (OCR + R2) | `/items/*` |
| **Fin Sprint 4 Backend** | Loans réel (workflow complet) | `/loans/*` |
| **Fin Sprint 5 Backend** | Notifications réelles (FCM) | `/reminders/*` + `/notifications/*` |
| **Fin Sprint 6 Backend** | History réel | `/history/*` |

---

## Checklist de Fin de Sprint

À valider avant de passer au sprint suivant :

- [ ] Tous les écrans sont accessibles et navigables
- [ ] Tous les tests Detox E2E passent
- [ ] Gestion d'erreurs RFC 7807 implémentée (toasts ou modales)
- [ ] Formulaires validés côté client (react-hook-form)
- [ ] Code review approuvé (2 approvals)
- [ ] CI/CD passe sur `develop` et `main`
- [ ] Tests de contrat Pact exécutés (si backend disponible)
- [ ] Accessibilité testée (screen readers, contraste)

---

**Auteur** : Return Team (Frontend)  
**Version** : 1.0  
**Date** : 8 février 2026
