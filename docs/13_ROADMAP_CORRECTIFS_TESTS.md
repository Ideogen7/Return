# 13_ROADMAP_CORRECTIFS_TESTS.md

**Return ↺ — Roadmap de Correctifs · Session Tests Terrain**

> **Date** : 22 juin 2026
> **Source** : Session de tests terrain — notes croisées et dédupliquées par **Ismael (front)** et **Ozias (back)**
> **Phase** : Pré-production — backend déployé sur Fly.io (`return-api.fly.dev`), frontend branché dessus
> **Périmètre** : **Front** = Ismael · **Back** = Ozias
> **Complète** : `11_CORRECTIFS_PREPROD.md` (CORR-01→CORR-14, audit du 20/06/2026). Ce document ne duplique pas les fiches CORR — il les référence explicitement quand un FIX en dépend.

### Liens avec le backlog CORR existant

| Sujet FIX | Lien CORR |
|---|---|
| FIX-01/02 — Photos (upload + stockage éphémère) | Dépend de **CORR-02** (R2) — voir `11_CORRECTIFS_PREPROD.md` |
| FIX-05 — Workflow prêt < 3 jours (CRON) | Dépend de **CORR-01** (scale-to-zero) |
| FIX-14 — Stats front recalcule / endpoint orphelin | Lien **CORR-08** (History/Statistics non consommés) |

### Légende gravité

| Symbole | Niveau | Définition |
|---|---|---|
| 🔴 | Critique | Casse une fonctionnalité cœur ou rend les tests terrain non fiables |
| 🟠 | Majeur | Impact notable en production, à traiter avant la mise en ligne publique |
| 🟡 | Mineur | Dette technique ou UX dégradée, peut attendre un sprint dédié |

---

## Tableau récapitulatif

| ID | Titre | Gravité | Périmètre / Qui | Effort | Statut |
|---|---|---|---|---|---|
| FIX-01 | Photos objets : upload ET GET KO | 🔴 Critique | Back (Ozias) + Front (Ismael, vérif) | M | ☐ |
| FIX-02 | Photo de profil ajoutée non affichée | 🔴 Critique | Back (Ozias) + Front (Ismael, vérif) | M (mutualisé FIX-01) | ☐ |
| FIX-03 | Date de retour obligatoire | 🟠 Majeur | Les deux | XS | ☐ |
| FIX-04 | Objet déjà prêté reste re-prêtable | 🟠 Majeur | Les deux | M | ☐ |
| FIX-05 | Workflow prêt < 3 jours | 🟠 Majeur | Back (Ozias) | M | ☐ |
| FIX-06 | Stats : prêts CONTESTÉS comptés comme actifs | 🟠 Majeur | Front (Ismael) | XS | ☐ |
| FIX-07 | Stats figées / "s'affichent quand elles veulent" | 🟠 Majeur | Front (Ismael) | S | ☐ |
| FIX-08 | Mise à jour d'un prêt non reflétée dans les stats | 🟠 Majeur | Front (Ismael) | M | ☐ |
| FIX-09 | Email d'un contact ne doit pas être modifiable | 🟠 Majeur | Les deux | S | ☐ |
| FIX-10 | Format de date incohérent selon la machine | 🟠 Majeur | Front (Ismael) | XS | ☐ |
| FIX-11 | Champ "Contact" non dynamique lors d'un prêt | 🟡 Mineur | Front (Ismael) | S | ☐ |
| FIX-12 | Timeline affiche "Invalid Date" pour prêt sans échéance | 🟡 Mineur | Front (Ismael) | XS | ☐ |
| FIX-13 | Renommer un contact (impossible aujourd'hui) | 🟡 Mineur | Les deux (back d'abord) | M | ☐ |
| FIX-14 | Front recalcule les stats / endpoint `/history/statistics` jamais consommé | 🟡 Mineur | Les deux (surtout Front) | M | ☐ |
| FIX-15 | Synchronisation des stats inter-comptes | 🟡 Mineur | Back (Ozias) — filet MVP | S | ☐ |
| FIX-16 | Temps réel (websockets) | 🟡 Mineur | Back + Front — POST-MVP | M→L | ☐ |

---

## 🔴 Critique

### FIX-01 — Photos objets : upload ET GET KO

- **Gravité** : 🔴 Critique
- **Périmètre** : Back (Ozias) — correctif principal ; Front (Ismael) — vérification affichage
- **Effort** : M
- **Fichier(s) & preuve** :
    - `backend/src/photos/local-photo-storage.service.ts:23` → `UPLOAD_BASE_URL` défaut `http://localhost:3000/uploads`, jamais surchargé en prod
    - `backend/src/main.ts:45` → `useStaticAssets('/uploads')` — route locale uniquement
    - `backend/src/items/items.service.ts:228` — URL construite depuis la constante non configurée
    - `frontend/src/screens/items/CreateItemScreen.tsx:49` — envoi photo vers l'API
    - `frontend/src/stores/useItemStore.ts:124` — réception et stockage de l'URL photo
    - `frontend/src/components/items/PhotoGallery.tsx:32` — rendu de l'URL reçue
- **Problème** : l'URL renvoyée par le backend pointe vers `localhost:3000`, inaccessible depuis le client en prod. De plus, le stockage disque Fly.io est éphémère : toutes les photos uploadées sont perdues à chaque redéploiement.
- **Action Back (Ozias)** :
    1. *Court terme* — configurer `UPLOAD_BASE_URL=https://return-api.fly.dev/uploads` via `fly secrets set`
    2. *Fond* — implémenter `R2PhotoStorageService` (voir **CORR-02** dans `11_CORRECTIFS_PREPROD.md`) pour la persistance réelle
- **Action Front (Ismael)** : vérifier que `PhotoGallery` affiche bien l'URL absolue renvoyée par le backend (pas de reconstruction côté client). Aucune reconstruction locale si l'URL est déjà absolue.
- **Statut** : ☐ À faire

---

### FIX-02 — Photo de profil ajoutée non affichée

- **Gravité** : 🔴 Critique
- **Périmètre** : Back (Ozias) — même racine que FIX-01 ; Front (Ismael) — vérification affichage
- **Effort** : M (mutualisé avec FIX-01 — même correctif backend)
- **Fichier(s) & preuve** :
    - `frontend/src/screens/profile/ProfileScreen.tsx:31` — affichage avatar
    - `frontend/src/stores/useAuthStore.ts:142-151` — stockage URL avatar après upload
    - `frontend/src/components/profile/ProfileCard.tsx:21` — rendu de l'avatar
    - `backend/src/users/users.controller.ts:125` — endpoint upload avatar
    - `backend/src/users/users.service.ts:258` — construction URL avatar
- **Problème** : même cause que FIX-01 — `UPLOAD_BASE_URL` non configuré en prod, URL renvoyée pointe `localhost`. L'avatar uploadé s'affiche en erreur ou pas du tout.
- **Action Back (Ozias)** : identique FIX-01 — le correctif `UPLOAD_BASE_URL` couvre aussi les avatars.
- **Action Front (Ismael)** : vérifier que `ProfileCard` consomme l'URL absolue stockée dans `useAuthStore` sans la reconstruire.
- **Statut** : ☐ À faire

---

## 🟠 Majeur

### FIX-03 — Date de retour obligatoire

- **Gravité** : 🟠 Majeur
- **Périmètre** : Les deux
- **Effort** : XS
- **Fichier(s) & preuve** :
    - `backend/src/loans/dto/create-loan.dto.ts:22` → `@IsOptional()` + `returnDate?: string | null`
    - `frontend/src/components/loans/LoanWizard.tsx:90` → `returnDate: returnDate || null`
    - `frontend/src/components/loans/LoanWizard.tsx:72` (environ) → garde `canNext()` step 4 ne bloque pas sur date absente
- **Problème** : le DTO back accepte un prêt sans date de retour, et le wizard front ne bloque pas la progression. Cela contourne la politique de rappels (qui repose sur `returnDate`) et génère des prêts orphelins sans échéance.
- **Action Back (Ozias)** : retirer `@IsOptional()` du champ `returnDate` dans `create-loan.dto.ts` — rendre la date obligatoire (400 si absente).
- **Action Front (Ismael)** : rendre le champ date obligatoire dans le wizard (bloquer `canNext()` si `returnDate` est vide) + message de validation visible.
- **Statut** : ☐ À faire

---

### FIX-04 — Objet déjà prêté reste re-prêtable

- **Gravité** : 🟠 Majeur
- **Périmètre** : Les deux
- **Effort** : M
- **Fichier(s) & preuve** :
    - `backend/src/loans/loans.service.ts:47-142` → `create()` sans vérification d'un prêt actif existant sur l'`itemId`
    - `frontend/src/screens/loans/CreateLoanScreen.tsx:25` → `fetchItems()` sans filtre `available: true`
    - `frontend/src/screens/loans/CreateLoanScreen.tsx:149` (environ) → liste affiche tous les objets sans distinction
- **Problème** : rien n'empêche de créer deux prêts simultanés pour le même objet. Les données sont incohérentes et les rappels se déclenchent en double.
- **Action Back (Ozias)** : dans `loans.service.ts > create()`, vérifier qu'aucun prêt avec un statut actif (`PENDING_CONFIRMATION`, `ACTIVE`, `ACTIVE_BY_DEFAULT`, `AWAITING_RETURN`) n'existe déjà pour l'`itemId` → retourner 409 Conflict si c'est le cas.
- **Action Front (Ismael)** : appeler `GET /items?available=true` (ou filtrer côté store) pour ne proposer que les objets disponibles dans le sélecteur du wizard. Griser ou masquer les objets déjà prêtés.
- **Statut** : ☐ À faire

---

### FIX-05 — Workflow prêt < 3 jours

- **Gravité** : 🟠 Majeur
- **Périmètre** : Back (Ozias)
- **Effort** : M
- **Lien CORR** : dépend de **CORR-01** (scale-to-zero) — `11_CORRECTIFS_PREPROD.md`
- **Fichier(s) & preuve** :
    - `backend/src/loans/loans-cron.service.ts:27-66` → auto-confirm 48h post-création, sans vérification de `returnDate`
    - `backend/src/loans/loan-status-machine.ts:28-30` → transition `ACTIVE → AWAITING_RETURN` définie mais jamais déclenchée automatiquement
- **Problème** : un prêt dont l'échéance est dans moins de 48h est auto-confirmé (`ACTIVE_BY_DEFAULT`) après que sa date de retour est déjà passée — il ne bascule jamais en `AWAITING_RETURN`. Aucun CRON ne surveille l'échéance pour déclencher cette transition.
- **Action Back (Ozias)** :
    1. Ajouter un CRON (ex. toutes les heures) qui bascule en `AWAITING_RETURN` les prêts `ACTIVE`/`ACTIVE_BY_DEFAULT` dont `returnDate < now`
    2. Ajuster la logique d'auto-confirm pour ne pas confirmer un prêt dont la `returnDate` est déjà passée
    3. Résoudre **CORR-01** en parallèle (sinon ce CRON ne tourne pas non plus)
- **Action Front** : aucune — comportement piloté par le backend.
- **Statut** : ☐ À faire

---

### FIX-06 — Stats : prêts CONTESTÉS comptés comme actifs

- **Gravité** : 🟠 Majeur
- **Périmètre** : Front (Ismael)
- **Effort** : XS
- **Fichier(s) & preuve** :
    - `frontend/src/components/profile/LenderStats.tsx:8-14` → `ACTIVE_STATUSES` inclut `'CONTESTED'`
    - `frontend/src/components/profile/LenderStats.tsx:41` — filtre appliqué sur cette constante
    - `backend/src/history/history.service.ts:173-196` — le backend calcule correctement (CONTESTED n'est pas dans les actifs)
- **Problème** : le frontend comptabilise les prêts contestés comme des prêts actifs, gonflant artificiellement le compteur affiché dans le profil.
- **Action Front (Ismael)** : retirer `'CONTESTED'` de `ACTIVE_STATUSES` dans `LenderStats.tsx`. Note : ce correctif devient redondant si FIX-14 est traité en même temps (branchement sur l'endpoint backend qui calcule correctement).
- **Action Back** : aucune — le backend est déjà correct.
- **Statut** : ☐ À faire

---

### FIX-07 — Stats figées / "s'affichent quand elles veulent"

- **Gravité** : 🟠 Majeur
- **Périmètre** : Front (Ismael)
- **Effort** : S
- **Fichier(s) & preuve** :
    - `frontend/src/components/profile/LenderStats.tsx:101` → `useEffect([])` — chargement unique à la montée du composant
    - `frontend/src/screens/profile/ProfileScreen.tsx` — pas de `useFocusEffect`, pas de refetch au retour sur l'écran
- **Problème** : les stats ne se rafraîchissent pas quand l'utilisateur revient sur l'écran Profil après avoir créé ou modifié un prêt. L'affichage est figé sur le premier chargement.
- **Action Front (Ismael)** : remplacer `useEffect([])` par `useFocusEffect(useCallback(() => { fetchStats() }, []))` dans `LenderStats` ou `ProfileScreen`. Fait partie du LOT 1 archi stats (voir section "Décision d'architecture" ci-dessous).
- **Action Back** : aucune.
- **Statut** : ☐ À faire

---

### FIX-08 — Mise à jour d'un prêt non reflétée dans les stats

- **Gravité** : 🟠 Majeur
- **Périmètre** : Front (Ismael)
- **Effort** : M
- **Fichier(s) & preuve** :
    - `frontend/src/stores/useLoanStore.ts:129-175` → mutations locales (créer, confirmer, contester) non observées par `LenderStats`
    - `frontend/src/components/profile/LenderStats.tsx` — aucun abonnement aux mutations du store prêts
- **Problème** : après confirmation ou contestation d'un prêt, les stats affichées dans le profil ne bougent pas — la source de vérité locale (store) et les stats sont désynchronisées.
- **Action Front (Ismael)** : invalider / refetch les stats après chaque mutation `useLoanStore` (création, confirmation, contestation). Fait partie du LOT 2 archi stats. Ce problème se règle naturellement si FIX-14 est traité (endpoint backend + invalidation après mutation).
- **Action Back** : aucune.
- **Statut** : ☐ À faire

---

### FIX-09 — Email d'un contact ne doit pas être modifiable

- **Gravité** : 🟠 Majeur
- **Périmètre** : Les deux
- **Effort** : S
- **Fichier(s) & preuve** :
    - `frontend/src/components/borrowers/BorrowerForm.tsx:100-123` → champ email éditable même en mode édition
    - `backend/src/borrowers/dto/update-borrower.dto.ts:17` → email présent dans le DTO de mise à jour
    - `backend/src/borrowers/borrowers.service.ts:126-145` → `update()` sans garde sur la modification d'email
- **Problème** : un utilisateur peut modifier l'email d'un contact existant depuis l'interface. L'email est un identifiant d'invitation — le modifier casse la cohérence du lien entre comptes.
- **Action Front (Ismael)** : passer `editable={false}` (et style visuel désactivé) sur le champ email lorsque `mode === 'edit'` dans `BorrowerForm`.
- **Action Back (Ozias)** : retirer `email` du `UpdateBorrowerDto` ou lever une `BadRequestException` si `email` est présent dans le body d'un PATCH.
- **Statut** : ☐ À faire

---

### FIX-10 — Format de date incohérent selon la machine (MM/JJ/AAAA vs JJ/MM/AAAA)

- **Gravité** : 🟠 Majeur
- **Périmètre** : Front (Ismael)
- **Effort** : XS
- **Fichier(s) & preuve** — 9 appels `toLocaleDateString()` sans locale :
    - `frontend/src/components/loans/LoanCard.tsx:19`
    - `frontend/src/components/loans/LoanTimeline.tsx:24,26,120`
    - `frontend/src/components/loans/ConfirmationDialog.tsx:61`
    - `frontend/src/components/notifications/NotificationCard.tsx:38`
    - `frontend/src/components/profile/ProfileCard.tsx:15`
    - `frontend/src/screens/borrowers/BorrowerInvitationsScreen.tsx:42`
    - `frontend/src/screens/loans/LoanDetailScreen.tsx:208`
    - Bonne pratique déjà présente : `LoanWizard.tsx:309` et `LoanDetailScreen.tsx:480` utilisent `toLocaleDateString(i18n.language)`
    - Utilitaire existant : `frontend/src/utils/date.ts` (ne contient que `getMinReturnDate`)
- **Problème** : sans locale explicite, `toLocaleDateString()` utilise la locale système de la machine — sur iOS américain, les dates s'affichent MM/JJ/AAAA alors que les utilisateurs français attendent JJ/MM/AAAA.
- **Action Front (Ismael)** : créer une fonction `formatDate(date: string | Date, language: string): string` centralisée dans `frontend/src/utils/date.ts` (appelle `toLocaleDateString(language, { ... })`), puis remplacer les 9 occurrences incriminées.
- **Action Back** : aucune.
- **Statut** : ☐ À faire

---

## 🟡 Mineur / Amélioration

### FIX-11 — Champ "Contact" non dynamique lors d'un prêt/emprunt

- **Gravité** : 🟡 Mineur
- **Périmètre** : Front (Ismael)
- **Effort** : S
- **Fichier(s) & preuve** :
    - `frontend/src/screens/loans/CreateLoanScreen.tsx:23-34` → `useEffect([])` — `fetchBorrowers()` et `fetchItems()` appelés une seule fois
    - `frontend/src/components/loans/LoanWizard.tsx:212-259` — sélecteurs contact et objet alimentés par ce chargement unique
- **Problème** : si l'utilisateur ajoute un contact ou un objet puis revient sur la création de prêt sans recharger l'écran, le nouveau contact / objet n'apparaît pas dans les listes.
- **Action Front (Ismael)** : utiliser `useFocusEffect` pour relancer `fetchBorrowers()` et `fetchItems()` à chaque focus de l'écran `CreateLoanScreen`.
- **Action Back** : aucune.
- **Statut** : ☐ À faire

---

### FIX-12 — Timeline affiche "Invalid Date" pour un prêt actif sans échéance

- **Gravité** : 🟡 Mineur
- **Périmètre** : Front (Ismael)
- **Effort** : XS
- **Fichier(s) & preuve** :
    - `frontend/src/components/loans/LoanTimeline.tsx:37-38` → `returnDate` potentiellement `undefined` passé sans garde
    - `frontend/src/components/loans/LoanTimeline.tsx:24` → `formatDateRange` ne gère pas un argument `from` null/undefined
    - `frontend/src/components/loans/LoanTimeline.tsx:118-120` — rendu conditionnel incomplet
    - `frontend/src/components/loans/LoanTimeline.tsx:123` → `// TODO Sprint 5 : ajouter les étapes de rappel`
- **Problème** : si `returnDate` est null (prêt sans échéance — possible avant FIX-03), la timeline affiche "Invalid Date" au lieu d'un label explicite.
- **Action Front (Ismael)** : ajouter une garde sur `returnDate` avant de le passer à `formatDateRange` — afficher "Sans échéance" (i18n) lorsque la date est absente.
- **Action Back** : aucune.
- **Statut** : ☐ À faire

---

### FIX-13 — Renommer un contact (impossible aujourd'hui)

- **Gravité** : 🟡 Mineur
- **Périmètre** : Les deux — Back d'abord, Front ensuite
- **Effort** : M
- **Fichier(s) & preuve** :
    - `backend/prisma/schema.prisma` → modèle `Borrower` : champs `firstName`/`lastName` uniquement, pas de `displayName`
    - `backend/src/borrowers/dto/update-borrower.dto.ts` — DTO sans champ `displayName`
    - `frontend/src/components/borrowers/BorrowerForm.tsx:71-93` — formulaire d'édition sans champ de renommage libre
- **Problème** : l'utilisateur ne peut pas donner un surnom/alias à un contact (ex. "Maman" au lieu de "Marie Dupont"). Le nom affiché est toujours `firstName + lastName` issu de l'inscription.
- **Action Back (Ozias)** :
    1. Migration Prisma : ajouter `displayName String?` au modèle `Borrower`
    2. Ajouter `displayName` dans `UpdateBorrowerDto` + `borrowers.service.ts`
- **Action Front (Ismael)** : afficher `displayName ?? "firstName lastName"` partout où le nom du contact est rendu ; ajouter un champ "Surnom (optionnel)" dans `BorrowerForm` en mode édition. À traiter après la migration back.
- **Statut** : ☐ À faire

---

### FIX-14 — Le front recalcule les stats au lieu d'appeler `/history/statistics` (jamais consommé)

- **Gravité** : 🟡 Mineur
- **Périmètre** : Les deux — surtout Front (Ismael)
- **Effort** : M
- **Lien CORR** : voir **CORR-08** dans `11_CORRECTIFS_PREPROD.md`
- **Fichier(s) & preuve** :
    - `backend/src/history/history.service.ts:158-196` → endpoint `GET /v1/history/statistics` correct et complet (`byCategory`, `topBorrowers`, `mostLoanedItems`)
    - `frontend/src/components/profile/LenderStats.tsx:37-84` → recalcul client-side à partir de `GET /loans?role=…&limit=100` ×2 (≈200 prêts chargés inutilement)
    - Aucune occurrence de `v1/history` dans `frontend/src/`
- **Problème** : charge réseau inutile, calculs côté client fragiles (cf. FIX-06), et les données riches du backend (`topBorrowers`, `mostLoanedItems`) ne sont jamais exploitées.
- **Action Front (Ismael)** : migrer `LenderStats` pour appeler `GET /v1/history/statistics` — supprimer le recalcul client. Ce fix règle FIX-06, FIX-07 et FIX-08 en cascade si combiné avec `useFocusEffect` + invalidation après mutation (LOT 1 + LOT 2 archi).
- **Action Back (Ozias)** : vérifier que l'endpoint retourne bien les données dans le format attendu par le front (confronter avec `openapi.yaml`).
- **Statut** : ☐ À faire

---

### FIX-15 — Synchronisation des stats inter-comptes

- **Gravité** : 🟡 Mineur
- **Périmètre** : Back (Ozias) — filet MVP
- **Effort** : S
- **Fichier(s) & preuve** :
    - `backend/src/history/history.service.ts:158-196` — source de vérité serveur
    - Pas de `trustScore` automatiquement recalculé après chaque mutation de prêt
- **Problème** : si deux utilisateurs consultent les stats du même compte simultanément après des mutations, des divergences transitoires peuvent apparaître (ex. un prêt confirmé visible pour l'un mais pas pour l'autre).
- **Décision archi (MVP)** : "même source de vérité + refetch au focus" suffit pour le MVP — pas de divergence réelle côté utilisateur. Filet de sécurité : un endpoint admin `POST /v1/admin/borrowers/:id/recalculate-stats` (hors app) pour corriger manuellement si nécessaire.
- **Action Back (Ozias)** : implémenter l'endpoint admin de recalcul (filet de sécurité). La vraie synchronisation temps réel est POST-MVP (FIX-16).
- **Action Front** : aucune.
- **Statut** : ☐ À faire

---

### FIX-16 — Temps réel (websockets) — POST-MVP

- **Gravité** : 🟡 Mineur — décision POST-MVP
- **Périmètre** : Back (Ozias) + Front (Ismael) — à ne pas traiter maintenant
- **Effort** : M→L
- **Dépendances** : résolution de **CORR-01** (scale-to-zero Fly) + besoin utilisateur confirmé sur le terrain
- **Problème** : le polling 30s et le `useFocusEffect` couvrent le besoin MVP. Les websockets ajoutent de la complexité (connexions persistantes incompatibles avec le scale-to-zero Fly, état de reconnexion à gérer des deux côtés).
- **Décision** : ne pas implémenter en phase préprod. Réévaluer après les premiers retours terrain et après résolution de CORR-01.
- **Action Back** : aucune maintenant. Ticket à planifier en post-MVP si le besoin est confirmé.
- **Action Front** : aucune maintenant.
- **Statut** : ☐ Post-MVP — délibérément différé

---

## Décision d'architecture — Stats & Temps réel

Cette section documente les décisions prises lors de la session de tests du 22/06/2026.

### Calcul des statistiques

Le frontend consomme l'endpoint backend existant `GET /v1/history/statistics` (calcul serveur). Pas de dénormalisation d'un champ `lenderStats` sur l'entité `User` en MVP — c'est de la sur-ingénierie pour la volumétrie actuelle.

### Fraîcheur des données

- `useFocusEffect` sur les écrans Stats/Profil : refetch au retour sur l'écran
- Invalidation explicite des stats après chaque mutation (créer/confirmer/contester un prêt)
- Websockets : POST-MVP — dépend de la résolution du scale-to-zero Fly (CORR-01) et d'un besoin terrain confirmé

### Cohérence inter-comptes

Même source de vérité (endpoint serveur) + refetch au focus couvre le besoin MVP. Filet de sécurité : endpoint admin de recalcul manuel (FIX-15).

### Lots séquencés

| Lot | Contenu | Qui | Effort | Cible |
|---|---|---|---|---|
| LOT 1 | Stats correctes : brancher `GET /history/statistics` + `useFocusEffect` | Front (Ismael) | S | MVP |
| LOT 2 | Fraîcheur après mutation : invalidation stats après créer/confirmer/contester | Front (Ismael) | XS | MVP |
| LOT 3 | Filet recalcul admin : `POST /admin/borrowers/:id/recalculate-stats` | Back (Ozias) | S | MVP léger |
| LOT 4 | Websockets : push temps réel inter-comptes | Back + Front | M→L | Post-MVP |
| LOT 5 | Dénormalisation `lenderStats` sur `User` | Back | L | Post-MVP |

---

## Répartition pour demain

### Ismael — Front (quick-wins d'abord)

| Ordre | FIX | Effort | Nature |
|---|---|---|---|
| 1 | FIX-06 — Retirer `CONTESTED` de `ACTIVE_STATUSES` | XS | Quick-win |
| 2 | FIX-10 — `formatDate()` centralisé + remplacer les 9 occurrences | XS | Quick-win |
| 3 | FIX-12 — Garde "Invalid Date" sur timeline | XS | Quick-win |
| 4 | FIX-03 [front] — Rendre date de retour obligatoire dans le wizard | XS | Quick-win |
| 5 | FIX-07 — `useFocusEffect` sur l'écran Profil | S | LOT 1 archi |
| 6 | FIX-11 — `useFocusEffect` sur `CreateLoanScreen` | S | UX |
| 7 | FIX-08 + FIX-14 — Brancher `GET /history/statistics` + invalidation mutations | M | LOT 1+2 archi |
| 8 | FIX-04 [front] — Filtrer objets disponibles uniquement dans le wizard | S | Fonctionnel |
| 9 | FIX-09 [front] — Email non éditable en mode édition contact | XS | Fonctionnel |
| 10 | FIX-01/02 [vérif] — Vérifier affichage URL absolue photos + avatar | XS | Vérification |
| 11 | FIX-13 [front] — Champ surnom + affichage `displayName` (après migration back) | M | Après back |

### Ozias — Back (quick-wins d'abord)

| Ordre | FIX | Effort | Nature |
|---|---|---|---|
| 1 | FIX-01 + FIX-02 — `UPLOAD_BASE_URL` via `fly secrets set` (court terme) | XS | Quick-win bloquant |
| 2 | FIX-03 [back] — Rendre `returnDate` obligatoire dans le DTO | XS | Quick-win |
| 3 | FIX-09 [back] — Retirer email du `UpdateBorrowerDto` | S | Fonctionnel |
| 4 | FIX-04 [back] — Contrôle 409 prêt actif sur même item | M | Fonctionnel |
| 5 | FIX-05 — CRON `ACTIVE → AWAITING_RETURN` + ajuster auto-confirm (+ CORR-01) | M | Workflow critique |
| 6 | FIX-01 + FIX-02 [fond] — Implémenter R2PhotoStorageService (= CORR-02) | M | Persistance |
| 7 | FIX-13 [back] — Migration Prisma `displayName` + DTO | M | Fonctionnel |
| 8 | FIX-14 [back] — Vérifier format endpoint `/history/statistics` vs openapi.yaml | XS | Vérification |
| 9 | FIX-15 — Endpoint admin recalcul stats (filet) | S | Filet MVP |
| — | FIX-16 — Websockets | M→L | POST-MVP |

---

## Ordre global conseillé

**Étape 1 — Quick-wins indépendants (les deux côtés en parallèle)**

- Front : FIX-06, FIX-10, FIX-12, FIX-03 [front]
- Back : FIX-01/02 config `UPLOAD_BASE_URL`, FIX-03 [back]

**Étape 2 — Fond fonctionnel**

- Front : stats LOT 1+2 (FIX-07 + FIX-08 + FIX-14), objet re-prêtable FIX-04 [front]
- Back : photos R2 FIX-01/02 [fond], workflow <3j FIX-05, objet re-prêtable FIX-04 [back]

**Étape 3 — Améliorations**

- FIX-11 (dynamisme listes prêt), FIX-13 (renommage contact), FIX-09 (email non modifiable)

**Étape 4 — Post-MVP**

- FIX-16 (websockets), FIX-15 avancé (temps réel inter-comptes), dénormalisation `lenderStats`

---

*Document produit à partir des notes de tests terrain du 22/06/2026 — à mettre à jour après chaque correctif appliqué.*
