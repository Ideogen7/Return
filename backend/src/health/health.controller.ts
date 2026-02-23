import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service.js';
import type { HealthStatus, ReadinessStatus } from './health.service.js';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth(): HealthStatus {
    return this.healthService.getHealth();
  }

  @Get('ready')
  async getReady(@Res({ passthrough: true }) res: Response): Promise<ReadinessStatus> {
    const readiness = await this.healthService.getReadiness();
    if (readiness.status === 'error') {
      res.status(503);
    }
    return readiness;
  }
}
