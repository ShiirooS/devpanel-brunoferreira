import { Injectable } from '@nestjs/common';
import { Role, UserStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const NEW_USERS_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersLast30Days: number;
  byRole: Record<Role, number>;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const since = new Date(Date.now() - NEW_USERS_WINDOW_DAYS * DAY_MS);

    const [totalUsers, activeUsers, newUsersLast30Days, roleGroups] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true }, orderBy: { role: 'asc' } }),
    ]);

    const byRole: Record<Role, number> = { ADMIN: 0, EDITOR: 0, VIEWER: 0 };
    for (const group of roleGroups) {
      byRole[group.role] = group._count._all;
    }

    return { totalUsers, activeUsers, newUsersLast30Days, byRole };
  }
}
