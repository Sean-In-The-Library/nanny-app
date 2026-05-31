# Family Nanny Hub Coordination

## 1. Purpose

Family Nanny Hub is a private, mobile-first coordination app for Sean, Tina, and Faith. The goal is to make daily nanny handoffs fast enough for tired parents and caregivers: urgent notes, chores, supplies, child trackers, calendar items, medication entries, developmental goals, milestones, and care manuals should be visible without digging through texts.

The app is intentionally simple for the MVP:

- Password-gated access for Sean, Tina, and Faith.
- Dashboard-first workflow showing only what needs attention now.
- Source pages for notes, chores, supplies, trackers, care manuals, development, calendar, medication, and milestones.
- Tina-focused dictation workflow that turns rough voice notes into structured action items.
- OpenRouter-assisted care manual drafting.
- Vercel production deployment from GitHub `main`.

## 2. Important Details

Repository:

```text
https://github.com/Sean-In-The-Library/nanny-app
```

Production deployment:

```text
https://nanny-app.aistudioprojects.com
```

Vercel project:

```text
nanny-app-8gy6
```

Current stack:

- Next.js App Router with TypeScript.
- Tailwind CSS for the mobile-first UI.
- Simple environment-variable password gate.
- `src/proxy.ts` protects app routes and redirects unauthenticated users to `/login`.
- Upstash Redis is the intended production persistence layer.
- Local development falls back to `.data/nanny-hub.json`.
- OpenRouter powers care manual and dictation action-item generation.
- OpenAI `gpt-4o-transcribe` supports browser audio dictation for Tina's voice workflow.

Required production environment variables:

```bash
APP_PASSWORD_SEAN=
APP_PASSWORD_TINA=
APP_PASSWORD_FAITH=
APP_SESSION_SECRET=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
OPENAI_API_KEY=
OPENAI_TRANSCRIBE_MODEL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
APP_PUBLIC_URL=https://nanny-app.aistudioprojects.com
```

Production env status as of 2026-05-31:

- Added through Vercel CLI for production: `APP_PASSWORD_SEAN`, `APP_PASSWORD_TINA`, `APP_PASSWORD_FAITH`, `APP_SESSION_SECRET`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, and `APP_PUBLIC_URL`.
- Not yet configured: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Until Upstash is configured, production can run and save during a warm serverless session, but data should be treated as temporary.

Tina review email should include masked login details only:

```text
user - tinakharrington@gmail.com
password - Ch******32!
```

Do not commit real passwords, API keys, transcripts, or private family details.

## 3. Three-Agent System

### Agent 1: Product and UX

Owns the parent and nanny workflow.

Responsibilities:

- Keep the dashboard focused on what needs attention today.
- Maintain the mobile-first design and large tap targets.
- Turn Tina's feedback into clear product changes.
- Keep copy warm, short, and non-blaming.
- Make sure the nanny-facing view is practical for fast handoffs.

Outputs to this file:

- Product decisions.
- Tina feedback summary.
- Priority UX changes.

### Agent 2: App Engineering

Owns implementation.

Responsibilities:

- Maintain Next.js route structure and protected app routes.
- Keep auth, persistence, AI routes, and data models simple and explicit.
- Implement dashboard rollups from source pages.
- Run `npm run lint` and `npm run build` before publishing.
- Keep production-safe handling for secrets and sensitive family data.

Outputs to this file:

- Files changed.
- Build status.
- Known blockers.
- Deployment commit.

### Agent 3: Deployment, QA, and Follow-Up

Owns publish, Vercel verification, and communication.

Responsibilities:

- Push verified code to GitHub `main`.
- Confirm Vercel receives and builds the deployment.
- Inspect Vercel build logs if deployment fails.
- Email Tina after the app is ready.
- Schedule and run the morning feedback check.
- Incorporate Tina's feedback into a follow-up implementation pass.

Outputs to this file:

- GitHub push status.
- Vercel deployment URL and status.
- Email status.
- Scheduled follow-up status.
- Feedback incorporated or pending.

## 4. Coordination Log

### 2026-05-31

Current state:

- The GitHub repository is connected to Vercel production.
- The initial production deployment was showing the default Next.js starter screen.
- The app implementation now includes auth routes, protected routing, storage, seeded data, dashboard rollups, editable source pages, Tina's dictation command center, care manual AI drafting, and audio transcription endpoints.
- The requested production domain is `https://nanny-app.aistudioprojects.com`.
- Vercel plugin confirmed the target project is `nanny-app-8gy6`, project id `prj_rpmOpZw5DpEB4nb7jDHD4zLTLk49`, under team `seans-projects-3ff264cf`.
- Vercel CLI added `nanny-app.aistudioprojects.com` to the linked `nanny-app-8gy6` project; Vercel reports it will point to the latest production deployment.
- The production app implementation was pushed to GitHub `origin/main` at commit `ac004f4`; later coordination-only commits may follow it.

Immediate plan:

1. Update documentation for the custom production domain.
2. Commit and push current changes to `main`.
3. Deploy with Vercel CLI to production.
4. Verify `https://nanny-app.aistudioprojects.com`.
5. Confirm login, dashboard, CRUD, and AI endpoint behavior.
6. Email Tina with current state, goals, audio-driven work completed, three feedback questions, production URL, and masked login details if Sean still wants that sent.
7. Schedule a morning feedback check and implementation follow-up only if explicitly requested.

Status:

- Product and coordination document: updated in this pass.
- Engineering verification: `npm run lint` passed and `npm run build` passed again after the coordination update.
- Local API verification: Tina wrong-password login returns 401, Tina correct login returns the configured `tinakharrington@gmail.com` profile, protected data reads work with a session, and data PUT/restore works.
- Local AI verification: dictation actionization returned three draft items after capping OpenRouter output tokens; care manual summarization returned a draft and questions.
- Local voice transcription verification: generated WAV upload reached `/api/ai/transcribe`, but OpenAI returned 401, "You do not have access to the organization tied to the API key." The app code is wired to `gpt-4o-transcribe`, but the current `OPENAI_API_KEY` is not usable for transcription.
- Browser verification: Playwright MCP failed to launch Chrome twice with exit code 13, so visual QA is not complete yet. HTTP/API verification is complete so far.
- GitHub deployment trigger: pushed commit `ac004f4` to `origin/main`.
- Vercel verification: latest inspected production deployment `dpl_ChctFGRML6WD7j5JPizYdFQNeKgw` is `READY` at `https://nanny-app-8gy6-779088hyc-seans-projects-3ff264cf.vercel.app` and aliased to `https://nanny-app.aistudioprojects.com`.
- Production custom-domain smoke verification: passed for login page, unauthenticated redirect, Tina login, session read, dashboard HTML load, protected data read, temporary note write, temporary note restore, dictation actionization, and care manual summarization.
- Production voice transcription verification: synthetic WAV upload reached `/api/ai/transcribe`, but OpenAI returned 401, "You do not have access to the organization tied to the API key." Voice dictation should be treated as blocked until the production `OPENAI_API_KEY` is replaced or the OpenAI organization access is fixed.
- Production env correction: first production login failed after deployment because the PowerShell env-pipe likely included a UTF-8 BOM in encrypted values. Env vars were removed and re-added using a no-BOM temp file.
- Tina email: pending explicit approval.
- Morning feedback automation: pending explicit request.

Active handoff update, 2026-05-30 20:16 America/Phoenix:

- Current agent reviewed this coordination file first, as requested.
- Working tree already had uncommitted edits in `PROJECT_COORDINATION.md`, `README.md`, `src/app/api/login/route.ts`, `src/lib/auth.ts`, `src/lib/openrouter.ts`, and `src/lib/storage.ts`.
- Existing diffs were inspected before any implementation edits.
- `Get-Command vercel` found `C:\Users\seane\AppData\Roaming\npm\vercel.ps1`; `vercel --version` returned `51.7.0`, so the local CLI is currently usable in this shell.
- Local runtime check: Node `v22.12.0`, npm `10.9.0`.
- Verification rerun in this active pass: `npm run lint` passed; `npm run build` passed with Next.js `16.2.6` and 21 static pages generated.
- Vercel custom domain verification: `https://nanny-app.aistudioprojects.com/login` returns 200, and `/` redirects to `/login?next=%2F`.
- Vercel environment check: required production env vars except Upstash are present.
- Production login/API retest after deployment passed on `https://nanny-app.aistudioprojects.com`.
- Remaining gates before sharing with Tina: decide whether to share with voice transcription blocked, explicit Sean approval for email, and any requested morning feedback automation.
