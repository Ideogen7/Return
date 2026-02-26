import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';

import { LocalPhotoStorageService } from './local-photo-storage.service.js';
import type { PhotoUploadResult } from './interfaces/photo-storage.interface.js';

describe('LocalPhotoStorageService', () => {
  let service: LocalPhotoStorageService;
  const TEST_UPLOAD_DIR = join(process.cwd(), '.test-uploads');
  const TEST_BASE_URL = 'http://localhost:3000/uploads';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalPhotoStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue: string) => {
              if (key === 'UPLOAD_DIR') return TEST_UPLOAD_DIR;
              if (key === 'UPLOAD_BASE_URL') return TEST_BASE_URL;
              return defaultValue;
            },
          },
        },
      ],
    }).compile();

    service = module.get<LocalPhotoStorageService>(LocalPhotoStorageService);
  });

  afterAll(async () => {
    // Nettoyer le répertoire de test
    try {
      await rm(TEST_UPLOAD_DIR, { recursive: true, force: true });
    } catch {
      // Ignore si déjà supprimé
    }
  });

  describe('upload', () => {
    it('should write file to disk and return url', async () => {
      const buffer = Buffer.from('fake-image-data');
      const key = 'items/test-item-id/photo-1.jpg';

      const result: PhotoUploadResult = await service.upload(buffer, key);

      // Vérifier le retour
      expect(result.key).toBe(key);
      expect(result.url).toBe(`${TEST_BASE_URL}/${key}`);
      expect(result.thumbnailUrl).toBeNull();

      // Vérifier que le fichier existe sur disque
      const filePath = join(TEST_UPLOAD_DIR, key);
      const content = await readFile(filePath);
      expect(content).toEqual(buffer);
    });

    it('should create nested directories automatically', async () => {
      const buffer = Buffer.from('nested-image');
      const key = 'items/deep/nested/path/photo.jpg';

      const result = await service.upload(buffer, key);

      expect(result.url).toBe(`${TEST_BASE_URL}/${key}`);
      const filePath = join(TEST_UPLOAD_DIR, key);
      const content = await readFile(filePath);
      expect(content).toEqual(buffer);
    });
  });

  describe('delete', () => {
    it('should delete existing file', async () => {
      const key = 'items/to-delete/photo.jpg';
      const filePath = join(TEST_UPLOAD_DIR, key);

      // Créer le fichier d'abord
      await mkdir(join(TEST_UPLOAD_DIR, 'items', 'to-delete'), {
        recursive: true,
      });
      await writeFile(filePath, Buffer.from('to-delete'));

      // Supprimer
      await service.delete(key);

      // Vérifier la suppression
      await expect(access(filePath)).rejects.toThrow();
    });

    it('should delete file when called with full URL instead of key', async () => {
      const key = 'items/to-delete-url/photo.jpg';
      const filePath = join(TEST_UPLOAD_DIR, key);
      const fullUrl = `${TEST_BASE_URL}/${key}`;

      await mkdir(join(TEST_UPLOAD_DIR, 'items', 'to-delete-url'), {
        recursive: true,
      });
      await writeFile(filePath, Buffer.from('to-delete-via-url'));

      // Delete using full URL instead of key
      await service.delete(fullUrl);

      await expect(access(filePath)).rejects.toThrow();
    });

    it('should not throw when file does not exist (idempotent)', async () => {
      await expect(service.delete('nonexistent/file.jpg')).resolves.toBeUndefined();
    });
  });

  describe('getUrl', () => {
    it('should return the URL for a given key', async () => {
      const key = 'items/some-id/photo.jpg';

      const url = await service.getUrl(key);

      expect(url).toBe(`${TEST_BASE_URL}/${key}`);
    });
  });
});
