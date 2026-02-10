# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Return** est une application mobile de suivi de prêts d'objets personnels. Elle permet aux utilisateurs d'enregistrer
des prêts, suivre les échéances et envoyer des rappels diplomatiques aux emprunteurs.

**Statut actuel** : Phase de spécifications — pas encore de code source. Le repo contient la documentation fondatrice et
le contrat API OpenAPI.

## Stack Technique

- **Backend** : NestJS (TypeScript), Monolithe Modulaire, Prisma ORM
- **Frontend** : React Native (TypeScript), Zustand, React Navigation, React Native Paper
- **Base de données** : PostgreSQL 16+ (principal) + Redis 7.x (cache, queues BullMQ)
- **Stockage photos** : Cloudflare R2 (S3-compatible)
- **Infrastructure** : Fly.io, Docker, GitHub Actions CI/CD
- **Auth** : JWT (access token 15min + refresh token 30j) via Passport.js
- **Tests** : Jest, Testcontainers, Supertest (backend), Detox (frontend E2E), Pact (contract)
- **Logs** : Winston (JSON structuré uniquement)

## Modules Métier

Modules NestJS découplés par événements (EventBus) :

- **Loans** : Cycle de vie des prêts (PENDING_CONFIRMATION → ACTIVE → RETURNED/ABANDONED)
- **Items** : Objets prêtés (photo + reconnaissance automatique via Google Cloud Vision)
- **Reminders** : Rappels automatiques (BullMQ jobs) — escalade J+3, J+10, J+17 après échéance
- **Users** : Comptes, profils, rôles (Lender, Borrower)
- **Notifications** : Push (FCM), Email (V2+), SMS (V2+)

## Architecture & Patterns Obligatoires

- **SOLID strict** — SRP via EventBus, DIP via interfaces pour tout accès DB
- **Repository Pattern** : Tout accès DB passe par une interface `*Repository` (jamais Prisma directement dans les
  services)
- **Factory Pattern** : Création d'entités complexes (`LoanFactory.create()`)
- **Strategy Pattern** : Politiques de rappel interchangeables
- **Observer/Event-Driven** : Communication inter-modules via `EventBus` (`@OnEvent`)

## Standards de Développement

### TDD (Strict RED → GREEN → REFACTOR → COMMIT)

- Aucun code de production sans test préalable qui échoue
- Pattern AAA (Arrange-Act-Assert) obligatoire
- Couverture minimale : Domain 100%, Services 90%, Repositories 80%, Controllers 70%

### Erreurs API (RFC 7807)

Toutes les erreurs HTTP retournent un objet `ProblemDetails` :

```json
{
  "type": "https://api.return.app/errors/<error-type>",
  "title": "...",
  "status": 404,
  "detail": "...",
  "instance": "/api/v1/...",
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
- Format JSON avec `requestId`, `userId`, `timestamp`, `context`, `duration`

### Git

- **Conventional Commits** : `<type>(<scope>): <subject>`
- Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert`
- Scopes : `loans`, `reminders`, `auth`, `photos`, `notifications`, `users`, `db`, `api`
- Branches : `main` (prod) ← `develop` ← `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/`
- Pre-commit hooks : Husky + lint-staged (ESLint, Prettier, Jest related tests, commitlint)

### Interdictions

- Dépendance directe à Prisma dans les services (utiliser Repository)
- `console.log` (utiliser Winston)
- Erreurs HTTP sans RFC 7807
- Logique métier dans les controllers (déplacer dans services)
- Secrets en dur (utiliser .env)

## Domaine Métier (Ubiquitous Language)

| Terme FR   | Terme EN (code) | Description                                         |
|------------|-----------------|-----------------------------------------------------|
| Prêt       | Loan            | Transaction de prêt temporaire                      |
| Prêteur    | Lender          | Utilisateur propriétaire qui prête                  |
| Emprunteur | Borrower        | Personne qui emprunte (peut ne pas avoir de compte) |
| Objet      | Item            | Bien prêté (photo, nom, valeur optionnelle)         |
| Rappel     | Reminder        | Notification automatique planifiée                  |

**Termes interdits dans le code** : "Utilisateur" (trop vague → Lender/Borrower), "Transaction" (→ Loan), "Client" (→
pas de connotation commerciale)

## Statuts de Prêt (Machine à États)

`PENDING_CONFIRMATION` → `ACTIVE` (accepté ou timeout 48h) | `DISPUTED` (refusé)
`ACTIVE` → `AWAITING_RETURN` (date dépassée) → `RETURNED` (rendu) | `ABANDONED` (3 rappels ignorés)

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
- Validation : Zod (runtime + types TS)
- Spécification complète dans `openapi.yaml`
