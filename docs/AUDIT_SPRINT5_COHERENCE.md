# Audit de Cohérence Pré-Sprint 5

**Date** : Pré-Sprint 5
**Scope** : OpenAPI ↔ Roadmap Backend ↔ Plan Général ↔ Bible Projet ↔ Architecture Technique

## Résultat : ✅ TOUS LES DOCUMENTS SONT EN COHÉRENCE

Toutes les incohérences identifiées ci-dessous ont été corrigées.

---

## Incohérences Identifiées et Corrigées

### IC-1 — `DELETE /users/me/avatar` manquant dans OpenAPI ✅ CORRIGÉ

- **Problème** : L'endpoint `DELETE /users/me/avatar` était implémenté dans le backend mais absent de `openapi.yaml`.
- **Violation** : RÈGLE DE DIAMANT (OpenAPI = source de vérité).
- **Correction** : Ajout du bloc `delete:` sous `/users/me/avatar` dans `openapi.yaml` (operationId: `deleteUserAvatar`, 204/401/404).

### IC-2 — SYNC 5 listait des endpoints Reminders V2 comme "Backend disponible" ✅ CORRIGÉ

- **Problème** : Le Plan Général (SYNC 5) listait 3 endpoints Reminders (`GET /loans/{id}/reminders`, `GET /reminders/{id}`, `POST /reminders/{id}/cancel`) comme "Backend disponible" alors qu'ils sont réservés V2.
- **Correction** : Remplacé par les 5 endpoints Notifications actifs V1 (`POST/DELETE /notifications/device-token`, `GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all`). Ajout note explicite "Les 3 endpoints Reminders sont réservés V2".

### IM-1 — Compteurs d'endpoints incorrects ✅ CORRIGÉ

- **Problème** : Roadmap disait "~46 endpoints", Plan Général disait "~40 endpoints". Le compte réel est **49 endpoints actifs V1** (+ 3 réservés V2 = 52 total).
- **Correction** : Mis à jour dans les deux documents. Détail par sprint corrigé (Sprint 3: 9, Sprint 5: 5, Sprint 6: 4).

### IM-2 — CINV-012/013 comptait 7 endpoints au lieu de 6 ✅ CORRIGÉ

- **Problème** : "list sent" et "list received" sont un seul endpoint `GET /contact-invitations?direction=sent|received`.
- **Correction** : Changé "7 endpoints" → "6 endpoints" dans CINV-012 et CINV-013.

### IM-3 — `PATCH /notifications/{id}/read` : code retour 200 vs 204 ✅ CORRIGÉ

- **Problème** : REM-016 disait "success 200" mais `openapi.yaml` définit 204.
- **Correction** : Changé "success 200" → "success 204" dans REM-016.

### IM-4 — Tâches TDD `POST/DELETE /notifications/device-token` manquantes ✅ CORRIGÉ

- **Problème** : Ces 2 endpoints étaient dans `openapi.yaml` mais sans tâches TDD dans le Roadmap Sprint 5.
- **Correction** : Ajout Phase 5.4 "Device Token (FCM)" avec 6 tâches TDD (REM-023 à REM-028).

### IM-5 — Borrower stats/loans planifiés Sprint 6 mais déjà implémentés ✅ CORRIGÉ

- **Problème** : HIST-006/007/010/011/012/013 (`GET /borrowers/{id}/statistics` et `GET /borrowers/{id}/loans`) étaient planifiés Sprint 6 mais déjà implémentés dans le module Borrowers.
- **Correction** : Ajout note "⚠️ Déjà implémenté" dans la section Sprint 6.

### IM-6 — Tâches TDD manquantes pour DELETE endpoints ✅ CORRIGÉ

- **Problème** : `DELETE /items/{id}/photos/{photoId}` (7ème endpoint Items) et `DELETE /users/me/avatar` n'avaient pas de tâches TDD explicites.
- **Correction** : ITEM-015 mis à jour "7 endpoints". Ajout tâches USER-017/018/019 pour DELETE avatar. Sprint 3 livrable mis à jour "7 endpoints Items + 2 endpoints Users: avatar".

---

## Compteur Final d'Endpoints

| Catégorie | Nombre |
| --------- | ------ |
| Active V1 | **49** |
| Réservé V2 | **3** |
| **Total OpenAPI** | **52** |

### Répartition par Sprint

| Sprint | Endpoints |
| ------ | --------- |
| Sprint 0 | 2 (health + ready) |
| Sprint 1 | 10 (Auth: 4, Users: 6) |
| Sprint 2 | 5 (Borrowers CRUD) |
| Sprint 3 | 9 (Items: 7, Avatar: 2) |
| Sprint 4 | 8 (Loans) |
| Sprint 4.5 | 0 (corrections) |
| Sprint 4.6 | 6 (Contact Invitations) |
| Sprint 5 | 5 (Notifications) + système auto |
| Sprint 6 | 4 (History: 2, Borrower stats/loans: 2 — déjà faits) |
| **Total** | **49 actifs** + 3 réservés V2 |

---

## Documents Modifiés

1. `docs/openapi.yaml` — Ajout `DELETE /users/me/avatar`
2. `docs/04_ROADMAP_BACKEND.md` — CINV-012/013 (6 endpoints), REM-016 (204), Phase 5.4 device-token, Sprint 3 (7 Items + 2 Avatar), Sprint 6 note, résumé sprints
3. `docs/06_PLAN_GENERAL.md` — SYNC 5 (5 endpoints Notifications), checklist (~49 endpoints)
