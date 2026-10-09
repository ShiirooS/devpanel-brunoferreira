# DevPanel

Mini admin panel built for a 2-hour technical assessment: login, a dashboard with real metrics, and a searchable, paginated users table.

**Stack:** React 19 + Vite + TypeScript + Tailwind v4 (frontend) · NestJS 12 + Prisma 7 + PostgreSQL 17 (backend). Only the database runs in Docker; the API and the web app run on your machine.

## Prerequisites
- Node.js **>= 20.19** (22 LTS or 24 recommended) and npm
- Docker Desktop **running** (the first run pulls the `postgres:17-alpine` image, about 100 MB)
- Free ports: 3000 (API), 5173 (web), 5433 (Postgres)

## Run it
```bash
git clone https://github.com/ShiirooS/devpanel-brunoferreira.git
cd devpanel-brunoferreira
cp .env.example .env     # PowerShell: Copy-Item .env.example .env
npm run setup            # installs everything, starts Postgres, applies the migration, seeds 60 users
npm run dev              # API on :3000 and web on :5173
```
Open http://localhost:5173 and sign in:

| Email | Password |
|---|---|
| `admin@devpanel.local` | `Admin123!` |

All seeded users share that password (development data only). Useful commands:

| Command | What it does |
|---|---|
| `npm run db:setup` | Starts Postgres if needed, then runs `migrate deploy`, `generate` and `seed` (safe to repeat) |
| `npm run build` / `npm run lint` | Builds / lints backend and frontend |
| `docker compose down` | Stops Postgres (data is kept); add `-v` to wipe it |

**Troubleshooting:** if `npm run setup` says it can't reach Docker, start Docker Desktop and run it again. If port 5433 is taken, change `POSTGRES_PORT` and the port in `DATABASE_URL` in `.env`.

## Configuration
Everything lives in one `.env` at the repo root (see `.env.example`, which documents each variable). The API refuses to start if `JWT_SECRET` is shorter than 32 characters or `DATABASE_URL` is missing. To see the expired-session flow, set `JWT_EXPIRES_IN_SECONDS=60`, restart the API and wait a minute.

## API (all under `/api`, all protected except login and logout)
| Endpoint | Description |
|---|---|
| `POST /auth/login` `{email, password}` | 200 `{user}` and sets the session cookie; 401 for any bad credentials |
| `GET /auth/me` | Current user (used to restore the session on reload) |
| `POST /auth/logout` | 204, clears the cookie |
| `GET /users?search&page&pageSize&role&status` | `{data, meta:{page,pageSize,total,totalPages}}`; `pageSize` max 100 |
| `GET /dashboard/metrics` | `{totalUsers, activeUsers, newUsersLast30Days, byRole}` |

## Key technical decisions
- **Native JWT instead of Keycloak.** The brief asks for email + password posted to the backend. Keycloak would have taken 45-75 of the 120 minutes and moves the login form out of our app. Passwords are hashed with argon2id.
- **The token is stored in an `HttpOnly; SameSite=Lax` cookie** named `devpanel_session` (DevTools -> Application -> Cookies), not in `localStorage`, so XSS can't read it. Vite proxies `/api` to the API, so everything is same-origin and no CORS is needed. CSRF protection relies on SameSite=Lax plus JSON-only endpoints, not on a CSRF token.
- **Session on reload:** the app calls `/auth/me` on startup and shows a loader meanwhile, so a valid session never flashes the login page. A 401 anywhere clears the session and returns to login.
- **Search** is debounced (300 ms) and cancels the previous request, so stale responses can't overwrite newer ones.
- **Protected by default:** a global guard secures every route; only login and logout opt out with `@Public()`.

## Known limitations
- Logout clears the cookie but does not revoke the JWT, which stays valid until it expires (default 1 h). There is no refresh token.
- The app only works through the Vite dev or preview server, because it depends on the `/api` proxy. There is no production deployment setup.
- Only the database is containerized.
- Automated test coverage is minimal; verification was mostly done with curl and manual checks (see `AI-LOG.md`).

## AI usage
`AI-LOG.md` documents the tools, prompts, rejected suggestions and an honest AI vs human estimate. `CLAUDE.md` is the context given to the agent, and `docs/ai/` holds the plan and the subagent analysis.
