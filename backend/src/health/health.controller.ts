import { Controller, Get } from '@nestjs/common';
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
  async getReady(): Promise<ReadinessStatus> {
    return this.healthService.getReadiness();
  }
}
