# API_MOCKING_STRATEGY.md

**Return ↺ - Stratégie de Mocking de l'API**

---

## 1. Pourquoi Mocker l'API ?

Le mocking de l'API permet de :

- **Développement parallèle** : Le frontend peut progresser sans attendre le backend
- **Tests isolés** : Valider le comportement du mobile sans dépendance réseau
- **Documentation vivante** : Le mock valide que l'OpenAPI spec est cohérente
- **Démos offline** : Présenter l'app sans serveur (salons, démo investisseurs)

---

## 2. Outil Choisi : Prism (Stoplight)

**Prism** est un serveur HTTP mock qui :

- Génère des réponses réalistes basées sur l'OpenAPI spec
- Valide automatiquement les requêtes entrantes
- Supporte les exemples personnalisés
- Simule les codes d'erreur (400, 401, 404, etc.)

**Avantages vs alternatives (MirageJS, JSON Server)** :

- Pas de code à écrire (directement depuis le YAML)
- Validation stricte du contrat OpenAPI
- CLI facile à intégrer en CI/CD
- Support complet d'OpenAPI 3.1

-----Contre Expertise--------
**Prism : bon choix, mais attention aux limites en mode `--dynamic`** : Le mode `--dynamic` génère des données
aléatoires, ce qui est pratique pour démarrer mais problématique pour les tests répétables. Un `POST /loans` retournera
un `id` aléatoire différent à chaque appel, rendant impossible le chaînage `create → get by id` dans les tests
automatisés. Recommandation : privilégier le mode **examples** (exemples définis dans l'OpenAPI spec) pour les flows de
test, et réserver `--dynamic` pour l'exploration manuelle.
-----Fin Contre Expertise--------

---

## 3. Installation et Lancement

### Installation Globale (Recommandée)

```bash
npm install -g @stoplight/prism-cli
```

### Lancement du Serveur Mock

```bash
# Depuis la racine du projet
prism mock openapi.yaml \
  --host 0.0.0.0 \
  --port 3000 \
  --cors \
  --dynamic
```

**Paramètres expliqués** :

- `--host 0.0.0.0` : Accessible depuis le réseau (utile pour tester sur mobile physique)
- `--port 3000` : Port d'écoute (correspond à l'URL de dev dans l'OpenAPI)
- `--cors` : Active CORS pour les requêtes cross-origin
- `--dynamic` : Génère des données aléatoires réalistes si aucun exemple n'est fourni

### Alternative : Via package.json

```json
{
  "scripts": {
    "mock:api": "prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors --dynamic"
  },
  "devDependencies": {
    "@stoplight/prism-cli": "^5.5.0"
  }
}
```

Puis lancer :

```bash
npm run mock:api
```

---

## 4. Utilisation Avancée

### 4.1 Forcer un Code d'Erreur Spécifique

Prism retourne le premier code 2xx par défaut. Pour tester une erreur :

```bash
# Via header Prefer
curl -H "Prefer: code=404" http://localhost:3000/v1/loans/loan-999
```

Ou dans le code React Native :

```typescript
const response = await fetch('http://localhost:3000/v1/loans/loan-999', {
    headers: {
        'Prefer': 'code=404',
    },
});
// Retournera la réponse 404 NotFound définie dans l'OpenAPI
```

### 4.2 Sélectionner un Exemple Spécifique

Si plusieurs exemples sont définis pour un endpoint :

```bash
curl -H "Prefer: example=multipleErrors" \
  -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
```

### 4.3 Mode Proxy (Hybrid Mock)

Combiner mock + vrai backend :

```bash
prism proxy openapi.yaml https://staging-api.return.app \
  --errors # Mock uniquement les erreurs, forward le reste au vrai backend
```

**Cas d'usage** : Tester les flows d'erreur sans casser les données de staging.

---

## 5. Validation des Requêtes

Prism valide automatiquement :

- Format des données (types, regex, longueurs)
- Headers manquants (ex: Authorization)
- Paramètres de query invalides

**Exemple de réponse de validation** :

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "password": "123"}'
```

Retourne :

```json
{
  "type": "https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY",
  "title": "Invalid request body payload",
  "status": 422,
  "detail": "Request body does not match the schema.",
  "validation": [
    {
      "location": [
        "body",
        "email"
      ],
      "severity": "Error",
      "code": "format",
      "message": "must match format \"email\""
    },
    {
      "location": [
        "body",
        "password"
      ],
      "severity": "Error",
      "code": "minLength",
      "message": "must NOT have fewer than 8 characters"
    }
  ]
}
```

---

## 6. Intégration avec React Native

### Configuration pour le Mobile

**iOS Simulator / Android Emulator** :

```typescript
// config/api.ts
const API_BASE_URL =
    __DEV__ && USE_MOCK
        ? 'http://localhost:3000/v1'
        : 'https://api.return.app/v1';

export default API_BASE_URL;
```

**Device Physique** :

Remplacer `localhost` par l'IP de votre machine :

```typescript
const API_BASE_URL = __DEV__
    ? 'http://192.168.1.100:3000/v1' // IP locale
    : 'https://api.return.app/v1';
```

### Exemple d'Appel avec Mock

```typescript
import API_BASE_URL from './config/api';

async function createLoan(data: CreateLoanDto) {
    const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error); // RFC 7807 format
    }

    return response.json();
}
```

---

## 7. Tests Automatisés avec le Mock

### Intégration dans Jest

-----Contre Expertise--------
**Confusion entre Prism et MSW** : Le code ci-dessous importe `msw/node` (Mock Service Worker), pas Prism. MSW et Prism
sont deux outils différents avec des philosophies différentes. MSW intercepte les requêtes au niveau réseau dans
Node.js, tandis que Prism est un serveur HTTP externe. Le document mélange les deux sans trancher. Pour les tests Jest
frontend, **MSW est plus adapté** (pas besoin de lancer un serveur externe). Clarifier : Prism pour le développement
interactif, MSW pour les tests automatisés.
-----Fin Contre Expertise--------

```typescript
// __tests__/api/loans.test.ts
import {setupServer} from 'msw/node';
import {rest} from 'msw';

// Alternative : utiliser Prism directement dans les tests
describe('Loan API', () => {
    it('should create a loan successfully', async () => {
        const loan = await createLoan({
            item: {name: 'Test Item', category: 'TOOLS'},
            borrower: {firstName: 'John', lastName: 'Doe'},
            returnDate: '2026-03-15',
        });

        expect(loan.status).toBe('PENDING_CONFIRMATION');
    });

    it('should fail with 401 if not authenticated', async () => {
        // Prism retourne automatiquement 401 si header Authorization manquant
        await expect(createLoanWithoutAuth()).rejects.toThrow('Unauthorized');
    });
});
```

---

## 8. Limites du Mock

**Ce que Prism NE fait PAS** :

- ❌ **Persistence** : Les données ne sont pas sauvegardées entre requêtes
- ❌ **Logique métier** : Pas de validation de workflow (ex: impossible de passer de RETURNED → ACTIVE)
- ❌ **Authentification réelle** : N'importe quel token JWT est accepté
- ❌ **Side effects** : Pas de notifications push réelles

**Solutions** :

- Pour tests E2E complexes : utiliser un backend de test (Testcontainers + vraie BDD)
- Pour démos : pré-remplir des données fictives via scripts

---

## 9. Workflow de Développement Recommandé

```
1. Design de l'API (openapi.yaml)
   ↓
2. Lancer Prism Mock
   ↓
3. Développement Frontend (consomme le mock)
   ↓
4. Développement Backend (en parallèle)
   ↓
5. Tests de Contrat (Pact) pour valider l'alignement
   ↓
6. Remplacement progressif du mock par le vrai backend
```

**Commandes quotidiennes** :

```bash
# Terminal 1 : Mock API
npm run mock:api

# Terminal 2 : Frontend mobile
npm run ios

# Terminal 3 : Backend (développement parallèle)
npm run start:dev
```

---

## 10. Checklist de Validation

Avant de considérer le mock comme source de vérité :

- [ ] Tous les endpoints de l'OpenAPI ont au moins un exemple
- [ ] Les codes d'erreur (400, 401, 403, 404, 409, 429, 500) sont documentés
- [ ] Prism démarre sans erreur de parsing YAML
- [ ] Les requêtes invalides retournent bien des erreurs de validation
- [ ] Le frontend peut effectuer un flow complet (register → login → create loan → list loans)

-----Contre Expertise--------
**Checklist de validation : difficile à satisfaire avec Prism seul** : Le dernier point "flow complet (register →
login → create loan → list loans)" est impossible avec Prism car il n'a **pas de persistence** (comme mentionné en
section 8). Le loan créé par `POST /loans` ne sera pas retourné par `GET /loans`. Ce flow ne peut être validé qu'avec le
vrai backend ou un mock plus avancé (MSW avec state, ou un fake server custom). Ajuster la checklist pour refléter les
limites de Prism.
-----Fin Contre Expertise--------

---

**Commande Finale pour Lancer le Mock** :

```bash
prism mock openapi.yaml --host 0.0.0.0 --port 3000 --cors --dynamic
```

Le serveur mock écoute sur : **http://localhost:3000/v1**

---

**Auteur** : Return Team
**Version** : 1.0
**Date** : 8 février 2026

---

**Contre-expertise par :** Ismael AÏHOU
**Date :** 10 février 2026
