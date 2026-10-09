import { http } from '../../lib/http';
import type { User } from '../../types/api';

export interface Credentials {
  email: string;
  password: string;
}

export async function login(credentials: Credentials): Promise<User> {
  const { data } = await http.post<{ user: User }>('/auth/login', credentials);
  return data.user;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await http.get<{ user: User }>('/auth/me');
  return data.user;
}
