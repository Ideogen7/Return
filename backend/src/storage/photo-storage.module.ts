import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PHOTO_STORAGE } from './interfaces/photo-storage.interface.js';
import { LocalPhotoStorageService } from './local-photo-storage.service.js';

// =============================================================================
// PhotoStorageModule
// =============================================================================
// Fournit l'injection PHOTO_STORAGE avec l'implémentation locale (dev/tests).
// Pour la production (R2), remplacer useClass par R2PhotoStorageService.
// =============================================================================

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PHOTO_STORAGE,
      useClass: LocalPhotoStorageService,
    },
  ],
  exports: [PHOTO_STORAGE],
})
export class PhotoStorageModule {}
