# Phase 1 — Déploiement Backend sur Fly.io

> **Date** : 21 mars 2026  
> **Auteur** : Esdras  
> **Branche** : `feature/preprod-phase-1`  
> **Status** : ✅ Complété (PREPROD-001 → PREPROD-008)

---

## 1. Architecture Déployée

```
Mobile (APK/TestFlight)
    │
    ▼
https://return-api.fly.dev/v1
    │
    ▼
┌─────────────────────────────┐
│  Fly.io Machine (cdg)       │
│  NestJS 11 + Node 22        │
│  shared-cpu-1x / 512 MB     │
│  Docker (node:22-slim)       │
└──────────┬──────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
Fly Postgres    Upstash Redis
(return-db)     (return-redis)
PostgreSQL 17   Pay-as-you-go
cdg region      cdg region
```

## 2. Ressources Provisionnées

| Ressource | Nom | Région | Détails |
|-----------|-----|--------|---------|
| App | `return-api` | cdg (Paris) | shared-cpu-1x, 512 MB RAM |
| PostgreSQL | `return-db` | cdg | Fly Postgres (unmanaged), 1 GB volume |
| Redis | `return-redis` | cdg | Upstash, pay-as-you-go, eviction disabled |

## 3. Secrets Configurés

| Secret | Source | Description |
|--------|--------|-------------|
| `DATABASE_URL` | Auto (fly postgres attach) | Connection string PostgreSQL |
| `REDIS_URL` | Manuel | URL Upstash Redis |
| `JWT_ACCESS_SECRET` | Généré (openssl rand) | Clé de signature JWT access tokens |
| `JWT_REFRESH_SECRET` | Généré (openssl rand) | Clé de signature JWT refresh tokens |
| `CORS_ORIGIN` | Manuel | `*` (preprod — à restreindre en prod) |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Copié du .env local | Credentials Firebase Admin SDK |

Les variables `NODE_ENV`, `PORT`, `API_PREFIX`, `LOG_LEVEL` sont définies dans `fly.toml` section `[env]` (non secrètes).

## 4. Fichiers Modifiés

### `backend/fly.toml` (nouveau)
Configuration Fly.io :
- App `return-api`, région `cdg`
- `release_command` : `npx prisma migrate deploy` (exécuté avant chaque déploiement)
- Health check : `GET /health` toutes les 30s
- Auto-stop/start des machines (économie de coûts)
- Concurrency : soft 200, hard 250 requests

### `backend/Dockerfile`
- **Fix** : `CMD ["node", "dist/src/main.js"]` (au lieu de `dist/main.js`)
- Le build TypeScript place les fichiers dans `dist/src/` car `prisma.config.ts` à la racine étend la structure de sortie

### `backend/src/main.ts`
- **Fix** : `app.listen(port, '0.0.0.0')` — Fly.io nécessite l'écoute sur toutes les interfaces

### `backend/src/health/health.service.ts`
- **Fix** : Injecte `FirebaseService` et utilise `isAvailable()` au lieu du statut FCM hardcodé à `'error'`

## 5. Endpoints Vérifiés

```bash
# Liveness (simple check)
curl https://return-api.fly.dev/health
# → {"status":"ok","timestamp":"...","version":"0.1.0"}

# Readiness (DB + Redis + FCM)
curl https://return-api.fly.dev/ready
# → {"status":"ok","checks":{"database":"ok","redis":"ok","fcm":"ok"}}

# API (test login)
curl -X POST https://return-api.fly.dev/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
# → 401 RFC 7807 (normal, user n'existe pas)
```

## 6. Commandes Utiles

### Fly CLI (installer si pas fait)
```bash
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
flyctl auth login
```

### Gestion de l'app
```bash
# Voir le status
flyctl status --app return-api

# Voir les logs en temps réel
flyctl logs --app return-api

# Lister les secrets
flyctl secrets list --app return-api

# Redéployer (depuis backend/)
cd backend && flyctl deploy

# Forcer un rebuild complet
cd backend && flyctl deploy --no-cache

# Se connecter en SSH à la machine
flyctl ssh console --app return-api

# Ouvrir la console PostgreSQL
flyctl postgres connect --app return-db
```

### Ajouter un collaborateur
```bash
flyctl orgs invite <email> --org personal
```

## 7. Coûts Estimés (Preprod)

| Service | Coût |
|---------|------|
| Fly Machine (shared-cpu-1x, 512 MB) | ~$3-5/mois (auto-stop) |
| Fly Postgres (1 GB) | ~$0 (free allowance) |
| Upstash Redis (pay-as-you-go) | ~$0-1/mois |
| **Total estimé** | **~$3-6/mois** |

## 8. Prochaines Étapes

- **Phase 2** (Ismael) : Configurer le frontend pour pointer vers `https://return-api.fly.dev/v1`
- **Phase 3** (Ismael) : Build APK Android
- **Phase 4** (Ensemble) : Tests sur devices réels
- **Phase 5a** : Google Play Internal Testing
- **Phase 5b** : iOS TestFlight (nécessite Apple Developer $99/an)

## 9. Notes Importantes

- Le `CORS_ORIGIN` est à `*` en preprod. À restreindre en production.
- Les JWT secrets ont été générés avec `openssl rand -base64 48` (64 caractères).
- Le ProdPack Upstash n'est PAS activé (malgré l'affichage CLI qui peut indiquer "Enabled").
- Les migrations Prisma s'exécutent automatiquement via le `release_command` dans `fly.toml`.
- L'app s'arrête automatiquement quand il n'y a pas de trafic (économie) et redémarre sur la première requête.
