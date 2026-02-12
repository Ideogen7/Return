# Return ↺ — Règles de Développement pour IA

## Architecture & Stack

- **Backend** : NestJS 11.x (TypeScript 5.8+), Monolithe Modulaire, PostgreSQL 17+ (Prisma 6.x+), Redis 8.x
- **Frontend** : React Native 0.78+ (TypeScript), Zustand 5.x, React Navigation 7.x, React Native Paper
- **Infrastructure** : Fly.io (Europe West), Cloudflare R2, Docker, GitHub Actions CI/CD
- **Auth** : JWT (access 15min + refresh 30j) via Passport.js, révocation immédiate via Redis blacklist
- **Modules** : Loans, Reminders, Items, Users, Notifications (découplés par événements)

## Principes SOLID

1. **SRP** : 1 classe = 1 responsabilité. EventEmitter2 pour découpler les actions secondaires.
2. **OCP** : Interfaces pour tout comportement extensible (notifications, storage).
3. **LSP** : Toute interface substituable sans altérer le contrat.
4. **ISP** : Interfaces ségrégées (ReminderScheduler ≠ ReminderQuery).
5. **DIP** : Abstractions pour services externes (storage, notifications). Prisma directement dans les services (pas de Repository Pattern pour le MVP).

## Design Patterns

- **Factory Pattern** : Création d'entités complexes (`LoanFactory.toCreateInput()`).
- **Observer/Event-Driven** : Communication inter-modules via `EventEmitter2` + `@OnEvent`.
- **Politique fixe de rappels** : J-3, J, J+7, J+14, J+21 (pas de Strategy Pattern en V1).

## TDD Workflow (STRICT)

1. **RED** : Écrire LE test qui échoue (AAA : Arrange-Act-Assert).
2. **GREEN** : Code minimal pour passer le test.
3. **REFACTOR** : Améliorer sans casser les tests.
4. **COMMIT** : Message conventionnel.

Cycle par comportement, pas par feature entière.

**Couverture** : Domain 95%, Services 90%, Controllers 70%.

## Validation

- **class-validator** + **class-transformer** avec NestJS ValidationPipe.
- whitelist: true, forbidNonWhitelisted: true, transform: true.

## Gestion d'Erreurs (RFC 7807)

Toutes les erreurs API retournent un objet ProblemDetails :
```json
{
  "type": "https://api.return.app/errors/<error-type>",
  "title": "...",
  "status": 404,
  "detail": "...",
  "instance": "/v1/...",
  "timestamp": "...",
  "requestId": "..."
}
```

## Logs (JSON Structuré — Winston)

- Console transport uniquement (conteneurs Fly.io éphémères).
- Format JSON avec `requestId`, `userId`, `timestamp`, `context`, `duration`.
- Niveaux : ERROR, WARN, INFO, DEBUG.

## Git (GitHub Flow + Conventional Commits)

- **Branches** : `main` ← `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/`
- **Pas de branche develop** (GitHub Flow pour 2 développeurs).
- **Commits** : `<type>(<scope>): <subject>`
- **Scopes** : `loans`, `reminders`, `auth`, `photos`, `notifications`, `users`, `db`, `api`, `i18n`
- **Pre-commit** : ESLint + Prettier (pas de Jest en pre-commit).
- **PR** : 1 approval, CI verte.

## Interdictions Strictes

❌ `console.log` (utiliser Winston)
❌ Erreurs HTTP sans RFC 7807
❌ Commits sans type conventionnel
❌ Code de production sans test préalable (TDD)
❌ Logique métier dans les controllers
❌ Secrets en dur (utiliser .env)
❌ Zod pour la validation (utiliser class-validator)
❌ File Transport Winston (conteneurs éphémères)

## Rappels Automatiques (100% automatiques, pas de rappels manuels)

- Politique fixe : J-3, J, J+7, J+14, J+21
- Templates prédéfinis avec pool aléatoire par palier
- Push notifications uniquement en V1 (FCM)
- Après le 5e rappel ignoré → statut ABANDONED

## i18n

- FR + EN en V1 (app + notifications push)
- Textes utilisateur toujours disponibles dans les deux langues

---
**Version** : 1.1 (12 février 2026)
**Prochaine révision** : Post-Sprint 1
