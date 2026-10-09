# CLAUDE.md: DevPanel

This is the context file for Claude Code in this repository.
- The original, longer instruction set is in `docs/ai/devpanel-claude-prompt.xml`.
- The approved plan (architecture, user stories, time budget) is in `docs/ai/PLAN.md`.

## Purpose and constraints
- This is a technical assessment: a mini admin panel with login, a dashboard, and a users table with debounced search. **Hard limit: 2 hours.**
- A reviewer must be able to clone and run it in under 5 minutes by following `README.md`. Users are stored in PostgreSQL, never in a JSON file.
- Priorities:
  - **P0** (must be solid first): login, persistent session, protected route, at least 2 real metrics, users table, debounced search.
  - **P1:** pagination, logout, 401 handling.
  - **P2:** only with spare time.

## Approved stack and decisions (do not change without the developer's approval)
- `backend/`: NestJS 12 (ESM, so relative imports end in `.js`), Prisma **7.10.0 exact** with `@prisma/adapter-pg`, PostgreSQL 17 in Docker Compose. Only the database is containerized.
- `frontend/`: React 19, Vite 8, TypeScript, React Router 7, Zustand (auth state only, no `persist`), Axios, Tailwind v4.
- Auth is native NestJS JWT (HS256), with passwords hashed using argon2id.
  - The token travels in a `HttpOnly; SameSite=Lax` cookie.
  - Vite proxies `/api` to `localhost:3000`, so the app is same-origin and needs no CORS.
- Use npm, not pnpm. There is a single `.env` at the repo root.
- Never install `prisma@latest` (8.x RC) or `typescript@latest` (7.x).

## Code conventions
- Write code and docs in English. Talk to the developer in Spanish.
- **Backend:**
  - One module per domain: `auth`, `users`, `dashboard`, `prisma`, `config`.
  - Controllers handle HTTP only; services hold the logic.
- **Frontend:**
  - `features/{auth,dashboard,users}`, with shared code in `lib/` and `types/`.
  - No empty folders and no speculative abstractions.
- No `any` (oxlint enforces it).
  - Validate input with `class-validator` DTOs.
  - Build user responses with an explicit Prisma `select`, so `passwordHash` is never returned.
- Never log tokens, passwords or secrets.
- Error responses keep NestJS's default shape `{ statusCode, message, error }`. Login failures always return the same generic 401.

## Workflow
- Inspect before modifying. Work on one user story per slice and don't expand scope without approval.
- **Commits:**
  - Format: `<type>/#US-<id>-<kebab-description>`, where type is one of `feat|fix|test|docs|refactor|chore`.
  - One commit per story, made on `main`, then push.
- After each slice:
  1. Build and lint.
  2. Verify the acceptance criteria with real commands.
  3. Update `AI-LOG.md`.
- Ask before changing the stack or the auth strategy, adding infrastructure, or doing anything destructive.

## Commands (repo root)
```bash
npm run setup   # install root + backend + frontend
npm run dev     # API on :3000 and web on :5173 (concurrently)
npm run build   # build backend and frontend
npm run lint    # oxlint on both apps
```
