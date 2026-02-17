# API_CONTRACT_TESTING.md

**Return ↺ - Stratégie de Validation du Contrat API**

---

## 1. Approche : OpenAPI-First

Pour une équipe de 2 développeurs travaillant sur le même projet (backend + frontend), l'approche **OpenAPI-first**
remplace avantageusement le Contract Testing classique (Pact). Le fichier `openapi.yaml` constitue le **contrat unique**
entre le backend NestJS et le frontend React Native.

**Pourquoi pas Pact ?**

Pact est conçu pour synchroniser des **équipes séparées** (front/back indépendants). Dans notre contexte :

- La même équipe développe les deux côtés
- Le fichier OpenAPI est partagé dans le même repository
- Pact ajouterait un broker, des state handlers, et une CI supplémentaire — sans bénéfice proportionnel

**Notre approche couvre 95% des bénéfices de Pact avec 20% de la complexité.**

---

## 2. Les 4 Piliers de la Validation

### Pilier 1 : OpenAPI Spec comme Source de Vérité

Le fichier `openapi.yaml` définit :

- Tous les endpoints, méthodes HTTP, et codes de réponse
- Les schémas de requête et de réponse (DTOs)
- Les exemples de données réalistes
- Les erreurs RFC 7807 standardisées

**Validation du fichier** :

```bash
# Linter OpenAPI (intégré en CI)
npx @stoplight/spectral-cli lint openapi.yaml
```

### Pilier 2 : Prism Mock Server (Développement Frontend)

Prism génère un serveur mock à partir du fichier OpenAPI, permettant au frontend de développer **sans attendre le
backend**.

```bash
# Lancer le mock server
prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors

# Mode avec exemples prédéfinis (recommandé pour les tests)
prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors
# → Utilise les exemples définis dans l'OpenAPI

# Mode dynamique (exploration manuelle)
prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors --dynamic
# → Génère des données aléatoires réalistes
```

**Ce que Prism vérifie automatiquement** :

- ✅ Format des requêtes entrantes (types, regex, longueurs)
- ✅ Headers requis (Authorization, Content-Type)
- ✅ Paramètres de query valides
- ✅ Cohérence des réponses avec les schémas

### Pilier 3 : Tests Supertest (Validation Backend)

Côté backend, **Supertest** valide que les endpoints réels respectent le contrat défini dans l'OpenAPI :

```typescript
// test/e2e/loans.e2e-spec.ts
describe('POST /v1/loans', () => {
  it('should create a loan with PENDING_CONFIRMATION status', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/loans')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemId: testItem.id,
        borrowerId: testBorrower.id,
        returnDate: '2026-04-15',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      status: 'PENDING_CONFIRMATION',
      item: expect.objectContaining({ id: testItem.id }),
      borrower: expect.objectContaining({ id: testBorrower.id }),
    });
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('createdAt');
  });

  it('should return RFC 7807 error for invalid return date', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/loans')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemId: testItem.id,
        borrowerId: testBorrower.id,
        returnDate: '2020-01-01', // Date passée
      })
      .expect(400);

    expect(response.body).toMatchObject({
      type: expect.stringContaining('https://api.return.app/errors/'),
      status: 400,
      title: expect.any(String),
      detail: expect.any(String),
    });
  });
});
```

### Pilier 4 : Tests d'Intégration au Basculement

Quand le frontend bascule d'un module mock vers le backend réel, une série de **smoke tests** valide l'alignement :

```typescript
// Checklist de basculement par module
const SMOKE_TESTS = {
  auth: [
    'POST /auth/register → 201 (création de compte)',
    'POST /auth/login → 200 (connexion + tokens)',
    'POST /auth/refresh → 200 (renouvellement token)',
    'POST /auth/logout → 204 (déconnexion)',
  ],
  loans: [
    'POST /loans → 201 (création prêt)',
    'GET /loans → 200 (liste paginée)',
    'GET /loans/{id} → 200 (détail avec relations)',
    'POST /loans/{id}/confirm → 200 (confirmation)',
    'POST /loans/{id}/contest → 200 (contestation)',
  ],
  // ... par module
};
```

---

## 3. Workflow CI/CD

```yaml
# .github/workflows/api-validation.yml
name: API Contract Validation

on: [push, pull_request]

jobs:
  lint-openapi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx @stoplight/spectral-cli lint openapi.yaml

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test        # Unit tests
      - run: npm run test:e2e    # Supertest E2E (avec Testcontainers)
```

---

## 4. Détection des Cassures de Contrat

### Scénario : Le Backend Change un Format de Réponse

1. Le développeur modifie un DTO backend
2. **Les tests Supertest échouent** → le développeur met à jour le test
3. **L'OpenAPI doit être mis à jour** → vérification en code review
4. **Le frontend est informé** → même équipe, même PR

### Scénario : Le Frontend a Besoin d'un Nouveau Champ

1. Le développeur ajoute le champ dans `openapi.yaml`
2. **Prism le retourne automatiquement** → le frontend peut développer
3. Le backend implémente le champ → les tests Supertest valident
4. Le basculement mock → réel fonctionne sans surprise

---

## 5. Avantages vs Pact

| Critère | Pact | Notre Approche (OpenAPI-first) |
|---|---|---|
| Complexité de setup | Élevée (broker, state handlers, CI jobs) | Faible (spectral + prism + supertest) |
| Infrastructure supplémentaire | Pact Broker (Docker + PostgreSQL) | Aucune |
| Temps de maintenance | Élevé (contrats à publier, vérifier) | Faible (fichier YAML partagé) |
| Couverture | Interactions consumer-driven | Spec complète (tous les endpoints) |
| Documentation | Générée depuis les contrats | `openapi.yaml` = documentation vivante |
| Adapté pour 2 devs | Non (conçu pour équipes séparées) | Oui |

---

## 6. Quand Migrer vers Pact ?

Pact deviendrait pertinent si :

- L'équipe grandit à 4+ développeurs avec des équipes front/back séparées
- Le frontend et le backend sont dans des repositories distincts
- Plusieurs consumers (app mobile, app web, API partenaires) consomment la même API

Dans ce cas, ce document servira de référence pour la migration.

---

## 7. Checklist de Mise en Place

- [ ] `openapi.yaml` validé avec Spectral (0 erreur)
- [ ] Prism mock fonctionnel (`npm run mock:api`)
- [ ] Au moins 1 test Supertest par endpoint critique (auth, loans, reminders)
- [ ] CI/CD : lint OpenAPI + tests backend automatiques
- [ ] Checklist de smoke tests définie pour chaque module (basculement mock → réel)

---

**Co-validé par** : Esdras GBEDOZIN & Ismael AÏHOU
**Date de dernière mise à jour** : 12 février 2026
**Version** : 1.1 — MVP Baseline (post contre-expertise)
