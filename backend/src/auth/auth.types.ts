import type { Role, UserStatus } from '../generated/prisma/client.js';

export const SESSION_COOKIE = 'devpanel_session';

/** Payload signed into the session JWT. */
export interface JwtPayload {
  sub: string;
  role: Role;
}

/** The authenticated user as exposed by the API (never includes passwordHash). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
}
