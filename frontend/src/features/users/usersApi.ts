import { http } from '../../lib/http';
import type { Role, UsersPage, UserStatus } from '../../types/api';

export interface UsersQuery {
  search: string;
  page: number;
  pageSize: number;
  role: Role | '';
  status: UserStatus | '';
}

export async function fetchUsers(query: UsersQuery, signal: AbortSignal): Promise<UsersPage> {
  const { search, page, pageSize, role, status } = query;
  // Empty filters are omitted so the request matches "no filter" exactly.
  const params = {
    page,
    pageSize,
    ...(search && { search }),
    ...(role && { role }),
    ...(status && { status }),
  };
  const { data } = await http.get<UsersPage>('/users', { params, signal });
  return data;
}
