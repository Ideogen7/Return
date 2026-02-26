import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ConfigService } from '@nestjs/config';

import type { PhotoStorage, PhotoUploadResult } from './interfaces/photo-storage.interface.js';

// =============================================================================
// LocalPhotoStorage — Implémentation disque local (dev / tests)
// =============================================================================
// Stocke les fichiers dans <uploadDir>/ et sert les URLs via le baseUrl configuré.
// Remplaçable par R2PhotoStorage en production sans modifier le code métier (LSP).
// =============================================================================

@Injectable()
export class LocalPhotoStorageService implements PhotoStorage {
  private readonly logger = new Logger(LocalPhotoStorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', join(process.cwd(), 'uploads'));
    this.baseUrl = this.configService.get<string>(
      'UPLOAD_BASE_URL',
      'http://localhost:3000/uploads',
    );
  }

  async upload(file: Buffer, key: string): Promise<PhotoUploadResult> {
    const filePath = join(this.uploadDir, key);

    // Créer les répertoires intermédiaires si nécessaire
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file);

    this.logger.debug(`Photo uploaded locally: ${key}`);

    const url = `${this.baseUrl}/${key}`;

    return {
      key,
      url,
      thumbnailUrl: null, // Pas de génération de vignettes en local (V1)
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);

    try {
      await access(filePath);
      await unlink(filePath);
      this.logger.debug(`Photo deleted locally: ${key}`);
    } catch {
      // Fichier inexistant → idempotent, pas d'erreur
      this.logger.debug(`Photo not found locally (idempotent delete): ${key}`);
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${this.baseUrl}/${key}`;
  }
}
