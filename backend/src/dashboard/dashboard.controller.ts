import { Controller, Get } from '@nestjs/common';
import { DashboardService, type DashboardMetrics } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('metrics')
  getMetrics(): Promise<DashboardMetrics> {
    return this.dashboard.getMetrics();
  }
}
