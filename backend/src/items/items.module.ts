import { Module } from '@nestjs/common';
import { ItemsService } from './items.service.js';
import { ItemsController } from './items.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PhotoStorageModule } from '../storage/photo-storage.module.js';

@Module({
  imports: [PrismaModule, PhotoStorageModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
