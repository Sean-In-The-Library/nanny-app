# Family Nanny Hub Coordination

## 1. Purpose

Family Nanny Hub is a private, mobile-first coordination app for Sean, Tina, and Faith. The goal is to make daily nanny handoffs fast enough for tired parents and caregivers: urgent notes, chores, supplies, child trackers, calendar items, medication entries, developmental goals, milestones, nanny admin reminders, and care manuals should be visible without digging through texts.

The app is intentionally simple for the MVP:

- Password-gated access for Sean, Tina, and Faith.
- Dashboard-first workflow showing only what needs attention now.
- Source pages for notes, chores, supplies, trackers, care manuals, development, calendar, medication, milestones, and nanny admin reminders.
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
- Neon Postgres is the preferred production persistence layer, with Upstash Redis still supported as a fallback.
- Local development falls back to `.data/nanny-hub.json`.
- OpenRouter powers care manual and dictation action-item generation.
- OpenAI `gpt-4o-transcribe` supports browser audio dictation for Tina's voice workflow.
- Browser-native live speech recognition is also available for Tina as a no-key fallback when the browser supports it.

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
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
APP_PUBLIC_URL=https://nanny-app.aistudioprojects.com
```

Production env status as of 2026-05-31:

- Added through Vercel CLI for production: `APP_PASSWORD_SEAN`, `APP_PASSWORD_TINA`, `APP_PASSWORD_FAITH`, `APP_SESSION_SECRET`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, and `APP_PUBLIC_URL`.
- `DATABASE_URL` and Neon Postgres connection env vars were added through the Vercel Marketplace Neon integration for production and preview.
- Not yet configured: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; these are optional if Neon is connected.

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
- Vercel verification: latest Git-triggered production deployment `dpl_5EDEw9RgzQiy9sMkKmyYwDSRhPPo` is `READY` at `https://nanny-app-8gy6-80konqwuk-seans-projects-3ff264cf.vercel.app` and aliased to `https://nanny-app.aistudioprojects.com`; the app-code production deployment `dpl_ChctFGRML6WD7j5JPizYdFQNeKgw` was also `READY`.
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
- Latest production login/API retest after Git-triggered deployment passed on `https://nanny-app.aistudioprojects.com`.
- Custom-domain light check after coordination-only deploys: `/login` returns 200 and unauthenticated `/` redirects to `/login?next=%2F`.
- Remaining gates before sharing with Tina: decide whether to share with voice transcription blocked, explicit Sean approval for email, and any requested morning feedback automation.

Active browser QA update, 2026-05-30 20:26 America/Phoenix:

- Sean requested Browser/browser-use verification with Tina credentials, an audio or video file from Downloads, and the Faith nanny profile.
- Candidate local media files were found in `C:\Users\seane\Downloads`, including recent `.mp4` files and older `.mov`/`.mp3` files.
- Code inspection before browser testing showed the UI recorded microphone audio but did not expose a file-upload control for existing audio or video files; `/api/ai/transcribe` accepts one multipart field named `audio`.
- Implementation update: `src/components/TinaCommandCenter.tsx` now includes an `Upload File` button and hidden file input accepting common audio/video formats, reusing the same transcription path as microphone recordings.
- Implementation update: `src/app/api/ai/transcribe/route.ts` now describes uploads as audio or video recordings, matching the new UI.
- Implementation update: `src/components/pages/DashboardPage.tsx` now shows Tina/Sean the parent command center and shows Faith a separate nanny-oriented dashboard intro.
- Verification: `npm run lint` passed and `npm run build` passed after the upload-control change.
- Remaining blocker: actual transcription with uploaded files is still blocked by the OpenAI organization/API-key 401 until `OPENAI_API_KEY` is fixed.
- Browser Tina login succeeded and the command center generated warm, non-blaming draft items from a synthetic parent note.
- Browser Faith login succeeded, but the nanny profile could see the Tina command center, which is not appropriate for a nanny-facing experience.
- Cross-profile handoff of a saved test item did not reliably appear in a fresh Faith session because production is still using non-durable serverless `/tmp` storage instead of Upstash.
- Implementation changes in progress: add an Upload File control for existing iPhone audio/video recordings and replace the Tina command center with a Faith-specific dashboard intro for nanny users.
- Direct production media tests with Downloads files found a Vercel request-body ceiling before app code runs: 5.4 MB `.mp4`, 7.4 MB `.mp3`, and 41.3 MB `.mov` returned 413. Smaller `.mp4` files under 2 MB reached OpenAI but returned the existing 401 organization/API-key error.
- Implemented local changes: Tina command center now has an Upload File control accepting common audio/video/iPhone extensions; client and API now explain the current 4 MB production upload ceiling; Faith dashboard now shows a nanny-specific intro instead of the Tina command center.
- Verification after edits: `npm run lint` passed and `npm run build` passed.
- Pushed production commit `bc383aa` (`Add transcription upload size guard`); Vercel deployment `https://nanny-app-8gy6-5hsuw76go-seans-projects-3ff264cf.vercel.app` returned Ready.
- Post-deploy browser verification: Tina login shows Upload File in the command center; Faith login shows the nanny-specific "Today's care notes" panel and no Tina command center.
- Post-deploy media verification: 4.27 MB `.mp4` returns the app's clear 400 size message; 3.43 MB and 3.93 MB `.mp4` files reach OpenAI but still return the production OpenAI 401 organization/API-key error.
- Temporary production data snapshot was restored after the browser save test.

Active persistence update, 2026-05-30 20:43 America/Phoenix:

- Upstash Redis Marketplace provisioning was inspected through Vercel CLI; the available Redis plan is pay-as-you-go rather than free.
- Neon Marketplace provisioning was completed through Vercel CLI on the `free_v3` plan with region `pdx1`, resource name `nanny-app-data`.
- Implementation update: `src/lib/storage.ts` now uses Neon/Postgres when `DATABASE_URL` or `POSTGRES_URL` is present, falls back to Upstash Redis when configured, and otherwise uses the local file fallback.
- Documentation update: `.env.example` and `README.md` now list `DATABASE_URL` as the preferred production persistence setting.
- Vercel env check now shows `DATABASE_URL`, `POSTGRES_URL`, and related Neon variables attached to production and preview.
- Verification after the storage update: `npm run lint` passed and `npm run build` passed locally.
- GitHub push: commit `12ceb58` (`Add durable Neon storage`) was pushed to `origin/main`.
- Vercel CLI production deployment: `dpl_5K7ehdASktmV7wtRK7zBP9h5ziVY` is `READY`; Vercel plugin confirms `nanny-app.aistudioprojects.com` remains attached to the `nanny-app-8gy6` project.
- Production custom-domain smoke after Neon deployment passed: `/login` returns 200, unauthenticated `/` redirects to `/login?next=%2F`, Tina login returns the configured profile, `/api/data` read works, a temporary note write/read/restore worked, dictation actionization returned draft items, and care manual summarization returned a summary with follow-up questions.
- Production Faith smoke after Neon deployment: Faith login returns role `nanny`; the parent command center is not present in the server-rendered dashboard HTML.
- Remaining blocker: production recording/upload transcription still returns OpenAI 401, "You do not have access to the organization tied to the API key." The OpenAI app code and upload UI are wired correctly, but the production OpenAI key or organization access must be fixed before Tina can use the higher-accuracy model transcription path.

Active voice fallback update, 2026-05-30 20:51 America/Phoenix:

- Implementation update: `src/components/TinaCommandCenter.tsx` now includes a browser-native live `Dictate` button using `SpeechRecognition`/`webkitSpeechRecognition` when available.
- This gives Tina an immediately usable dictate-to-action path in supported browsers even while the OpenAI transcription key is blocked.
- The existing `Record` and `Upload File` controls remain wired to `/api/ai/transcribe` and OpenAI `gpt-4o-transcribe` for the higher-accuracy model path once the API key/org access is fixed.
- Verification after the fallback update: `npm run lint` passed and `npm run build` passed locally.

Active device-optimization feedback, 2026-05-31:

- New feedback: the visual design is strong, but the dashboard needs a MacBook Air and iPhone optimization pass.
- Product decision: consolidate the homepage around four priority bands instead of showing every source feed equally: today, later today, this month, and can wait.
- Product decision: MacBook Air should use width for context and reduce clicking; iPhone should lead with urgent/current items and make secondary context easy to scan.
- Product decision: feed filtering should distinguish day-level importance from month-level importance.
- Implementation update: `src/lib/dashboard.ts` now produces consolidated dashboard buckets: `today`, `laterToday`, `month`, and `canWait`, plus summary counts for urgent and overdue items.
- Implementation update: `src/components/pages/DashboardPage.tsx` now uses a consolidated focus feed with bucket filtering, top summary metrics, and a MacBook-width context rail for month/later/can-wait items.
- Implementation update: the iPhone layout keeps a single priority feed first, with the same filters exposed as large tap targets.
- Existing source pages remain unchanged.
- Verification after the dashboard update: `npm run lint` passed and `npm run build` passed locally.
- React best-practices review: hooks are top-level, icon renderers are stable components, list keys use durable item ids, and action buttons remain native buttons/links.
- GitHub push: commit `819af5c` (`Consolidate dashboard priorities`) was pushed to `origin/main`.
- Vercel CLI production deployment via `npx vercel deploy --prod --scope seans-projects-3ff264cf --yes`: deployment `dpl_BfYV8J9u7A28N5LuxzyxNNQNK6ZF` is `READY` and aliased to `https://nanny-app.aistudioprojects.com`.
- Vercel plugin confirmation: project `nanny-app-8gy6` latest production deployment is `dpl_BfYV8J9u7A28N5LuxzyxNNQNK6ZF`.
- Production custom-domain smoke after the dashboard pass passed: `/login` returns 200, unauthenticated `/` redirects to `/login?next=%2F`, Tina login returns role `parent`, Faith login returns role `nanny`, `/api/data` read works, temporary note write/read/restore worked, and dictation actionization returned draft items.
- Production logs check after smoke: Vercel logs showed 200 responses for `/api/login`, `/api/session`, `/api/data`, `/api/ai/actionize-dictation`, plus expected 307 for `/`.
- Browser plugin limitation: Playwright browser verification still cannot launch Chrome in this desktop session; Chrome exits with code 13 before page load. HTTP/API and build verification are complete.

Active branch consolidation request, 2026-05-31:

- Sean requested merging all branches, committing, pushing to `main`, and deploying on Vercel.
- Local branch audit before fetch showed only `main` and `origin/main`.
- `git fetch --all --prune` completed; `git branch --all --verbose --no-abbrev` still showed only `main` and `origin/main`.
- `git ls-remote --heads origin` showed only `refs/heads/main` at `cf207398eff94b29848979f0eb94a238514130eb`.
- GitHub plugin branch search also returned only `main`.
- `git pull --ff-only origin main` returned `Already up to date.`
- Merge result: no non-main branches exist to merge; the deploy will use current `main` plus this coordination audit commit.
- Verification before push: `npm run lint` passed and `npm run build` passed locally.
- GitHub push: commit `be4da3f` (`Record branch consolidation audit`) was pushed to `origin/main`.
- Vercel CLI production deployment via `npx vercel deploy --prod --scope seans-projects-3ff264cf --yes`: deployment `dpl_Hrtn2faRdxj9gMrz5epq5o2Euk6o` is `READY`.
- Vercel plugin confirmation: project `nanny-app-8gy6` latest production deployment is `dpl_Hrtn2faRdxj9gMrz5epq5o2Euk6o`.
- Custom-domain smoke after deploy: `https://nanny-app.aistudioprojects.com/login` returns 200 and unauthenticated `/` redirects to `/login?next=%2F`.

Active Tina email feedback follow-up, 2026-05-31:

- Sean requested a Gmail check for Tina-sent messages that should update this repository, implementation of any resulting fix, push to `main`, Vercel deployment, and another email check in at least one hour.
- Gmail search scope checked Tina's known sender addresses for recent app/nanny/Faith/dashboard/iPhone/MacBook/dictation terms; no recent Tina-sent app feedback was found.
- Related older Tina-sent nanny emails were reviewed at a high level; they point to a practical admin need around nanny contracts, payroll setup, forms, and quarterly nanny tax reminders.
- Product decision: add a neutral Nanny Admin area for contract/payroll/tax/form reminders without importing private email content or private document details into the repo.
- Follow-up automation: scheduled a one-time heartbeat in this thread for tonight only at 11:00 PM Phoenix time, to re-check Tina email for new actionable nanny-app feedback and, if present, repeat the repo/update/deploy cycle.
- Implementation update: added `/admin`, parent-facing admin reminder CRUD, `AdminItem` data types, dashboard prioritization for open admin reminders, and storage normalization so older Neon/Redis/local records without `adminItems` still load.
- Privacy decision: admin reminders are parent-facing in the UI; Faith's dashboard and bottom navigation do not surface the Admin area in this pass.
- Documentation update: `README.md` and `plan.md` now include nanny admin reminders.
- Verification after implementation: `npm run lint`, `npm run build`, and `git diff --check` passed locally.

Active Tina nanny-preview request, 2026-05-31:

- Sean requested that Tina be able to toggle into the nanny view to see what Faith's dashboard would look like.
- Implementation decision: add a Tina-only dashboard segmented control rather than changing Tina's actual authenticated role.
- Parent mode keeps Tina's command center and parent/admin dashboard items visible.
- Nanny preview mode hides parent/admin dashboard items and the Tina command center, then shows the same simplified nanny-facing dashboard intro Faith sees.

Active mobile source-page redesign, 2026-06-01:

- Sean feedback: mobile source pages waste too much first-screen space on large add-entry forms; the actual existing items should be visible first, with a compact add action available.
- Design-agent decision: source pages should default to review mode, not creation mode. Add/edit forms should be progressive disclosure surfaces opened by a small page action.
- Design-agent decision: keep the language simple and operational: "Add Entry" as the default action, then page-specific save labels inside the form.
- Implementer plan: apply the list-first/add-on-demand pattern across notes, chores, supplies, trackers, development, calendar, medication, milestones, admin reminders, and the care-manual AI draft panel; then run lint/build, push to `main`, deploy production, and email Tina.
- Implementation update: source pages now default to the item list on mobile and expose compact `Add Entry` or `Generate Draft` actions in the page header; forms collapse after save or cancel and reopen for edits.
- Implementation update: the mobile bottom navigation is now a horizontally scrollable glass-style tray with larger touch targets instead of an eight-column squeeze.
- Local verification: `npm run lint`, `npm run build`, and `git diff --check` passed; the first rebuild hit a transient Windows `.next` EBUSY lock and then passed on retry.
- Browser limitation: Playwright/Browser still cannot launch local Chrome in this desktop session, exiting with code 13 before page load; HTTP checks confirmed local `/login` returns 200 and protected source pages redirect to login.

Active backend/Vercel readiness pass, 2026-06-02:

- Backend agent reviewed this coordination file first and stayed inside backend/API/storage/docs ownership.
- Vercel CLI is available in this shell at `C:\Users\seane\AppData\Roaming\npm\vercel.ps1`; `vercel --version` returned `54.6.1`.
- Implementation update: API routes now enforce route-handler session checks in addition to `src/proxy.ts`; production still redirects unauthenticated requests at the proxy layer before handlers run.
- Implementation update: `/api/data` now filters parent-only `adminItems` out of nanny responses and preserves existing admin reminders on nanny writes, so Faith's backend view matches the parent/admin privacy boundary already used in the UI.
- No deploy, commit, push, or email was performed in this pass.

Active front-end mobile UX pass, 2026-06-02:

- Front-end agent reviewed this coordination file first and stayed inside front-end UI/components/page-shell ownership while preserving concurrent backend/API changes.
- Implementation update: dashboard now uses role-aware quick actions, with Tina/Sean parent shortcuts and Faith/nanny shortcuts aligned to common daily tasks.
- Implementation update: the bottom nav now keeps Home, Notes, Chores, Track, and More as the primary mobile tray; secondary routes remain available in a role-aware More panel.
- Implementation update: source pages keep existing items visually first and move add/edit forms into a secondary sticky panel when opened; quick-action query links open the appropriate add/draft panel once and then clean the URL.
- Verification: `npm run lint`, `npm run build`, and `git diff --check` passed locally.
- Browser smoke: local `/login` rendered at mobile size, Faith login mode toggled, and `/notes?new=1` redirected unauthenticated users to `/login?next=%2Fnotes%3Fnew%3D1`.
- Browser blocker: authenticated dashboard visual QA could not be completed because no local Tina password env var was present in `.env.local` or `.env`; no production credentials were used or printed.
- No deploy, commit, push, or email was performed in this pass.

Active integrated two-agent UX/deploy pass, 2026-06-02:

- Sean requested a full expert mobile UX streamlining pass with two spawned agents: front-end and backend/Vercel.
- Product decision: common parent/nanny actions should be reachable from Home or the floating Quick menu in one tap, with source pages still list-first unless the user explicitly chooses to add something.
- Implementation update: added role-aware quick actions, a floating Quick menu, a More bottom-nav sheet, and `?new=1` / `?draft=1` direct-open behavior across source pages.
- Implementation correction after Browser QA: add/draft panels now appear immediately under the header on mobile after a shortcut or `Add Entry`, while desktop keeps the sticky secondary-panel layout.
- Implementation update: Quick and More menus now close each other so mobile overlays do not stack.
- Backend update: API route handlers now require a session directly, and `/api/data` hides parent-only `adminItems` from nanny reads while preserving parent admin reminders on nanny writes.
- Local verification: `npm run lint`, `npm run build`, and `git diff --check` passed after integration.
- Browser mobile QA used a temporary local server on port 3001 with non-production test passwords. Tina parent login passed; Home shortcuts were visible before the feed; the Note shortcut opened the add form immediately; Quick and More were tested; Faith login passed; Faith More hid Admin; Faith `/api/data` returned zero admin items.
- Temporary local test server and generated QA logs were stopped/removed after testing.
- Vercel CLI check: `vercel --version` returned `54.6.1`; production deploy remains pending until this integrated pass is committed and pushed.
- Known remaining blocker: production OpenAI transcription may still return the prior OpenAI organization/API-key 401 until the production key/org access is corrected; this pass did not retest model transcription.
