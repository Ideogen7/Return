# PROTOCOLE OPÉRATIONNEL : BOUCLE D'INSTRUCTION TERMINAL

À partir de maintenant, tu dois suivre une procédure stricte et récursive appelée "La Boucle Terminal". Ceci est d'une importance ABSOLUE pour notre flux de travail. Ne dévie jamais de ce protocole.

## LA RÈGLE D'OR

Dès que tu as terminé une réponse à mon prompt ou une tâche de modification de code, tu as l'OBLIGATION FORMELLE de proposer immédiatement la commande suivante dans le terminal :
`echo "J'ai fini"`

## LE FLUX LOGIQUE (À respecter impérativement)

1. **Analyse** : Regarde la dernière sortie du terminal.
2. **Décision** :
   - SI la dernière sortie est exactement "J'ai fini" : Alors la session est terminée, tu restes en attente.
   - SI la dernière sortie est autre chose (ex: "Corrige le bug ligne 40", "Refactorise ce fichier") : Tu dois considérer ce texte comme ton **NOUVEAU PROMPT**. Tu dois exécuter cette demande immédiatement sur le code.
3. **Clôture** : Une fois la demande (lue dans le terminal) exécutée, retourne à l'étape "LA RÈGLE D'OR" et propose à nouveau la commande `echo "J'ai fini"`.

## IMPORTANT

- Je vais souvent intercepter ta commande `echo "J'ai fini"` pour la modifier. C'est normal.
- Tant que tu ne vois pas "J'ai fini" écrit noir sur blanc dans l'historique du terminal, tu dois considérer que tu es toujours en mission et traiter la sortie du terminal comme ta prochaine instruction.
- N'attends pas que je te parle dans le chat. Ton instruction vient du terminal.

Confirme que tu as compris ce protocole et mets-toi en attente de la première lecture du terminal.



# Return ↺ - Règles de Développement pour IA

## Architecture & Stack
- **Backend** : NestJS (TypeScript), Monolithe Modulaire, PostgreSQL + Redis
- **Frontend** : React Native (TypeScript), Zustand, React Navigation
- **Infrastructure** : Fly.io, Cloudflare R2, Docker
- **Modules** : Loans, Reminders, Items, Users, Notifications (découplés par événements)

## Principes SOLID (OBLIGATOIRES)
1. **SRP** : 1 classe = 1 responsabilité. Utiliser EventBus pour découpler les actions secondaires.
2. **OCP** : Créer des interfaces pour tout comportement extensible (notifications, storage).
3. **LSP** : Toute interface doit être substituable sans altérer le contrat.
4. **ISP** : Séparer les interfaces (ex: ReminderScheduler ≠ ReminderQuery).
5. **DIP** : Services dépendent d'abstractions (interfaces), jamais d'implémentations (Prisma).

## Design Patterns Imposés
- **Repository Pattern** : Tout accès DB passe par une interface `*Repository`.
- **Factory Pattern** : Création d'entités complexes (ex: `LoanFactory.create()`).
- **Strategy Pattern** : Algorithmes interchangeables (ex: politiques de rappel).
- **Observer Pattern** : Communication inter-modules via `EventBus`.

## TDD Workflow (STRICT)
1. **RED** : Écrire le test qui échoue (AAA : Arrange-Act-Assert).
2. **GREEN** : Code minimal pour passer le test.
3. **REFACTOR** : Améliorer sans casser les tests.
4. **COMMIT** : Message conventionnel (voir ci-dessous).

**Couverture minimale** : Domain 100%, Services 90%, Repositories 80%, Controllers 70%.

## Gestion d'Erreurs (RFC 7807)
Toutes les erreurs API doivent retourner :
```json
{
  "type": "https://api.return.app/errors/loan-not-found",
  "title": "Loan Not Found",
  "status": 404,
  "detail": "...",
  "instance": "/api/v1/loans/loan-123",
  "timestamp": "2026-02-08T14:32:00Z",
  "requestId": "req-...",
  "errors": [{"field": "loanId", "code": "NOT_FOUND", "message": "..."}]
}
```

## Logs (JSON Structuré Uniquement)
- **ERROR** : Erreurs techniques nécessitant intervention.
- **WARN** : Situations anormales mais non-bloquantes.
- **INFO** : Événements métier importants.
- **DEBUG** : Détails techniques (désactivé en production).

**Format obligatoire** : JSON avec `requestId`, `userId`, `timestamp`, `context`, `duration`.

## Git Commits (Conventional Commits)
Format : `<type>(<scope>): <subject>`

**Types** : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert`.
**Scopes** : `loans`, `reminders`, `auth`, `photos`, `notifications`, `users`, `db`, `api`.

**Exemple** :
```
feat(loans): add borrower confirmation workflow

- Implement PENDING_CONFIRMATION status
- Add confirmation/refusal endpoints
- Tests: 12 passing

Closes #42
```

## Checklist Avant Merge
- [ ] Tous les tests passent (unit + integration)
- [ ] Couverture de code respectée (voir seuils par couche)
- [ ] Code review approuvé (2 approvals pour main, 1 pour develop)
- [ ] Message de commit respecte Conventional Commits
- [ ] Aucune donnée sensible loguée (passwords, tokens)
- [ ] RFC 7807 respecté pour toutes les erreurs API
- [ ] Documentation API mise à jour (OpenAPI spec)

## Interdictions Strictes
❌ Dépendance directe à Prisma dans les services (utiliser Repository)
❌ `console.log` au lieu de Winston
❌ Erreurs HTTP sans RFC 7807
❌ Commits sans type conventionnel
❌ Code de production sans test préalable (TDD)
❌ Logique métier dans les controllers (déplacer dans services)
❌ Secrets en dur dans le code (utiliser .env)

## Priorités de Développement
1. **Sécurité** : Validation des inputs, Rate Limiting, RBAC strict.
2. **Testabilité** : TDD, Mocks, Testcontainers.
3. **Maintenabilité** : SOLID, Design Patterns, Documentation.
4. **Performance** : Après validation fonctionnelle (pas d'optimisation prématurée).
