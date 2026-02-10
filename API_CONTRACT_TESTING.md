# API_CONTRACT_TESTING.md
**Return ↺ - Stratégie de Tests de Contrat (Contract Testing)**

---

## 1. Qu'est-ce que le Contract Testing ?

Les **tests de contrat** vérifient que le **fournisseur** (backend) et le **consommateur** (frontend mobile) respectent le même contrat d'API défini dans `openapi.yaml`.

**Différence avec les tests E2E classiques** :
- **E2E** : Teste le flow complet (UI → API → DB → API → UI). Lent, fragile.
- **Contract Testing** : Teste uniquement l'interface API (request/response). Rapide, ciblé.

**Problème résolu** :
> "Le backend a changé le format de la réponse `/loans` (ajout d'un champ obligatoire), mais le frontend n'est pas au courant → l'app crash en production."

Les tests de contrat détectent ce problème **avant** le merge.

---

## 2. Outil Choisi : Pact (Pact Foundation)

**Pact** est le standard de facto pour le contract testing. Il utilise une approche **consumer-driven** :

1. Le **consumer** (React Native) génère un contrat Pact décrivant ses attentes
2. Le **provider** (NestJS backend) valide qu'il respecte ce contrat
3. Les deux équipes peuvent évoluer indépendamment tant que le contrat est respecté

-----Contre Expertise--------
**Pact repose sur le postulat de "deux équipes indépendantes"** : Le point 3 ci-dessus dit "les deux équipes peuvent évoluer indépendamment". Or il s'agit de la **même équipe de 2 développeurs** qui fait le front et le back. L'intérêt principal de Pact (synchronisation inter-équipes asynchrone) n'existe pas ici. L'approche **OpenAPI-first** (spec partagée → Prism mock → tests Supertest) couvre le même besoin sans la complexité supplémentaire de Pact (broker, publication, vérification, state handlers). Ce document entier, bien que pédagogiquement intéressant, décrit une infrastructure surdimensionnée pour le contexte du projet.
-----Fin Contre Expertise--------

**Alternatives rejetées** :
- **Spring Cloud Contract** : Spécifique Java (incompatible avec NestJS)
- **Dredd** : Validation unidirectionnelle (pas de feedback du consumer)
- **Postman Contract Testing** : Moins mature, lock-in outil propriétaire

---

## 3. Architecture du Contract Testing

```
┌─────────────────────────────────────────────────────────────┐
│  CONSUMER (React Native)                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Pact Tests (loan.pact.spec.ts)                      │    │
│  │ - Enregistre les requêtes attendues                 │    │
│  │ - Définit les réponses attendues                    │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│                  ┌───────────────┐                           │
│                  │  loan.json    │ (Pact file)               │
│                  │  (contrat)    │                           │
│                  └───────┬───────┘                           │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           │ Publication vers Pact Broker
                           │
                           ▼
                  ┌─────────────────┐
                  │  Pact Broker    │ (serveur central)
                  │  (optionnel)    │
                  └────────┬────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│  PROVIDER (NestJS Backend)                                   │
│                          │                                   │
│                          ▼                                   │
│                  ┌───────────────┐                           │
│                  │  loan.json    │ (téléchargé depuis Broker)│
│                  │  (contrat)    │                           │
│                  └───────┬───────┘                           │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Pact Verification (loan.provider.spec.ts)          │    │
│  │ - Rejoue les requêtes du consumer                  │    │
│  │ - Vérifie que les réponses correspondent           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Implémentation Côté Consumer (React Native)

### 4.1 Installation

```bash
npm install --save-dev @pact-foundation/pact jest
```

### 4.2 Configuration

```typescript
// __tests__/pact/setup.ts
import { Pact } from '@pact-foundation/pact';
import path from 'path';

export const provider = new Pact({
  consumer: 'ReturnMobileApp',
  provider: 'ReturnAPI',
  port: 1234, // Port local pour le mock Pact
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});
```

### 4.3 Exemple de Test de Contrat

```typescript
// __tests__/pact/loan.pact.spec.ts
import { provider } from './setup';
import { like, iso8601DateTime } from '@pact-foundation/pact/src/dsl/matchers';

describe('Loan API Contract', () => {
  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('POST /loans', () => {
    it('creates a loan with pending confirmation status', async () => {
      // Définir les attentes du consumer
      await provider.addInteraction({
        state: 'user is authenticated',
        uponReceiving: 'a request to create a loan',
        withRequest: {
          method: 'POST',
          path: '/v1/loans',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer some-token',
          },
          body: {
            item: {
              name: 'Perceuse Bosch',
              category: 'TOOLS',
              estimatedValue: 129.99,
            },
            borrower: {
              firstName: 'Marie',
              lastName: 'Dupont',
              email: 'marie.dupont@example.com',
            },
            returnDate: '2026-03-15',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like('loan-123'),
            item: {
              id: like('item-456'),
              name: 'Perceuse Bosch',
              category: 'TOOLS',
              estimatedValue: 129.99,
            },
            borrower: {
              id: like('borrower-789'),
              firstName: 'Marie',
              lastName: 'Dupont',
              email: 'marie.dupont@example.com',
            },
            status: 'PENDING_CONFIRMATION',
            returnDate: '2026-03-15',
            createdAt: iso8601DateTime('2026-02-08T14:00:00Z'),
            updatedAt: iso8601DateTime('2026-02-08T14:00:00Z'),
          },
        },
      });

      // Appeler l'API avec le client réel
      const loan = await createLoan({
        item: { name: 'Perceuse Bosch', category: 'TOOLS', estimatedValue: 129.99 },
        borrower: { firstName: 'Marie', lastName: 'Dupont', email: 'marie.dupont@example.com' },
        returnDate: '2026-03-15',
      });

      // Vérifier le comportement
      expect(loan.status).toBe('PENDING_CONFIRMATION');
      expect(loan.item.name).toBe('Perceuse Bosch');
    });
  });

  describe('GET /loans/{loanId}', () => {
    it('returns 404 when loan does not exist', async () => {
      await provider.addInteraction({
        state: 'user is authenticated',
        uponReceiving: 'a request for a non-existent loan',
        withRequest: {
          method: 'GET',
          path: '/v1/loans/loan-999',
          headers: {
            'Authorization': 'Bearer some-token',
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: like('https://api.return.app/errors/loan-not-found'),
            title: 'Loan Not Found',
            status: 404,
            detail: like('The loan with ID \'loan-999\' does not exist.'),
            instance: '/v1/loans/loan-999',
            timestamp: iso8601DateTime('2026-02-08T14:32:00Z'),
            requestId: like('req-7f3c9a2b'),
          },
        },
      });

      // Appeler l'API et vérifier l'erreur
      await expect(getLoanById('loan-999')).rejects.toMatchObject({
        status: 404,
        type: 'https://api.return.app/errors/loan-not-found',
      });
    });
  });
});
```

### 4.4 Exécution des Tests

```bash
npm run test:pact
```

**Résultat** : Un fichier `pacts/ReturnMobileApp-ReturnAPI.json` est généré.

---

## 5. Implémentation Côté Provider (NestJS Backend)

### 5.1 Installation

```bash
npm install --save-dev @pact-foundation/pact
```

### 5.2 Configuration

```typescript
// test/pact/loan.provider.spec.ts
import { Verifier } from '@pact-foundation/pact';
import path from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('Pact Verification', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Démarrer l'application NestJS
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates the expectations of ReturnMobileApp', async () => {
    const opts = {
      provider: 'ReturnAPI',
      providerBaseUrl: 'http://localhost:3000', // URL du backend de test
      pactUrls: [
        path.resolve(__dirname, '../../pacts/ReturnMobileApp-ReturnAPI.json'),
      ],
      stateHandlers: {
        'user is authenticated': async () => {
          // Setup : Créer un utilisateur de test et générer un token
          const user = await createTestUser({ email: 'test@example.com' });
          const token = generateJWT(user.id);
          process.env.TEST_AUTH_TOKEN = token;
        },
        'loan loan-123 exists': async () => {
          // Setup : Créer un prêt en base de test
          await createTestLoan({ id: 'loan-123', status: 'ACTIVE' });
        },
      },
      requestFilter: (req, res, next) => {
        // Injecter le token de test si nécessaire
        if (process.env.TEST_AUTH_TOKEN) {
          req.headers['authorization'] = `Bearer ${process.env.TEST_AUTH_TOKEN}`;
        }
        next();
      },
    };

    const verifier = new Verifier(opts);
    await verifier.verifyProvider();
  });
});
```

### 5.3 Exécution de la Vérification

```bash
npm run test:pact:provider
```

**Résultat** :
- ✅ Si toutes les interactions passent → Le backend respecte le contrat
- ❌ Si une interaction échoue → Détail de l'écart (champ manquant, mauvais type, etc.)

---

## 6. Utilisation du Pact Broker (Production)

Le **Pact Broker** est un serveur central qui stocke les contrats et facilite la collaboration entre équipes.

### 6.1 Déploiement du Broker (Docker)

-----Contre Expertise--------
**Pact Broker = infrastructure supplémentaire à maintenir** : Le Broker nécessite un serveur Docker + une base PostgreSQL dédiée. C'est un service de plus à déployer, monitorer, et maintenir. Pour 2 développeurs, le fichier `.pact` peut simplement être partagé via le repository Git (ou un artefact CI). Le Broker n'apporte de la valeur que quand plusieurs équipes/repos consomment le même contrat.
-----Fin Contre Expertise--------

```bash
docker run -d \
  --name pactbroker \
  -p 9292:9292 \
  -e PACT_BROKER_DATABASE_URL=postgres://user:pass@postgres/pactbroker \
  pactfoundation/pact-broker:latest
```

### 6.2 Publication du Contrat (Consumer)

```bash
# Dans le projet React Native
npx pact-broker publish \
  ./pacts \
  --consumer-app-version=$(git rev-parse HEAD) \
  --broker-base-url=https://pact.return.app \
  --broker-username=admin \
  --broker-password=secret
```

### 6.3 Vérification depuis le Broker (Provider)

```typescript
// Modifier loan.provider.spec.ts
const opts = {
  provider: 'ReturnAPI',
  providerBaseUrl: 'http://localhost:3000',
  pactBrokerUrl: 'https://pact.return.app',
  pactBrokerUsername: 'admin',
  pactBrokerPassword: 'secret',
  publishVerificationResult: true,
  providerVersion: process.env.GIT_COMMIT,
};
```

### 6.4 Workflow CI/CD

```yaml
# .github/workflows/pact.yml
name: Pact Contract Tests

on: [push, pull_request]

jobs:
  consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:pact
      - name: Publish Pact
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}

  provider:
    runs-on: ubuntu-latest
    needs: consumer
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:pact:provider
```

---

## 7. Avantages du Contract Testing

✅ **Détection précoce** : Cassure de contrat détectée avant production  
✅ **Développement parallèle** : Frontend et backend progressent indépendamment  
✅ **Documentation vivante** : Les tests de contrat servent de spécification exécutable  
✅ **Refactoring sûr** : Changements internes du backend sans impact si le contrat est respecté  
✅ **Feedback rapide** : Tests plus rapides qu'un E2E complet (pas de UI, pas de DB réelle)

---

## 8. Cas d'Usage Concrets

### Cas 1 : Le Backend Change le Format de Date

**Avant** :
```json
{ "createdAt": "2026-02-08T14:00:00Z" }
```

**Après (changement backend)** :
```json
{ "createdAt": 1675868400 } // Timestamp Unix
```

**Résultat Pact** :
```
❌ Verification failed for GET /loans
Expected: ISO 8601 DateTime (string)
Actual: Unix timestamp (number)
```

→ Le provider doit **soit** :
- Revenir au format ISO 8601
- Négocier un nouveau contrat avec le consumer

### Cas 2 : Le Frontend Ajoute un Champ Optionnel

Le consumer met à jour son contrat pour accepter un nouveau champ `item.photos` (optionnel).

**Comportement** :
- Le provider (backend) continue de fonctionner sans `photos` → Tests passent ✅
- Quand le backend implémente `photos`, le consumer l'utilise automatiquement

→ Évolution non-bloquante.

---

## 9. Limites du Contract Testing

**Ce que Pact NE vérifie PAS** :
- ❌ **Logique métier** : Pact ne teste pas si `PENDING_CONFIRMATION` → `ACTIVE` est valide
- ❌ **Performance** : Pas de mesure de latence
- ❌ **Sécurité** : Pas de test de JWT invalide (sauf si explicitement défini)
- ❌ **Données réelles** : Pas de vérification sur une vraie base de données

**Complément nécessaire** :
- Tests unitaires (logique métier)
- Tests E2E (flows complets)
- Tests de charge (performance)

---

## 10. Checklist de Mise en Place

- [ ] Installer Pact dans le projet mobile (consumer)
- [ ] Installer Pact dans le projet backend (provider)
- [ ] Écrire au moins 1 test de contrat par endpoint critique (login, create loan, list loans)
- [ ] Configurer les "state handlers" côté provider (setup des données de test)
- [ ] Intégrer Pact dans la CI/CD (publication + vérification automatique)
- [ ] (Optionnel) Déployer un Pact Broker pour la collaboration
- [ ] Documenter le workflow dans le README du projet

---

## 11. Commandes Essentielles

```bash
# Consumer (React Native)
npm run test:pact                    # Générer le contrat
npx pact-broker publish ./pacts      # Publier vers le broker

# Provider (NestJS)
npm run test:pact:provider           # Vérifier le contrat localement
npm run test:pact:provider:ci        # Vérifier depuis le broker

# Afficher les contrats publiés
npx pact-broker list-latest-pact-versions \
  --broker-base-url=https://pact.return.app
```

---

**Résumé en 1 phrase** :  
> Pact garantit que le frontend React Native et le backend NestJS parlent le même langage (contrat API) en testant automatiquement leurs interactions, détectant les incompatibilités avant la production.

---

-----Contre Expertise--------
**Recommandation globale** : Ce document est bien rédigé et pédagogique. Il peut servir de référence si l'équipe grandit (3+ développeurs séparés front/back). Mais pour le MVP à 2 développeurs, **Pact est overkill**. L'approche recommandée est :
1. OpenAPI spec comme contrat unique (déjà en place)
2. Prism mock pour le développement frontend (déjà documenté)
3. Tests Supertest côté backend pour valider les endpoints
4. Tests d'intégration au moment du basculement mock → réel

Cette approche couvre 95% des bénéfices de Pact avec 20% de la complexité.
-----Fin Contre Expertise--------

**Auteur** : Return Team
**Version** : 1.0
**Date** : 8 février 2026

---

**Contre-expertise par :** Ismael AÏHOU
**Date :** 10 février 2026
