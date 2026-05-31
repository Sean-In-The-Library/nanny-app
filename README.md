# Family Nanny Hub

Private, mobile-first family operations app for Sean, Tina, and Faith.

- GitHub repository: https://github.com/Sean-In-The-Library/nanny-app
- Vercel production: https://nanny-app-8gy6.vercel.app
- Vercel project: `nanny-app-8gy6`
- Product ownership: Tina Harrington (primary owner/operator)
- Sponsors/users: Sean and Tina

The MVP focuses on fast daily coordination: urgent notes, chores, supplies, trackers, medication, calendar, development goals, and care manuals. The dashboard surfaces only what needs attention now.

## MVP Goals

- Keep entry and review fast (usable in under 10 seconds on phone).
- Use simple password-based login for the three household users.
- Protect all app routes except `/login`.
- Keep implementation minimal, mobile-first, and Vercel-safe.
- Add AI-assisted care note summarization with OpenRouter.

## Planned Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- OpenRouter API (for care manual summarization)
- OpenAI audio transcription API (for dictated notes)
- Upstash Redis for Vercel persistence
- GitHub for source control
- Vercel production deployment

## Core Routes

- `/` dashboard
- `/login`
- `/notes`
- `/chores`
- `/care-manuals`
- `/supplies`
- `/trackers`
- `/development`
- `/calendar`
- `/medication`
- `/milestones`

## Environment Variables

Create a local env file (`.env.local`) from `.env.example` with:

```bash
OPENROUTER_API_KEY=your_openrouter_key_here
OPENAI_API_KEY=your_openai_key_here
APP_SESSION_SECRET=generate_a_long_random_secret

APP_PASSWORD_SEAN=your_password_here
APP_PASSWORD_TINA=your_password_here
APP_PASSWORD_FAITH=your_password_here

UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
APP_PUBLIC_URL=https://nanny-app-8gy6.vercel.app
```

Notes:

- Do not commit real passwords or API keys.
- `.env` and `.env.local` are ignored by git.
- Keep passwords private and share through a secure channel only.
- In Vercel, add the same values under Project Settings -> Environment Variables.
- Without Upstash Redis, production can load seed data but will reject saves instead of pretending data is persistent.

## Local Setup

```bash
git clone https://github.com/Sean-In-The-Library/nanny-app.git
cd nanny-app
npm install
```

Then add your local environment file and run:

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Login and Auth Test Checklist

1. Visit the app while logged out and confirm redirect to `/login`.
2. Select one user (`Sean`, `Tina`, or `Faith`) and enter password.
3. Confirm valid password creates a session and grants access.
4. Confirm invalid password shows clear error and denies access.
5. Confirm protected routes cannot be visited while logged out.
6. Confirm logout clears session and returns to login flow.

## AI Endpoints

Current API routes:

- `POST /api/ai/summarize-care-notes`
- `POST /api/ai/actionize-dictation`
- `POST /api/ai/transcribe`

Behavior:

- Uses `OPENROUTER_API_KEY`.
- Uses `OPENAI_API_KEY` for audio transcription.
- Returns clean, parent-friendly care manual drafts.
- Supports approve-before-save flow for manual review.

## Suggested Development Flow

```bash
npm run lint
npm run build
```

Then commit and push:

```bash
git status
git add .
git commit -m "Build nanny app MVP foundation"
git push origin main
```

## Deployment Status

Vercel production is connected to the GitHub `main` branch:

- Production URL: https://nanny-app-8gy6.vercel.app
- Project slug: `nanny-app-8gy6`
- Framework: Next.js
- Runtime: Vercel Node.js 24.x

Deployment checklist:

1. Push working changes to `main`.
2. Confirm the Vercel deployment finishes successfully.
3. Add production environment variables before using real family data.
4. Run full browser and mobile verification.
