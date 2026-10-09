// Shapes returned by the NestJS API (docs/ai/PLAN.md §6).

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// The authenticated user, as returned by /auth/login and /auth/me.
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
}

// A row of GET /users. Dates are ISO strings; lastLoginAt is null until the first login.
export interface UserListItem extends User {
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UsersPage {
  data: UserListItem[];
  meta: PageMeta;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersLast30Days: number;
  byRole: Record<Role, number>;
}
