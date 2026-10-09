import axios, { isAxiosError } from 'axios';

// Requests go through the Vite proxy, so the API is same-origin and the browser
// attaches the HttpOnly session cookie on its own: no token handling in JS.
export const http = axios.create({ baseURL: '/api' });

export function hasStatus(error: unknown, status: number): boolean {
  return isAxiosError(error) && error.response?.status === status;
}

// The auth store registers itself here, so this file doesn't import it (that would be a cycle).
let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

http.interceptors.response.use(undefined, (error: unknown) => {
  // A 401 on the login form just means wrong credentials. Anywhere else it means
  // the session is gone, so drop it and the protected route sends the user to /login.
  if (hasStatus(error, 401) && !(isAxiosError(error) && error.config?.url === '/auth/login')) {
    onUnauthorized();
  }
  return Promise.reject(error);
});
