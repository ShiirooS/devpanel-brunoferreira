import axios, { isAxiosError } from 'axios';

// Requests go through the Vite proxy, so the API is same-origin and the browser
// attaches the HttpOnly session cookie on its own: no token handling in JS.
export const http = axios.create({ baseURL: '/api' });

export function hasStatus(error: unknown, status: number): boolean {
  return isAxiosError(error) && error.response?.status === status;
}
