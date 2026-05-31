# Family Nanny Hub

Private, mobile-first family operations app for Sean, Tina, and Faith.

- GitHub repository: https://github.com/Sean-In-The-Library/nanny-app
- Product ownership: Tina Harrington (primary owner/operator)
- Sponsors/users: Sean and Tina

The MVP focuses on fast daily coordination: urgent notes, chores, supplies, trackers, medication, calendar, development goals, and care manuals. The dashboard surfaces only what needs attention now.

## MVP Goals

- Keep entry and review fast (usable in under 10 seconds on phone).
- Use simple password-based login for the three household users.
- Protect all app routes except `/login`.
- Keep implementation minimal and local-first before deployment.
- Add AI-assisted care note summarization with OpenRouter.

## Planned Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- OpenRouter API (for care manual summarization)
- GitHub for source control
- Vercel deployment later (not immediate)

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

Create a local env file (`.env.local`) with:

```bash
OPENROUTER_API_KEY=your_openrouter_key_here

APP_PASSWORD_SEAN=your_password_here
APP_PASSWORD_TINA=your_password_here
APP_PASSWORD_FAITH=your_password_here
```

Notes:

- Do not commit real passwords or API keys.
- `.env` and `.env.local` are ignored by git.
- Keep passwords private and share through a secure channel only.

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

## OpenRouter Care Manual Summarization (Planned)

Expected API route:

- `POST /api/ai/summarize-care-notes`

Behavior:

- Uses `OPENROUTER_API_KEY`.
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

Vercel deployment is intentionally deferred until the local MVP is stable and worth deploying.

When ready:

1. Connect the GitHub repository to Vercel.
2. Add production environment variables.
3. Deploy from GitHub.
4. Run full browser and mobile verification.
