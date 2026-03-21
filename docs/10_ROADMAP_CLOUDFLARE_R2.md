# Migration Cloudflare R2 — Stockage Photos

> **Priorité** : HAUTE — les photos ne persistent pas en preprod (conteneurs Fly.io éphémères)
> **Estimation** : 1-2h
> **Assigné à** : Esdras (backend)
> **Branche** : `feature/cloudflare-r2` depuis `main`
> **Date** : 21 mars 2026

---

## Contexte

Le stockage photos utilise actuellement `LocalPhotoStorageService` (disque local). En preprod sur Fly.io, les fichiers
sont perdus à chaque redéploiement car les conteneurs sont éphémères. Il faut migrer vers Cloudflare R2 (S3-compatible).

L'architecture est déjà prête : l'interface abstraite `PhotoStorage` existe, il suffit de créer l'implémentation R2 et
de basculer l'injection.

---

## Prérequis — Créer le bucket Cloudflare R2

1. Aller sur [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 Object Storage
2. Créer un bucket nommé `return-photos` (région auto)
3. Dans les settings du bucket, activer **Public Access** (pour servir les URLs publiques) ou noter le domaine R2
   public (ex: `pub-xxxx.r2.dev` ou custom domain)
4. Aller dans R2 → Manage R2 API Tokens → Create API Token :
   - Permissions : Object Read & Write
   - Scope : bucket `return-photos` uniquement
   - Noter les credentials :
     - **Account ID** (visible dans l'URL du dashboard)
     - **Access Key ID**
     - **Secret Access Key**
     - **Bucket Name** : `return-photos`
     - **Public URL** : `https://<votre-domaine>.r2.dev` ou custom domain

---

## Étape 1 — Installer la dépendance S3

```bash
cd backend && npm install @aws-sdk/client-s3
```

Cloudflare R2 est 100% compatible avec l'API S3, donc on utilise le SDK AWS standard.

---

## Étape 2 — Ajouter les variables d'environnement

### `backend/.env.example` — ajouter à la fin :

```env
# Cloudflare R2 (photo storage — production)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=return-photos
R2_PUBLIC_URL=
```

### `backend/.env` — ajouter les valeurs locales (pour tester) :

```env
R2_ACCOUNT_ID=<votre-account-id>
R2_ACCESS_KEY_ID=<votre-access-key>
R2_SECRET_ACCESS_KEY=<votre-secret-key>
R2_BUCKET_NAME=return-photos
R2_PUBLIC_URL=https://<votre-domaine>.r2.dev
```

### `backend/src/config/env.validation.ts` — ajouter les validations :

```typescript
// Cloudflare R2 (required in production, optional in dev)
@IsOptional()
@IsString()
R2_ACCOUNT_ID?: string;

@IsOptional()
@IsString()
R2_ACCESS_KEY_ID?: string;

@IsOptional()
@IsString()
R2_SECRET_ACCESS_KEY?: string;

@IsOptional()
@IsString()
R2_BUCKET_NAME?: string;

@IsOptional()
@IsString()
R2_PUBLIC_URL?: string;
```

Les variables sont `@IsOptional()` car en dev on continue d'utiliser `LocalPhotoStorageService`.

---

## Étape 3 — Créer `R2PhotoStorageService`

Créer le fichier `backend/src/storage/r2-photo-storage.service.ts` :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import type { PhotoStorage, PhotoUploadResult } from './interfaces/photo-storage.interface.js';

@Injectable()
export class R2PhotoStorageService implements PhotoStorage {
  private readonly logger = new Logger(R2PhotoStorageService.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('R2_ACCOUNT_ID');
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = this.configService.getOrThrow<string>('R2_PUBLIC_URL');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });

    this.logger.log('R2 Photo Storage initialized');
  }

  async upload(file: Buffer, key: string): Promise<PhotoUploadResult> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: this.getContentType(key),
      }),
    );

    this.logger.debug(`Photo uploaded to R2: ${key}`);

    const url = `${this.publicUrl}/${key}`;
    return { key, url, thumbnailUrl: null };
  }

  async delete(key: string): Promise<void> {
    const resolvedKey = key.startsWith('http')
      ? key.replace(`${this.publicUrl}/`, '')
      : key;

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: resolvedKey,
      }),
    );

    this.logger.debug(`Photo deleted from R2: ${resolvedKey}`);
  }

  async getUrl(key: string): Promise<string> {
    return `${this.publicUrl}/${key}`;
  }

  private getContentType(key: string): string {
    if (key.endsWith('.png')) return 'image/png';
    if (key.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }
}
```

---

## Étape 4 — Basculer l'injection dans le module

Modifier `backend/src/storage/photo-storage.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PHOTO_STORAGE } from './interfaces/photo-storage.interface.js';
import { LocalPhotoStorageService } from './local-photo-storage.service.js';
import { R2PhotoStorageService } from './r2-photo-storage.service.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PHOTO_STORAGE,
      useFactory: (config: ConfigService) => {
        if (config.get<string>('R2_ACCOUNT_ID')) {
          return new R2PhotoStorageService(config);
        }
        return new LocalPhotoStorageService(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PHOTO_STORAGE],
})
export class PhotoStorageModule {}
```

**Logique** : si `R2_ACCOUNT_ID` est défini → R2. Sinon → local. Pas besoin de toucher à `NODE_ENV`.

---

## Étape 5 — Supprimer `useStaticAssets` en production

Dans `backend/src/main.ts`, localiser le bloc qui sert les fichiers uploadés via `app.useStaticAssets(...)` et le remplacer par :

```typescript
// Serve uploaded files (photos, avatars) at /uploads/*
app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
```

Par :

```typescript
// Serve uploaded files locally (dev only) — R2 sert directement via URL publique en production
if (!config.get<string>('R2_ACCOUNT_ID')) {
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
}
```

---

## Étape 6 — Mettre à jour les exports

Modifier `backend/src/storage/index.ts` :

```typescript
export { PhotoStorageModule } from './photo-storage.module.js';
export { LocalPhotoStorageService } from './local-photo-storage.service.js';
export { R2PhotoStorageService } from './r2-photo-storage.service.js';
export type { PhotoStorage, PhotoUploadResult } from './interfaces/index.js';
export { PHOTO_STORAGE } from './interfaces/index.js';
```

---

## Étape 7 — Configurer les secrets Fly.io

```bash
cd backend && fly secrets set \
  R2_ACCOUNT_ID=<votre-account-id> \
  R2_ACCESS_KEY_ID=<votre-access-key> \
  R2_SECRET_ACCESS_KEY=<votre-secret-key> \
  R2_BUCKET_NAME=return-photos \
  R2_PUBLIC_URL=https://<votre-domaine>.r2.dev \
  --app return-api
```

Puis redéployer :

```bash
cd backend && fly deploy
```

---

## Étape 8 — Tests

### Test unitaire `R2PhotoStorageService`

Créer `backend/src/storage/r2-photo-storage.service.spec.ts` :

- Mocker `@aws-sdk/client-s3` (S3Client.send)
- Tester upload → retourne `{ key, url, thumbnailUrl: null }`
- Tester delete → appelle DeleteObjectCommand
- Tester delete avec URL complète → résout la clé correctement
- Tester getUrl → retourne `publicUrl/key`

### Vérification manuelle

```bash
# En local (doit utiliser LocalPhotoStorage)
cd backend && npx nest start --watch
# → log: "LocalPhotoStorageService" (pas de R2_ACCOUNT_ID)

# En preprod (doit utiliser R2)
fly logs --app return-api
# → log: "R2 Photo Storage initialized"
```

### Test end-to-end

1. Ouvrir l'app sur téléphone (APK)
2. Créer un item avec photo → la photo doit s'afficher
3. Redéployer le backend (`fly deploy`)
4. Rouvrir l'app → la photo doit toujours être visible (persistée sur R2)

---

## Résumé des fichiers

| Fichier | Action |
|---------|--------|
| `backend/package.json` | Ajouter `@aws-sdk/client-s3` |
| `backend/.env.example` | Ajouter 5 variables R2 |
| `backend/.env` | Ajouter les valeurs locales |
| `backend/src/config/env.validation.ts` | Ajouter 5 validations `@IsOptional()` |
| `backend/src/storage/r2-photo-storage.service.ts` | **Nouveau** — implémentation R2 |
| `backend/src/storage/r2-photo-storage.service.spec.ts` | **Nouveau** — tests unitaires |
| `backend/src/storage/photo-storage.module.ts` | Modifier — `useFactory` avec switch R2/local |
| `backend/src/storage/index.ts` | Ajouter export R2 |
| `backend/src/main.ts` | Conditionner `useStaticAssets` |

**Aucune modification frontend nécessaire** — les URLs des photos sont gérées par le backend.

---

## Checklist avant merge

- [ ] `npm install @aws-sdk/client-s3` OK
- [ ] `R2PhotoStorageService` implémente `PhotoStorage` (upload, delete, getUrl)
- [ ] `photo-storage.module.ts` utilise `useFactory` pour switch R2/local
- [ ] `main.ts` conditionne `useStaticAssets` à l'absence de R2
- [ ] Variables R2 dans `.env.example` et `env.validation.ts`
- [ ] Tests unitaires R2 passent
- [ ] Tous les tests existants passent (`npx jest --verbose`)
- [ ] TypeScript compile (`npx tsc --noEmit`)
- [ ] Secrets configurés sur Fly.io (`fly secrets list`)
- [ ] Redéploiement OK (`fly deploy`)
- [ ] Photo uploadée visible après redéploiement
