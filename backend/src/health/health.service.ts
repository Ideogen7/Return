import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { FirebaseService } from '../firebase/firebase.service.js';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  version: string;
}

export interface ReadinessStatus {
  status: 'ok' | 'error';
  checks: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
    fcm: 'ok' | 'error';
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly firebase: FirebaseService,
  ) {}

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    let dbStatus: 'ok' | 'error' = 'ok';
    let redisStatus: 'ok' | 'error' = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    try {
      await this.redis.getClient().ping();
    } catch {
      redisStatus = 'error';
    }

    // FCM check — vérifie si Firebase Admin SDK est initialisé
    const fcmStatus: 'ok' | 'error' = this.firebase.isAvailable() ? 'ok' : 'error';

    const allOk = dbStatus === 'ok' && redisStatus === 'ok' && fcmStatus === 'ok';

    return {
      status: allOk ? 'ok' : 'error',
      checks: { database: dbStatus, redis: redisStatus, fcm: fcmStatus },
    };
  }
}
