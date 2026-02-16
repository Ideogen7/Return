## Description

<!-- Décrivez brièvement les changements apportés et leur contexte. -->

## Type de changement

<!-- Cochez les cases correspondantes -->

- [ ] `feat` — Nouvelle fonctionnalité
- [ ] `fix` — Correction de bug
- [ ] `refactor` — Refactoring sans changement de comportement
- [ ] `docs` — Documentation uniquement
- [ ] `test` — Ajout ou modification de tests
- [ ] `chore` — Tâches techniques (deps, config, CI/CD)
- [ ] `perf` — Amélioration de performance
- [ ] `build` — Changements build (Docker, Dockerfile)
- [ ] `ci` — Changements CI/CD

## Scope(s) concerné(s)

<!-- Cochez les modules impactés -->

- [ ] `auth` — Authentification / JWT / Passport
- [ ] `users` — Gestion des utilisateurs / profils
- [ ] `loans` — Module de gestion des prêts
- [ ] `reminders` — Système de rappels automatiques
- [ ] `notifications` — Notifications push (FCM)
- [ ] `photos` — Photos d'objets (Cloudflare R2)
- [ ] `db` — Base de données (migrations, seeds)
- [ ] `api` — Endpoints API (controllers, DTOs, OpenAPI)
- [ ] `i18n` — Internationalisation (FR/EN)
- [ ] Autre : <!-- préciser -->

## Changements détaillés

<!-- Liste des modifications principales -->

-
-
-

## Checklist

<!-- Vérifiez AVANT de demander une review -->

### Qualité du code

- [ ] Les tests passent (`npm run test`)
- [ ] Le linting passe (`npm run lint`)
- [ ] Pas de `console.log` (Winston uniquement)
- [ ] Pas de secrets en dur (`.env` uniquement)

### TDD (si code de production)

- [ ] Tests écrits AVANT le code (RED → GREEN → REFACTOR)
- [ ] Couverture respectée (Domain 95%, Services 90%, Controllers 70%)

### API (si endpoints modifiés)

- [ ] `openapi.yaml` mis à jour
- [ ] Spectral passe (`npm run lint:api`)
- [ ] Erreurs au format RFC 7807
- [ ] Validation via `class-validator` (pas Zod)

### Documentation (si applicable)

- [ ] Roadmaps mis à jour (04, 05, 06)
- [ ] Bible projet cohérente (00)
- [ ] Architecture à jour (01)

### Conventional Commits

- [ ] Tous les commits suivent le format `<type>(<scope>): <subject>`
- [ ] Messages en anglais, impératif, 50 chars max pour le sujet

## Captures d'écran / Logs

<!-- Si applicable, ajoutez des captures d'écran ou des extraits de logs -->

## Notes pour le reviewer

<!-- Contexte supplémentaire, points d'attention, questions ouvertes -->
