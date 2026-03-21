import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const base64 = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');

    if (!base64) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 not set — push notifications disabled');
      return;
    }

    try {
      const serviceAccount = JSON.parse(
        Buffer.from(base64, 'base64').toString('utf-8'),
      ) as admin.ServiceAccount;

      const app =
        admin.apps.length > 0
          ? admin.app()
          : admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });

      this.messaging = app.messaging();
      this.logger.log('Firebase Admin SDK initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize Firebase: ${String(error)}`);
    }
  }

  isAvailable(): boolean {
    return this.messaging !== null;
  }

  async sendToMultipleTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string[]> {
    if (!this.messaging || tokens.length === 0) return [];

    const BATCH_SIZE = 500;
    const invalidTokenCodes = new Set([
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
    ]);
    const allInvalidTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      try {
        const message: admin.messaging.MulticastMessage = {
          tokens: batch,
          notification: { title, body },
          ...(data && { data }),
        };

        const response = await this.messaging.sendEachForMulticast(message);

        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error && invalidTokenCodes.has(resp.error.code)) {
            allInvalidTokens.push(batch[idx]);
            this.logger.warn(
              `Invalid FCM token detected: ${batch[idx].slice(0, 6)}…${batch[idx].slice(-4)}`,
            );
          } else if (!resp.success && resp.error) {
            this.logger.error(
              `FCM send failed for token ${batch[idx].slice(0, 6)}…${batch[idx].slice(-4)}: ${resp.error.code}`,
            );
          }
        });
      } catch (error) {
        this.logger.error(`FCM multicast failed: ${String(error)}`);
      }
    }

    return allInvalidTokens;
  }
}
