import { http } from '../../lib/http';
import type { UsersPage } from '../../types/api';

export interface UsersQuery {
  search: string;
  page: number;
  pageSize: number;
}

export async function fetchUsers(query: UsersQuery, signal: AbortSignal): Promise<UsersPage> {
  const { search, page, pageSize } = query;
  // An empty search is omitted so the request matches "no filter" exactly.
  const params = { page, pageSize, ...(search ? { search } : {}) };
  const { data } = await http.get<UsersPage>('/users', { params, signal });
  return data;
}
