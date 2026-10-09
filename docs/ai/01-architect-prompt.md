You are acting as the architecture reviewer for a 2-hour technical assessment ("DevPanel"). This is the ANALYSIS phase only.

## HARD RULES (read-only phase)
- Do NOT create, edit or delete any file. Do NOT write ADRs to disk. Do NOT run git init, npm/pnpm install, docker, or scaffolding commands.
- Do NOT create, update or comment on any Azure DevOps work item. Do NOT call any ADO tool.
- You MAY read the two input files and use context7/web lookups to confirm current library versions/APIs.
- Return everything in your final reply as markdown. Keep it tight: target ~1,500-2,200 words. The assessment explicitly does NOT reward "book-length technical documentation", and analysis time is taken from the 2-hour budget.

## Inputs (read both fully)
1. C:\practicas\practica\Prueba_Tecnica_Devpanel_IA.pdf  — AUTHORITATIVE assessment (Spanish, 6 pages). Key facts:
   - 2h max, public GitHub repo `devpanel-<name>`, stack is FREE, must run locally with clear README (<5 min to clone and run).
   - DB may be PostgreSQL, MySQL, SQLite or in-memory; users must NOT be a fixed JSON file.
   - P0 MUST: login email+password (POST to backend); persistent session (token survives reload); protected route -> redirect to login; dashboard with >=2 metric cards; users table populated from backend; debounced search without full reload.
   - P1 SHOULD: pagination or infinite scroll; logout; 401 handling (expired token -> login).
   - P2 NICE: logged-in user in header; filters by role/status; polished design.
   - "Confirm P0 is solid before P1/P2. Do NOT try to do everything." "Three solid P0 > six half P0."
   - Grading: P0 30%, code quality 20% (no `any`, no blindly pasted AI code), stack/arch decisions 15%, effective AI use 15%, AI-LOG.md 10%, README 10%.
   - Deliverables at repo root: README.md, AI-LOG.md, CLAUDE.md, .env.example. Incremental commits, no mega-commit.
   - Suggested schedule: setup 15m, backend (auth + users endpoint + seed) 40m, frontend (login + dashboard + table + search) 45m, docs 20m.
2. C:\practicas\practica\devpanel-claude-prompt.xml.md — the developer's own instruction file (PREFERENCES, not assessment requirements). Preferred stack: React + TS + Vite + React Router + Zustand + Axios + Tailwind / NestJS + Prisma + PostgreSQL / Docker Compose. Redis NOT by default. Requires a reasoned comparison: Keycloak (OIDC + PKCE, JWT validated by Nest) vs native NestJS JWT (bcrypt/argon2), and states native JWT is the preferred fallback if Keycloak threatens P0 within 2h.

## Repository / environment inspection (already done, verified)
- The two input files live in C:\practicas\practica (outside the repo).
- The working repo is C:\practicas\practica\devpanel-brunoferreira, cloned from https://github.com/ShiirooS/devpanel-brunoferreira.git (public GitHub repo, already named per the PDF). It contains only README.md (one line: "# devpanel-brunoferreira"), branch `main`, single commit "Initial commit", clean working tree. Effectively greenfield — no existing conventions, package manifests, Docker files, CLAUDE.md or AI-LOG.md.
- Node v24.4.1, npm 11.4.2, pnpm 10.33.4, git 2.54, Docker CLI 29.7.2 + Compose v5.5.1 installed.
- Docker Desktop daemon is currently NOT running (cannot connect to docker API). `gh` CLI is NOT installed (repo already exists on GitHub, so pushes go through plain git).
- OS: Windows 11, shells: PowerShell 5.1 and Git Bash.

## What I need from you (label every item as [PDF-REQ], [XML-PREF] or [RECOMMENDATION])
1. Stack evaluation: is the XML's preferred stack appropriate for 2h? Where would you cut (e.g. Zustand vs React context, Axios vs fetch, monorepo tooling or not)? Be concrete.
2. Auth comparison: Keycloak+OIDC/JWT vs native NestJS JWT, scored on: time to implement & validate E2E, security & session lifecycle, Docker/infra complexity, fit with PDF (note the PDF literally says "login with email + password (POST to backend)"), maintainability, demonstration of architectural knowledge, risk to P0. Give a clear recommendation.
3. Session storage: compare (a) HttpOnly SameSite cookie with Vite dev proxy `/api` -> Nest (same-origin, no CORS-credentials friction, CSRF considerations) vs (b) bearer token in localStorage (XSS trade-off). Recommend one for a 2h build and state what must be documented.
4. Database: Prisma + PostgreSQL in Docker Compose vs Prisma + SQLite (PDF explicitly allows it; removes Docker from the critical path and from the 5-minute README; note the Docker daemon is down right now). Recommend a default and the fallback. Note any Prisma enum/SQLite caveats.
5. Minimal Prisma schema (fields, constraints, indexes) and minimal REST contract: POST /auth/login, GET /auth/me, POST /auth/logout (if cookies), GET /users?search=&page=&pageSize=&role=&status=, GET /dashboard/metrics. Include response shapes and status codes. Which metrics are meaningful with real data?
6. Frontend & backend module structure (feature-oriented, no empty folders). Monorepo layout recommendation (e.g. /backend + /frontend with root scripts, or pnpm workspaces) — pick the lowest-friction option.
7. Debounce + stale-response handling approach (AbortController vs request id), and 401 interceptor approach.
8. Top risks for the 2h build (Windows specifics, Prisma version changes, Nest CLI on Node 24, Docker daemon, CORS/cookies) with mitigations.
9. A P0-first execution plan that fits 120 minutes, with minute estimates per slice and an explicit cut line (what gets dropped first if behind).
10. Confirm current major versions you'd pin (Prisma, NestJS, Vite, React Router, Tailwind) — use context7 if available and say whether you verified or recalled. Flag any setup command that changed in recent majors (e.g. Prisma 6/7 generator/config changes, Tailwind v4 Vite plugin).

End with a short list of "decisions the user must make" (max 5), each with your recommended default.
