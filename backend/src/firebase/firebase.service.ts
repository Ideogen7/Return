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

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.messaging) return;

    try {
      const message: admin.messaging.Message = {
        token,
        notification: { title, body },
        ...(data && { data }),
      };

      await this.messaging.send(message);
    } catch (error) {
      this.logger.error(
        `FCM send failed for token ${token.slice(0, 6)}…${token.slice(-4)}: ${String(error)}`,
      );
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    await Promise.allSettled(
      tokens.map((token) => this.sendPushNotification(token, title, body, data)),
    );
  }
}
