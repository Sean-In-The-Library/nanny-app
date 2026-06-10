# Family Nanny Hub

Private, mobile-first family operations app for Sean, Tina, and Faith.

Production target:

- `https://nanny-app.aistudioprojects.com`
- Vercel project shown as `nanny-app-8gy6`
- GitHub repository: `https://github.com/Sean-In-The-Library/nanny-app`

## What It Does

- Password-gated dashboard for parent/nanny coordination.
- Day Log at `/day`: one-tap shift logging per child (nap with live timer, bottle/meal/snack, diaper, medication, mood, notes, activities), a timeline with time adjustment and delete, and per-day history browsing. Medication quick-logs also write a Medication page entry so next-dose timing stays tracked.
- Right Now strip on the dashboard: live per-child nap state, last feed, last diaper, and last medication with next-allowed dose time.
- AI Day Digest: `/api/ai/daily-digest` turns the day log into a warm end-of-day handoff summary with attention flags through OpenRouter, with a deterministic local fallback when AI is unavailable. The digest appears on the dashboard and the Day Log page.
- Tina-first dictation flow: dictate live in supported browsers, record/upload for OpenAI `gpt-4o-transcribe`, type as a fallback, convert to reviewable action items, then save selected items.
- Source-of-truth pages for notes, chores, supplies, trackers, care manuals, development goals, calendar, medication, milestones, and nanny admin reminders.
- Mobile source pages open in review mode first, with compact add-entry actions that reveal forms only when needed.
- Dashboard surfaces active items through day/month priority buckets: today, later today, this month, and can wait.
- Care manual generator converts rough notes into an approved manual draft through OpenRouter.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Vercel
- OpenRouter for structured care/manual/action drafting
- OpenAI `gpt-4o-transcribe` for audio transcription
- Neon Postgres or Upstash Redis for durable shared Vercel persistence

## Environment Variables

Create `.env.local` for local development:

```bash
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=openai/gpt-4.1-mini

OPENAI_API_KEY=your_openai_key_here
OPENAI_TRANSCRIBE_MODEL=gpt-4o-transcribe

APP_PASSWORD_SEAN=your_password_here
APP_PASSWORD_TINA=your_password_here
APP_PASSWORD_FAITH=your_password_here
APP_SESSION_SECRET=replace_with_a_long_random_secret

APP_PUBLIC_URL=https://nanny-app.aistudioprojects.com

DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`DATABASE_URL` is the preferred production persistence path. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are still supported as a fallback. Without either database option, the deployed app can save during a warm serverless session, but data may reset when Vercel rotates the function instance.

Never commit `.env`, `.env.local`, API keys, or real passwords.

## Local Development

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`

Useful checks:

```bash
npm run lint
npm run build
```

## Login Test

1. Visit `/` while logged out.
2. Confirm redirect to `/login`.
3. Select Tina.
4. Confirm the email is `tinakharrington@gmail.com`.
5. Try a bad password and confirm it fails.
6. Try the configured Tina password and confirm the dashboard loads.
7. Use Logout and confirm protected routes redirect back to `/login`.

Faith has a visually distinct nanny login screen, but the nanny workflow is intentionally light until that side is designed.

## Voice Model Choice

Tina's audio flow uses OpenAI `gpt-4o-transcribe` through `/api/ai/transcribe`. That model is the default because the app needs higher transcription accuracy for child names, chores, medication, and time-sensitive instructions. `gpt-4o-mini-transcribe` can be used later by changing `OPENAI_TRANSCRIBE_MODEL` if cost becomes more important than accuracy.

The route prompts the model with family-specific terms: Tina, Sean, Faith, Kieran, Connor, diapers, wipes, Tylenol, Motrin, potty, nap, and Wonder Wagon.

The command center also includes a browser-native live `Dictate` button. That gives Tina an immediate dictate-to-action path when the OpenAI transcription key is unavailable, while keeping the OpenAI route as the higher-accuracy upload/recording path.

## Vercel Deployment

Required production env vars:

- `APP_PASSWORD_SEAN`
- `APP_PASSWORD_TINA`
- `APP_PASSWORD_FAITH`
- `APP_SESSION_SECRET`
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `APP_PUBLIC_URL=https://nanny-app.aistudioprojects.com`
- `DATABASE_URL`

Optional production env vars:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENROUTER_MODEL=openai/gpt-4.1-mini`
- `OPENAI_TRANSCRIBE_MODEL=gpt-4o-transcribe`

Deploy:

```bash
vercel link
vercel env ls
vercel deploy --prod
```

After deployment, test:

- `https://nanny-app.aistudioprojects.com/login`
- Tina login
- dashboard load
- add/resolve a note
- create/complete a chore
- add/resolve a supply
- add/resolve a tracker
- add/complete an admin reminder
- medication next-allowed calculation
- care manual draft generation when `OPENROUTER_API_KEY` is present
- voice transcription when `OPENAI_API_KEY` is present
