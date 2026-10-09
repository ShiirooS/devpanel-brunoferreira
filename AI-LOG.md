# AI-LOG: DevPanel

An honest log of how AI was used in this assessment. It is updated after every user story. Sections marked **TODO (Bruno)** must be written by the developer, because only the developer can answer them truthfully.

## 1. AI tools used
- **Claude Code** (CLI, model Claude Opus 5.5) was the main coding agent. It read the brief, planned, scaffolded, implemented and verified.
- **`architect:architect` subagent** (inside Claude Code) did the architecture analysis before any code was written: stack, auth options, schema, risks and the 2-hour plan.
- **Claude Code "advisor"** is a second reviewer model that Claude Code consulted before committing to the plan and before each delivery. Two of the corrections it made are recorded in §4.
- **Context given to the agent:**
  - `docs/ai/devpanel-claude-prompt.xml`: the developer's own long instruction file.
  - `CLAUDE.md`: a condensed version of that file, adjusted to the approved plan.

## 2. Stack choice and why
React + Vite + TypeScript for the frontend and NestJS + Prisma + PostgreSQL for the backend, with only Postgres running in Docker Compose. The full reasoning is in `docs/ai/PLAN.md` §3–4.
- **Familiar stack.** This is the developer's daily stack, so no time is lost learning anything under pressure, as the brief itself recommends.
- **Native JWT instead of Keycloak.** The brief asks for "email + password via POST to the backend". With Keycloak, credentials are entered on Keycloak's own page, and posting them to our backend would need the deprecated password grant. It would also cost 45–75 of the 120 minutes.
- **HttpOnly cookie instead of localStorage.** The token can't be stolen by XSS, and the Vite proxy keeps everything same-origin, so CORS isn't needed. This costs about 10 extra minutes for `/auth/me` and `/auth/logout`.
- **Things cut on purpose:** Redis, Passport, TanStack Query, shadcn and monorepo tooling. None of them serves a requirement in the brief.

## 3. Representative prompts
### 3.1 Kick-off (developer → Claude Code)
> "read both of the Prueba_Tecnica_Devpanel_IA and the devpanel-claude-prompt.xml using the arquitecture subagent to proceed with this practice project"

**What came back:**
- An inspection of the repo and toolchain. It found that the Docker daemon was down; the developer then started Docker Desktop.
- A delegated analysis by the architect subagent.
- A 12-section plan (`docs/ai/PLAN.md`) ending in a single approval question.

**What was done with it:** the developer approved the plan with its 8 defaults ("sí, apruebo el plan, empieza con US-001").

### 3.2 Architecture analysis (Claude Code → architect subagent)
The exact prompt is in `docs/ai/01-architect-prompt.md`, and the report is in `docs/ai/02-architect-report.md` (lightly reformatted, content unchanged).

**What came back:**
- An auth comparison table.
- Pinned versions checked against the npm registry.
- A schema, an API contract, a risk list and a 120-minute plan.

**What was done with it:**
- Claude Code re-ran `npm view` to confirm the version traps the subagent flagged:
  - `prisma@latest` is 8.0.0-rc.22 while `@prisma/client` is 7.10.0.
  - `typescript@latest` is 7.0.2, but Nest CLI 12 needs ~6.0.2.
- The plan was then adopted with the modifications listed in §4.

### 3.3 Implementation
> "implementa los 5 primeras US"

US-001 to US-005 were implemented one story at a time, each with its own commit. The details are in the timeline in §7.

## 4. AI output that was rejected or modified
1. **The subagent's `.env` loading would have broken Prisma.** The report suggested `import 'dotenv/config'` in `prisma.config.ts` with a single `.env` at the repo root. The Prisma CLI runs from `backend/`, so it would look for `backend/.env` and `DATABASE_URL` would be undefined. The fix was to load the root `.env` by explicit path.
   - *Who caught it:* the advisor model, not the developer.
2. **The subagent placed the ESM compatibility gate too early.** It wanted to check the bare scaffolds. The real risk is NestJS 12 (ESM) compiling Prisma 7's generated client, so the gate moved to US-002 (`nest build` + a real `prisma.user.count()`).
   - *Who caught it:* the advisor model.
3. **The subagent grouped stories into single commits** (`#US-005/006`). This was changed to one commit per story, following the developer's commit convention.
4. **The developer rejected an agent command.** Claude Code tried to run `npx create-vite@latest --help` to scaffold the frontend, and the developer rejected that tool call. The frontend was then written by hand: about 7 small config and entry files, with no Vite demo code to delete. Reason for the rejection: **TODO (Bruno)**.

5. **Curl results were not trusted blindly.** My first auth test hit a server I hadn't started: port 3000 was held by another session's process (`node --enable-source-maps ...\dist\main`), so my own server died with `EADDRINUSE` and the 200/401 responses came from the other one. I noticed it from the empty stderr and the process list, did not kill the other process, and re-ran every check on my own server on port 3100. A second slip: the first request after startup returned `000` because the server wasn't listening yet, so the scripts now wait for the port.
6. **A `git stash` almost lost the subagent's files.** To commit US-003 without the unregistered users/dashboard files, Claude Code stashed them, and also forgot to stage `app.module.ts` at first. The stash was popped right after the commit and nothing was lost.

## 5b. Parallel work
Development used several Claude Code sessions at the developer's request:
- This session: `backend/` plus the root files and docs.
- A second session: `frontend/`, on its own git worktree and branch, merged into `main` with fast-forward only. Its prompts and rejected suggestions are to be added here when it hands them over.
- A third session: curl and Postgres checks only.
- A Sonnet 5.5 subagent: the backend `users` and `dashboard` modules (see §7).

## 5. Estimated share of AI-written vs developer-written code
**TODO (Bruno):** your honest estimate. For reference, every code file so far was written by Claude Code and reviewed and approved by the developer at each step.

## 6. One thing the AI did very well, one thing it did badly
**TODO (Bruno):** fill in at the end of the assessment. Candidates noted along the way:
- **Did well:** caught the npm `latest`-tag traps for Prisma and TypeScript before any install happened.
- **Did badly:** the subagent proposed `.env` loading that would have failed at the first migration (see §4.1).

## 7. Timeline and decisions log
| Time | Story | What happened |
|---|---|---|
| 19:03 | — | Plan approved; the 2-hour clock starts. |
| 19:20–19:40 | US-002 | The ESM gate passed (`nest build` + a real `prisma.user.count()` returned 60), so the fallback to Nest 11 was not needed. The seed is idempotent: running `db:setup` twice leaves 60 rows. The root `.env` is loaded by explicit path (see §4.1). |
| 19:40–19:55 | US-003 | Auth written by Claude Code. Verified with curl: login 200, wrong password and unknown email return the same 401, invalid body 400, `/me` with no or tampered cookie 401, `/me` with cookie 200. The `Set-Cookie` header carries `HttpOnly; SameSite=Lax; Max-Age=3600`. |
| 19:45–19:58 | US-005/006 back | **Delegated to a Sonnet 5.5 subagent** (`users` and `dashboard` modules, with explicit rules: new files only, no git). Claude Code reviewed the code before registering it. Verified with curl: metrics 60/37/19, `search=ANA` returns 4, `pageSize=500` and `role=BOGUS` return 400, and `passwordHash` never appears. |
| 19:04–19:16 | US-001 | The `nest new` scaffold failed on `npm install` with an npm arborist crash (`Cannot read properties of null (reading 'edgesOut')`) in vitest 4's peer set. Fixed by bumping vitest to ^5.0.3 and removing the unused `@nestjs/mau` and `@vitest/coverage-v8`. The `no-explicit-any` lint rule was switched from `off` to `error`. Frontend written by hand. Both builds and lint pass; the backend boots. |
