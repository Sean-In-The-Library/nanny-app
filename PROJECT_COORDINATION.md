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
https://nanny-app-8gy6.vercel.app
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
- OpenAI transcription endpoint supports browser audio dictation.

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
APP_PUBLIC_URL=https://nanny-app-8gy6.vercel.app
```

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

Immediate plan:

1. Finish route wiring so every app route renders the full implementation.
2. Add or update documentation for the Vercel-connected project.
3. Run lint and production build.
4. Commit and push to `main`.
5. Verify Vercel production deployment.
6. Email Tina with current state, goals, audio-driven work completed, three feedback questions, production URL, and masked login details.
7. Schedule a morning feedback check and implementation follow-up.

Status:

- Product and coordination document: complete.
- Engineering verification: `npm run lint` passed; `npm run build` passed.
- GitHub deployment trigger: pending.
- Vercel verification: pending.
- Tina email: pending.
- Morning feedback automation: pending.
