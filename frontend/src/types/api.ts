// Shapes returned by the NestJS API (docs/ai/PLAN.md §6).

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersLast30Days: number;
  byRole: Record<Role, number>;
}
