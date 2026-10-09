import { create } from 'zustand';
import type { User } from '../../types/api';
import { setUnauthorizedHandler } from '../../lib/http';
import { fetchCurrentUser, logout as logoutRequest } from './authApi';

// 'unknown' until /auth/me answers: after a reload the cookie may still be valid,
// so the app must not redirect to /login before asking the API.
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  status: SessionStatus;
  user: User | null;
  restoreSession: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  clear: () => void;
}

// Shared so StrictMode's double effect run still sends a single /auth/me.
let pendingRestore: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'unknown',
  user: null,
  restoreSession: () => {
    if (get().status !== 'unknown') return Promise.resolve();
    pendingRestore ??= fetchCurrentUser()
      .then((user) => set({ status: 'authenticated', user }))
      .catch(() => set({ status: 'anonymous', user: null }))
      .finally(() => {
        pendingRestore = null;
      });
    return pendingRestore;
  },
  setUser: (user) => set({ status: 'authenticated', user }),
  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Even if the call fails, leave the session locally: the user asked to sign out.
    }
    set({ status: 'anonymous', user: null });
  },
  clear: () => set({ status: 'anonymous', user: null }),
}));

// Any 401 from the API (expired or invalid session) ends the local session.
setUnauthorizedHandler(() => useAuthStore.getState().clear());
