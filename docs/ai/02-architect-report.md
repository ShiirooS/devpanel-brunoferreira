# Architect subagent report (lightly reformatted copy; content unchanged)

- Subagent: `nassa-architect:architect` (Claude Code), launched 2026-10-08 with the prompt in `01-architect-prompt.md`.
- Mid-run update sent to it: "Docker Desktop daemon is now running".
- Version claims re-checked by the main session with `npm view <pkg> dist-tags` on 2026-10-08. All confirmed: prisma latest=8.0.0-rc.22, @prisma/client latest=7.10.0, typescript latest=7.0.2, @nestjs/cli 12.0.8 depends on typescript ~6.0.2, @nestjs/core latest=12.1.2 (legacy=11.2.7, `"type": "module"`), react-router latest=8.4.0 / version-7=7.18.4, vite 8.3.4, tailwindcss 4.3.3, zustand 5.0.15, axios 1.20.0, argon2 0.45.1.

---

# DevPanel — Architecture Analysis (read-only)

**Constitution check:** no `architecture-constitution.md` found under `C:\practicas\practica` (searched recursively). Constraints below derive from the PDF (authoritative) and XML (preferences). Nothing was written, installed or sent to ADO.

**Evidence legend:** versions/dist-tags/Node engines **verified on the npm registry this session**; Prisma 7 changes **verified on the Prisma docs page**; NestJS 12 defaults **partly verified** (mirrored release notes, not the official guide); anything marked *(recalled)* is from memory.

**Docker update acknowledged:** the daemon is now running; items 4 and 8 reflect that.

## ⚠ Three findings that change setup commands (read before running anything)
1. **`npm i -D prisma` installs an 8.0 RC.** `prisma` dist-tag `latest` = `8.0.0-rc.22`, while `@prisma/client` latest = `7.10.0`. A bare install gives mismatched majors. Pin exactly: `prisma@7.10.0 @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0`. (registry)
2. **`typescript@latest` = 7.0.2 (native compiler).** Nest CLI 12.0.8 pins `typescript ~6.0.2`. Never bump TS manually; keep what each scaffolder installs. TS 7 decorator-metadata support for Nest is unverified.
3. **Prisma 7 automates less:** no `.env` auto-loading; `migrate dev` no longer runs `generate` or `seed`; driver adapters are mandatory; the `prisma-client` generator requires `output`; URL and seed command move to `prisma.config.ts`. The setup script must run `migrate deploy → generate → db seed` explicitly, and if the generated client is gitignored the backend won't compile before `generate`. (Prisma docs)

---

## 1. Stack evaluation
- **[XML-PREF]** React+TS+Vite+React Router+Zustand+Axios+Tailwind / NestJS+Prisma+PostgreSQL / Compose — **appropriate for 2h** if only Postgres is containerised.
- **[RECOMMENDATION] Keep Zustand, auth state only.** The concrete reason: the Axios 401 interceptor lives outside React and needs `useAuthStore.getState().clear()`; Context can't do that cleanly. **No `persist`** (server session is the truth). Users/metrics stay component-local.
- **[RECOMMENDATION] Keep Axios**: 1 small file, clean interceptors, `signal` support; a fetch wrapper would be the same size.
- **[RECOMMENDATION] Cut:** Redis, Passport (a 25-line guard on `@nestjs/jwt` suffices), TanStack Query, shadcn, shared-types package, monorepo tooling. Add `tsx` only for the seed.
- **[RECOMMENDATION] Pin `react-router@^7` (7.18.x, Node ≥20)** rather than 8.4.0: v8's API is unverified by me, its engine is Node ≥22.22, and AI-generated code is most reliable on v7.

## 2. Auth: Keycloak (OIDC+PKCE) vs native NestJS JWT  (1–5, higher = better)
| Criterion | Keycloak + OIDC | Native NestJS JWT |
|---|---|---|
| Time to build + verify E2E | 1 (45–75 min: realm export, redirect URIs, audience mapper, JWKS validation, OIDC client lib) | 4 (~20 min) |
| Security & session lifecycle | 5 (refresh, revocation, SSO) | 3 (no refresh/revocation — documented) |
| Docker/infra complexity | 1 (extra heavy image, 30–60 s start, realm import) | 5 (Postgres only) |
| **Fit with PDF "email+password (POST al backend)"** | **1 — credentials go to Keycloak's page, not our backend; posting them to our backend needs the ROPC grant, which current OAuth guidance deprecates** | 5 — exact fit |
| Users table | 2 (users live in Keycloak → mirror or Admin API) | 5 (one `users` table) |
| Maintainability | 4 (separation) | 4 (small, explicit) |
| Arch knowledge shown | 4 | 3 → 4 if the rejected option + migration path is documented |
| Risk to P0 | High | Low |

**[RECOMMENDATION] Native NestJS JWT** (matches the XML's own fallback rule). **argon2id** (0.45.1, prebuilt binaries; `bcryptjs` as drop-in fallback if the native install fails); HS256 from `JWT_SECRET` (≥32 chars, validated at startup), 1h expiry, payload `{sub, role}`. Same 401 for unknown email / wrong password / non-ACTIVE; verify against a dummy hash when the email is unknown (timing). Document Keycloak in AI-LOG as the rejected alternative; migration = swap the guard for JWKS validation.

## 3. Session storage
| | (a) HttpOnly cookie + Vite proxy | (b) Bearer in localStorage |
|---|---|---|
| XSS | token unreadable by script | any XSS exfiltrates token |
| CORS | none (`/api` same-origin via proxy) | needs CORS config |
| CSRF | needs SameSite=Lax + JSON-only | n/a |
| Extra work | cookie-parser, `/auth/logout`, `/auth/me` restore (+~10 min) | ~0 |

**[RECOMMENDATION] (a)** — the XML prefers it and it scores on the 15% architecture criterion. Cookie `devpanel_session`: `HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`, `Secure` only in prod. Nest `setGlobalPrefix('api')`; Vite proxies `/api` → `localhost:3000` (no rewrite). **Pre-approved fallback:** if cookie auth isn't green end-to-end by ~minute 50, switch to (b) and log it in AI-LOG.
**[PDF-REQ] visibility of "token guardado":** the README must say the JWT is stored in an HttpOnly cookie (DevTools → Application → Cookies).
**Must document:** CSRF stance (SameSite=Lax + JSON content type, no CSRF token); logout clears the cookie but doesn't revoke the token (valid until exp); the app only works through the Vite dev/preview proxy.

## 4. Database
- **[PDF-REQ]** Postgres/MySQL/SQLite/in-memory all allowed; not a JSON file.
- **[RECOMMENDATION] Default: Postgres in Compose (only container).** Docker is now up, so the local blocker is gone. Second argument: `pg` is pure JS, while SQLite under Prisma 7 needs the `better-sqlite3` native adapter (a Windows/Node 24 build risk). `postgres:17-alpine` *(tag recalled)*, host port **5433** (avoids a local PG clash), `pg_isready` healthcheck, named volume. A single root `.env`: Compose auto-reads it; the backend reads it via `envFilePath` + `dotenv` in `prisma.config.ts`.
- **[RECOMMENDATION] README prerequisite:** "Docker Desktop running"; first run pulls ~100 MB cold. Be honest: only the DB is containerised.
- **Fallback: Prisma+SQLite, decided before the first migration only.** Caveats: migrations and lock are provider-bound; `mode:'insensitive'` is Postgres-only (SQLite `LIKE` is ASCII-case-insensitive *(recalled)*); enums on SQLite since Prisma 6.2 *(recalled — verify if switching)*.

## 5. Schema + REST contract
**[RECOMMENDATION]**
```prisma
generator client { provider = "prisma-client"; output = "../src/generated/prisma" }
datasource db { provider = "postgresql" }   // URL lives in prisma.config.ts
enum Role { ADMIN EDITOR VIEWER }
enum UserStatus { ACTIVE INACTIVE SUSPENDED }
model User {
  id String @id @default(uuid())
  email String @unique              // stored lowercased
  name String
  passwordHash String
  role Role @default(VIEWER)
  status UserStatus @default(ACTIVE)
  lastLoginAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([role]) @@index([status]) @@index([createdAt])
  @@map("users")
}
```
Seed: ~60 deterministic users (name arrays, no faker), `upsert` (idempotent), `createdAt` spread over 90 days and `lastLoginAt` over 30 so the metrics vary; hash once and reuse. Admin: `admin@devpanel.local` / documented dev password.

Contract (prefix `/api`; errors use Nest's default `{statusCode,message,error}`, no custom filter):
| Endpoint | Success | Errors |
|---|---|---|
| `POST /auth/login` `{email,password}` | **200** `{user}` + Set-Cookie (`@HttpCode(200)`) | 400 validation, 401 generic |
| `GET /auth/me` | 200 `{user}` (re-read from DB → status changes apply) | 401 |
| `POST /auth/logout` | 204, clears cookie (idempotent) | — |
| `GET /users?search=&page=1&pageSize=10&role=&status=` | 200 `{data: UserDto[], meta:{page,pageSize,total,totalPages}}` | 400 (pageSize ≤100, enums), 401 |
| `GET /dashboard/metrics` | 200 `{totalUsers, activeUsers, newUsersLast30Days, byRole:{ADMIN,EDITOR,VIEWER}}` | 401 |

`UserDto = {id,email,name,role,status,createdAt,lastLoginAt}` via an explicit Prisma `select` — `passwordHash` never leaves. Search = `OR [name,email] contains insensitive` in one `$transaction([findMany, count])`. **Meaningful real metrics:** total, active, new in the last 30 days, by-role breakdown (`groupBy`). No fake business KPIs.

## 6. Structure & repo layout
**[RECOMMENDATION] Plain `/backend` + `/frontend` + a root `package.json` with only `concurrently`** — no npm/pnpm workspaces, no Turbo. Use **npm**: pnpm 10 blocks dependency build scripts until approved (prisma, argon2, esbuild) *(recalled)*. Root scripts: `setup` (install both + `db:setup` = `prisma migrate deploy && prisma generate && prisma db seed`), `dev` (concurrently api + web).

Backend: `main.ts` (prefix, cookie-parser, `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`), `config/env.validation.ts`, `prisma/` (the "database" module: `PrismaService` with `new PrismaPg({connectionString})`), `auth/` (controller, service, `jwt-auth.guard.ts` as global `APP_GUARD` → protected by default, `public.decorator.ts`, `current-user.decorator.ts`, `dto/`), `users/` (controller, service, `dto/list-users.query.ts`), `dashboard/` (controller, service). Skip a `common/` module (nothing reused yet). Use `class-validator`, not Nest 12's new Standard Schema (Zod) support, which I haven't verified.

Frontend: `app/` (router, `ProtectedRoute`, `AppLayout` with header + logout), `features/auth/` (`LoginPage`, `authStore`, `authApi`), `features/dashboard/` (`DashboardPage`, `MetricCard`, api), `features/users/` (`UsersTable`, `useUsers`, api), `lib/` (`http.ts` Axios instance + interceptor, `useDebouncedValue.ts`), `types/api.ts` (DTO types copied by hand from the backend — accepted, documented duplication). One protected page (cards + table) is enough.

## 7. Debounce, stale results, 401
- **[PDF-REQ] Debounce:** `useDebouncedValue(search, 300)`.
- **[RECOMMENDATION] Stale results → `AbortController`:** one controller per effect run, `signal` passed to Axios, `abort()` in the cleanup, ignore `CanceledError`. This also cancels on unmount and page change; a request-id check is only needed for non-abortable calls. Reset to page 1 on search change; keep previous rows visible while loading (no flicker).
- **[RECOMMENDATION] Auth states `status: 'unknown'|'authenticated'|'anonymous'`:** on boot call `/auth/me`; `ProtectedRoute` shows a spinner while `unknown` — this is what makes the session survive reload without flashing the login page.
- **[RECOMMENDATION] 401 interceptor:** on a 401 from anything except `/auth/login` and `/auth/me` → `clear()`; `ProtectedRoute` then does `<Navigate to="/login" state={{from}}>`, so the interceptor never needs the router. A short `JWT_EXPIRES_IN` in `.env` makes the expiry demo easy.

## 8. Risks
| Risk | Mitigation |
|---|---|
| `prisma` latest = 8.0 RC (verified) | Exact pin 7.10.0 on all `@prisma/*` |
| TS 7 / TS 6 split (verified) | Never install `typescript@latest` |
| **Nest 12 is ESM-first, Vitest by default** (partly verified) — AI code often forgets the `.js` extensions ESM imports need | Right after scaffold, check tsconfig module resolution and run build+start (2-min gate). Fallback `@nestjs/cli@11` (Nest 11.2.7, CJS) + Prisma's CJS output option *(recalled)* |
| Prisma 7 no generate/seed/.env (verified) | Explicit `db:setup`, `import 'dotenv/config'` in `prisma.config.ts` |
| Docker (up now; cold reviewer machine) | Healthcheck, port 5433, README states "Docker running" |
| Scaffolders prompting / creating git repos | `nest new backend --skip-git --package-manager npm --strict`; `create-vite` may prompt/auto-start *(flags recalled)* — run it in the user's terminal if it hangs |
| Windows | No inline `VAR=x cmd` in npm scripts; `cp .env.example .env` works in PowerShell; `.gitattributes` `eol=lf` |
| Native modules on Node 24.4.1 | argon2 prebuilds; `bcryptjs` fallback; avoid `better-sqlite3` |
| Cookie/proxy | Same-origin proxy → no CORS at all; smoke-test with `curl -c/-b` before the UI |
| Engines | README minimum: **Node ≥20.19 (22 LTS or 24 recommended)** — from Vite 8, Prisma 7, RR7 |

## 9. 120-minute plan (the clock already includes this analysis)
| Min | Slice | Commit |
|---|---|---|
| 0–15 | Analysis/approval (in progress); scaffold both apps, root scripts, compose, `.env.example`, `.gitignore`, CLAUDE.md, AI-LOG skeleton; ESM build gate | `chore/#US-001` |
| 15–30 | Prisma schema/config, migration, seed, PrismaService; verify row count | `feat/#US-002` |
| 30–50 | Login + cookie + global guard + `/me` + `/logout` + env validation; curl smoke | `feat/#US-003` |
| 50–60 | `/users` (search+pagination) + `/dashboard/metrics`; curl | `feat/#US-005/006` |
| 60–75 | Tailwind v4, Axios, authStore, router, ProtectedRoute, LoginPage — **login + reload verified** | `feat/#US-004` |
| 75–92 | Metric cards, table, debounced search, prev/next pagination | `feat/#US-006/007` |
| 92–100 | Logout, 401 interceptor, header user | `feat/#US-008` |
| 100–105 | Buffer / P2 role+status filters (backend already supports them) | optional |
| 105–120 | **Cold clone to a temp dir and follow the README literally**; finish README + AI-LOG; push | `docs/#US-010` |

**[RECOMMENDATION] Cut order:** filters → visual polish → header user → pagination down to a plain `limit` (P1 noted as partial). **Never cut** the cold-run README check or AI-LOG (20% of the grade combined). Fallback triggers: auth not E2E at minute 55 → bearer (decision 2); Postgres/ESM setup failing at minute 20 → SQLite / Nest 11.

## 10. Version pins
| Package | Pin | Source | Setup change to note |
|---|---|---|---|
| prisma / @prisma/client / adapter-pg | **7.10.0 exact** | verified | `prisma-client` generator + `output`, `prisma.config.ts`, adapters required, explicit generate/seed |
| @nestjs/* | 12.x (core 12.1.2, cli 12.0.8) | verified | ESM packages; new projects ESM + Vitest (partly verified) |
| vite / @vitejs/plugin-react | 8.3.x / 6.1.x | verified | Node ^20.19 or ≥22.12 |
| react-router | **^7.18** (8.4.0 is latest) | verified | v7 library mode, single `react-router` package |
| tailwindcss + @tailwindcss/vite | 4.3.x | verified | No `tailwind init`/PostCSS/config: plugin + `@import "tailwindcss";` *(setup recalled)* |
| zustand / axios / argon2 | 5.0.x / 1.20.x / 0.45.x | verified | — |
| typescript | as scaffolded (~6.0) | verified | do **not** use 7.x |

## Decisions the user must make
1. **Auth:** native NestJS JWT + argon2id (**default**) vs Keycloak.
2. **Session transport:** HttpOnly cookie + Vite proxy (**default**), with a pre-approved switch to bearer+localStorage at minute 55 if blocked.
3. **DB:** Postgres 17 in Compose on port 5433, only the DB containerised (**default**) vs SQLite — must be decided before the first migration.
4. **Pins/tooling:** npm (not pnpm), Prisma 7.10.0 exact, React Router ^7, Nest 12 as scaffolded with a Nest 11 fallback if the ESM build gate fails (**default**).
5. **Scope:** P0 + all three P1 + header user; filters only if ≥15 min remain at minute 100 (**default**).

Sources: [Prisma 7 upgrade guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) · [NestJS v12.0.0 release (mirror)](https://newreleases.io/project/github/nestjs/nest/release/v12.0.0) · [InfoQ: NestJS 12 roadmap/ESM](https://infoq.com/news/2026/04/nestjs-12-roadmap-esm) · [@nestjs/cli 12.0.0](https://newreleases.io/project/npm/@nestjs/cli/release/12.0.0) · [@nestjs/config 12.0.0](https://newreleases.io/project/npm/@nestjs/config/release/12.0.0) · npm registry (`npm view`) queried this session.

Input files read: `C:\practicas\practica\Prueba_Tecnica_Devpanel_IA.pdf` (text extracted via pdftotext; the priority/time table extracted jumbled, so only the ~85 min P0 total and the 15/40/45/20 schedule are quoted) and `C:\practicas\practica\devpanel-claude-prompt.xml.md`.
