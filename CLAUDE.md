# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Return** est une application mobile de suivi de prêts d'objets personnels et d'argent. Elle permet aux utilisateurs
d'enregistrer des prêts, suivre les échéances et envoyer des rappels diplomatiques aux emprunteurs.

**Statut actuel** : Phase de spécifications — pas encore de code source. Le repo contient la documentation fondatrice et
le contrat API OpenAPI.

## Stack Technique

- **Backend** : NestJS 11.x (TypeScript 5.8+), Monolithe Modulaire, Prisma 6.x+ ORM
- **Frontend** : React Native 0.78+ (TypeScript), Zustand 5.x, React Navigation 7.x, React Native Paper
- **Base de données** : PostgreSQL 17+ (principal) + Redis 8.x (cache, queues BullMQ, blacklist JWT)
- **Stockage photos** : Cloudflare R2 (S3-compatible)
- **Infrastructure** : Fly.io (Europe West), Docker, GitHub Actions CI/CD
- **Auth** : JWT (access token 15min + refresh token 30j) via Passport.js, révocation immédiate via Redis blacklist
- **Tests** : Jest, Testcontainers, Supertest (backend), React Native Testing Library (frontend), Detox (post-MVP E2E)
- **Logs** : Winston (JSON structuré, console transport uniquement)
- **Validation** : class-validator + class-transformer (NestJS ValidationPipe)
- **i18n** : FR + EN (app + notifications push) via react-i18next

## Modules Métier

Modules NestJS découplés par événements (EventEmitter2 + @OnEvent) :

- **Loans** : Cycle de vie des prêts (PENDING_CONFIRMATION → ACTIVE → RETURNED/ABANDONED). Types : Objet physique et
  Argent.
- **Items** : Objets prêtés (photo, nom, catégorie, valeur estimée optionnelle)
- **Reminders** : Rappels automatiques (BullMQ jobs) — politique fixe J-3, J, J+7, J+14, J+21
- **Users** : Comptes, profils, rôles contextuels (Lender, Borrower)
- **Notifications** : Push (FCM) en V1. Email, SMS en V2+.

## Architecture & Patterns Obligatoires

- **SOLID strict** — SRP via EventBus, DIP via interfaces pour services externes (storage, notifications, queue)
- **Prisma directement dans les services** — Pas de Repository Pattern pour le MVP (décision pragmatique)
- **Factory Pattern** : Création d'entités complexes (`LoanFactory.toCreateInput()`)
- **Politique de rappels fixe** : J-3, J, J+7, J+14, J+21 (pas de Strategy Pattern en V1 — YAGNI)
- **Observer/Event-Driven** : Communication inter-modules via `EventEmitter2` (`@OnEvent`)

## Standards de Développement

### TDD (Strict RED → GREEN → REFACTOR → COMMIT)

- Aucun code de production sans test préalable qui échoue
- Cycle par comportement (pas par feature entière)
- Pattern AAA (Arrange-Act-Assert) obligatoire
- Couverture minimale : Domain 95%, Services 90%, Controllers 70%

### Erreurs API (RFC 7807)

Toutes les erreurs HTTP retournent un objet `ProblemDetails` :

```json
{
  "type": "https://api.return.app/errors/<error-type>",
  "title": "...",
  "status": 404,
  "detail": "...",
  "instance": "/v1/...",
  "timestamp": "...",
  "requestId": "...",
  "errors": [
    {
      "field": "...",
      "code": "...",
      "message": "..."
    }
  ]
}
```

### Logs

- Winston uniquement (pas de `console.log`)
- Console transport uniquement (conteneurs Fly.io éphémères)
- Format JSON avec `requestId`, `userId`, `timestamp`, `context`, `duration`

### Git (GitHub Flow + Conventional Commits)

- **Branches** : `main` (prod) ← `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/` (pas de branche `develop`)
- **Conventional Commits** : `<type>(<scope>): <subject>`
- Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert`
- Scopes : `loans`, `reminders`, `auth`, `photos`, `notifications`, `users`, `db`, `api`, `i18n`
- Pre-commit hooks : Husky + lint-staged (ESLint + Prettier uniquement). Jest en CI.
- PR : 1 approval, CI verte.

### Interdictions

- `console.log` (utiliser Winston)
- Erreurs HTTP sans RFC 7807
- Logique métier dans les controllers (déplacer dans services)
- Secrets en dur (utiliser .env)
- Zod pour la validation (utiliser class-validator)
- File Transport Winston (conteneurs éphémères)
- Code de production sans test préalable (TDD)

## Domaine Métier (Ubiquitous Language)

| Terme FR   | Terme EN (code) | Description                                                |
|------------|-----------------|-------------------------------------------------------------|
| Prêt       | Loan            | Transaction de prêt temporaire (objet physique ou argent)  |
| Prêteur    | Lender          | Utilisateur propriétaire qui prête                         |
| Emprunteur | Borrower        | Utilisateur qui emprunte (compte obligatoire)              |
| Objet      | Item            | Bien prêté (photo, nom, valeur optionnelle)                |
| Rappel     | Reminder        | Notification automatique planifiée                         |

**Termes interdits dans le code** : "Utilisateur" (trop vague → Lender/Borrower), "Transaction" (→ Loan), "Client" (→
pas de connotation commerciale)

## Statuts de Prêt (Machine à États)

`PENDING_CONFIRMATION` → `ACTIVE` (accepté) | `ACTIVE_BY_DEFAULT` (timeout 48h) | `DISPUTED` (refusé)
`ACTIVE` / `ACTIVE_BY_DEFAULT` → `AWAITING_RETURN` (date dépassée) → `RETURNED` (rendu) | `ABANDONED` (5 rappels
ignorés)

## Documents de Référence

- `00_BIBLE_PROJET.md` : Vision, personas, scope fonctionnel MVP, décisions stratégiques
- `01_ARCHITECTURE_TECHNIQUE.md` : Stack, ADRs, RBAC, sécurité, plan de scalabilité
- `02_NORMES_OPERATIONNELLES.md` : SOLID, design patterns, TDD, gestion d'erreurs, git flow
- `04_ROADMAP_BACKEND.md` / `05_ROADMAP_FRONTEND.md` : Plans d'implémentation
- `06_PLAN_GENERAL.md` : Planning global
- `openapi.yaml` : Contrat API complet (OpenAPI 3.1)
- `API_CONTRACT_TESTING.md` / `API_MOCKING_STRATEGY.md` : Stratégies de test API

## API

- Base URL locale : `http://localhost:3000/v1`
- Authentification : Bearer JWT sur tous les endpoints (sauf `/auth/register` et `/auth/login`)
- Validation : class-validator + class-transformer (NestJS ValidationPipe)
- Spécification complète dans `openapi.yaml`
