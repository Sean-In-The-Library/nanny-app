````markdown
# Family Nanny Hub: Three-Agent Build Plan

## Project Context

We are building a private family nanny web app for Sean, Tina, and Faith.

The app will live in this existing GitHub repository:

https://github.com/Sean-In-The-Library/nanny-app

We are not deploying to Vercel immediately. First, we will build and test the app locally and push working code to GitHub. Once there is something worth deploying, we will connect the GitHub repo to Vercel and deploy from there.

The app should use an OpenRouter API key through an environment variable for AI-assisted features, especially summarizing dictated care notes into clean care manuals.

The app should be simple, mobile-first, and easy to use by a tired parent or nanny in under 10 seconds.

## Core App Concept

Build a private, mobile-optimized family operations dashboard for nanny coordination.

The main landing page should be a dashboard showing anything that needs immediate attention:

- Urgent notes
- Medical or medication reminders
- Child status alerts
- Due or overdue chores
- Low supplies
- Upcoming appointments
- Household visitors
- Travel dates
- Active developmental goals
- Other “on the radar” items

Each separate page should be the source of truth. The dashboard should pull important items from those pages instead of duplicating information.

## Users

There are only three users:

- Sean
- Tina
- Faith

## Authentication Requirement

Build a very simple password gate.

Do not use OAuth, Clerk, Auth0, Supabase Auth, or any complex authentication system for the MVP.

### Login Behavior

- User visits the app.
- If not authenticated, redirect to `/login`.
- User selects:
  - Sean
  - Tina
  - Faith
- User enters a password.
- Password is checked against environment variables.
- If valid, create a simple authenticated session.
- If invalid, show a clear error message.
- All app routes should be protected except `/login`.

### Environment Variables

```bash
OPENROUTER_API_KEY=your_openrouter_key_here

APP_PASSWORD_SEAN=your_password_here
APP_PASSWORD_TINA=your_password_here
APP_PASSWORD_FAITH=your_password_here
````

### Preferred Auth Implementation

Use a server-side login route and protected middleware.

Suggested routes:

```text
/api/login
/api/logout
```

Suggested files:

```text
src/lib/auth.ts
middleware.ts
```

The password should never be committed to GitHub.

## Recommended Stack

Use:

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* Vercel, when ready
* GitHub
* OpenRouter API
* Simple persistence for MVP

For persistence, start as simple as possible. If Vercel deployment requires persistent storage beyond local development, use one of:

* Vercel Postgres
* Neon
* Supabase database only, not Supabase Auth
* Vercel KV

Do not overbuild the database layer in the first pass.

## Design Direction

Use a clean, bright, child-friendly design inspired by the feel of Bluey-style colors, but do not use Bluey characters, names, logos, or protected IP.

Design principles:

* Mobile-first
* Rounded cards
* Soft blue, orange, cream, green color palette
* Large tap targets
* Simple bottom navigation
* Minimal clutter
* Fast entry forms
* Easy dashboard scanning
* Friendly but not childish
* Works well on iPhone

Suggested navigation:

```text
Dashboard
Notes
Chores
Care
Supplies
Trackers
More
```

The “More” section can include:

```text
Development
Calendar
Medication
Milestones
Settings
```

## Required Pages

### 1. Dashboard: `/`

The dashboard is the main landing page.

It should show:

* Immediate notes
* Active medical notes
* Medication timing reminders
* Upcoming calendar items
* Due or overdue chores
* Supply alerts
* Child tracker alerts
* Development focus items
* Travel reminders
* Appointments
* Household visitors

Suggested dashboard sections:

```text
Today / On the Radar
Medication Window
Child Status Alerts
Upcoming Calendar
Due Chores
Low Supplies
Development Focus
```

Dashboard priority order:

```text
1. Medication windows
2. Urgent notes
3. Child status alerts
4. Today’s calendar
5. Overdue chores
6. Low supplies
7. Active development goals
8. Upcoming week
```

### 2. Login: `/login`

Simple user selector plus password field.

Users:

* Sean
* Tina
* Faith

Requirements:

* Wrong password fails.
* Correct password logs user in.
* Logout works.
* Protected routes cannot be accessed while logged out.

### 3. Immediate Notes: `/notes`

Purpose:

Quick notes from Sean or Tina to Faith.

Examples:

* “Both boys had a stomach bug this weekend.”
* “Continue diaper rash cream after each change.”
* “Handyman coming at 10:30.”
* “Kieran woke up early and may need an earlier nap.”

Fields:

```ts
id: string
title: string
body: string
priority: "normal" | "important" | "urgent"
createdBy: "Sean" | "Tina" | "Faith"
createdAt: string
expiresAt?: string
showOnDashboard: boolean
resolved: boolean
```

### 4. Chores: `/chores`

Purpose:

Source of truth for recurring nanny tasks.

Daily tasks can be listed, but the dashboard should emphasize non-daily tasks that are due or overdue.

Examples:

* Clean Wonder Wagon
* Clean playroom
* Clean after meals
* Rotate toys
* Restock diaper station
* Wipe high chairs

Fields:

```ts
id: string
title: string
description: string
frequency: "daily" | "weekly" | "biweekly" | "monthly" | "as_needed"
lastCompletedAt?: string
nextDueAt?: string
assignedTo?: "Sean" | "Tina" | "Faith"
showWhenDue: boolean
```

Dashboard logic:

* Show chores where `nextDueAt <= today`.
* Mark overdue chores visually.
* Let user mark a chore complete.
* Completion should update `lastCompletedAt` and calculate the next due date.

### 5. Care Manuals: `/care-manuals`

Separate care manuals for:

* Kieran
* Connor

Each child should have:

* Morning routine
* Meals
* Nap schedule
* Potty training
* Diapering
* Park/outside routine
* Comfort items
* Development notes
* Things to avoid
* Current schedule summary

Important feature:

The user should be able to paste or dictate several days of rough schedule notes. The app should use OpenRouter to summarize those notes into an average care schedule or clean care manual. The user must approve the generated manual before saving.

OpenRouter feature:

```text
Take these rough dictated notes and convert them into a clean nanny care manual for [child name]. Preserve concrete times, recurring patterns, preferences, and special instructions. Do not invent facts.
```

Suggested API route:

```text
POST /api/ai/summarize-care-notes
```

Input:

```ts
{
  childName: "Kieran" | "Connor",
  rawNotes: string
}
```

Output:

```ts
{
  summary: string,
  suggestedSchedule: string,
  questions: string[]
}
```

Prompt:

```text
You are helping create a nanny care manual from rough dictated parent notes.

Child: {{childName}}

Convert the notes into a clear, practical care manual for a nanny.

Rules:
- Preserve concrete details.
- Do not invent facts.
- If timing is uncertain, say “usually” or “approximately.”
- Organize into sections.
- Extract routine, meals, naps, potty/diapering, development, comfort, and special instructions.
- Flag unclear items as questions for Sean or Tina.

Raw notes:
{{rawNotes}}
```

### 6. Supplies: `/supplies`

Purpose:

Faith can quickly log that something is running low. Sean or Tina can mark it ordered or resolved.

Examples:

* Diapers
* Wipes
* Bottle washer tabs
* Snacks
* Milk
* Diaper cream
* Tylenol
* Sunscreen

Fields:

```ts
id: string
itemName: string
status: "running_low" | "last_one_opened" | "out" | "ordered" | "resolved"
notes?: string
reportedBy: "Sean" | "Tina" | "Faith"
createdAt: string
resolvedAt?: string
showOnDashboard: boolean
```

Dashboard logic:

* Show anything not resolved.
* Prioritize `out` and `last_one_opened`.

### 7. Trackers: `/trackers`

Purpose:

Track the absence of important things or unusual events, not every routine event.

Examples:

* Kieran did not poop today.
* Connor refused lunch.
* Poor nap.
* Rash worse.
* Unusual mood.
* Possible constipation.

Fields:

```ts
id: string
child: "Kieran" | "Connor"
type: "no_poop" | "refused_meal" | "poor_sleep" | "rash" | "behavior" | "other"
details: string
createdBy: "Sean" | "Tina" | "Faith"
createdAt: string
resolved: boolean
resolvedAt?: string
```

Dashboard logic:

* Show unresolved trackers.
* Allow one-tap “resolved.”

### 8. Development: `/development`

Purpose:

Track things Faith should help work on with the boys.

Examples:

* Potty training
* Letter sounds
* Practicing words
* Reading with Connor
* Full sentences
* Specific play or learning activities

Fields:

```ts
id: string
child: "Kieran" | "Connor"
goal: string
details: string
active: boolean
createdAt: string
updatedAt: string
showOnDashboard: boolean
```

Dashboard logic:

* Show active development goals.

### 9. Calendar: `/calendar`

Purpose:

Shared lightweight family/nanny calendar.

Examples:

* Sean travel dates
* Faith time off
* Doctor appointments
* Birthdays
* Birthday parties
* Vacation
* Household visitors
* Handyman visits

Fields:

```ts
id: string
title: string
description?: string
startDate: string
endDate?: string
category: "travel" | "appointment" | "faith_time_off" | "household" | "birthday" | "other"
createdBy: "Sean" | "Tina" | "Faith"
showOnDashboard: boolean
```

Dashboard logic:

* Show events in the next 7 days.
* Show urgent household events for today.

### 10. Medication: `/medication`

Purpose:

Replace Huckleberry-style medication tracking for occasional use.

Examples:

* Tylenol
* Motrin
* Antibiotics
* Diaper rash cream
* Other medicine or treatment notes

Fields:

```ts
id: string
child: "Kieran" | "Connor"
medicineName: string
dose: string
givenAt: string
givenBy: "Sean" | "Tina" | "Faith"
minimumIntervalHours?: number
notes?: string
```

Dashboard logic:

* Show last dose.
* Calculate next allowed dose if `minimumIntervalHours` is provided.

Example:

```text
Kieran: Tylenol given at 9:00 AM by Faith.
Next allowed after 1:00 PM.
```

Medication disclaimer inside the app:

```text
This app only tracks logged entries. Always follow medication labels, pediatrician guidance, and caregiver judgment.
```

### 11. Milestones: `/milestones`

Purpose:

Capture memorable development moments.

Examples:

* Connor said a new word.
* Kieran repeated letter sounds.
* Kieran used a new sentence.
* Connor started a new skill.

Fields:

```ts
id: string
child: "Kieran" | "Connor"
title: string
description: string
date: string
createdBy: "Sean" | "Tina" | "Faith"
```

Photo upload should be deferred.

Optional later:

* Photo upload with Vercel Blob
* Milestone export
* Monthly milestone summary

## Suggested File Structure

```text
/src
  /app
    /login
      page.tsx
    /notes
      page.tsx
    /chores
      page.tsx
    /care-manuals
      page.tsx
    /supplies
      page.tsx
    /trackers
      page.tsx
    /development
      page.tsx
    /calendar
      page.tsx
    /medication
      page.tsx
    /milestones
      page.tsx
    /api
      /login
        route.ts
      /logout
        route.ts
      /ai
        /summarize-care-notes
          route.ts
    layout.tsx
    page.tsx
  /components
    AppShell.tsx
    BottomNav.tsx
    DashboardCard.tsx
    PageHeader.tsx
    QuickAddButton.tsx
    PriorityPill.tsx
    ChildBadge.tsx
  /lib
    types.ts
    auth.ts
    dashboard.ts
    openrouter.ts
    storage.ts
    dateUtils.ts
middleware.ts
.env.example
README.md
```

## Agent 1: Product Structure, UI, and Frontend

### Mission

Build the app structure, navigation, UI, data models, and dashboard display logic.

### Responsibilities

1. Work inside the existing GitHub repo:

```text
https://github.com/Sean-In-The-Library/nanny-app
```

2. Create or update the Next.js app structure.
3. Use TypeScript and Tailwind.
4. Build the mobile-first layout.
5. Add protected app shell.
6. Create all required pages:

   * `/`
   * `/login`
   * `/notes`
   * `/chores`
   * `/care-manuals`
   * `/supplies`
   * `/trackers`
   * `/development`
   * `/calendar`
   * `/medication`
   * `/milestones`
7. Create shared components:

   * `DashboardCard`
   * `ChildBadge`
   * `PriorityPill`
   * `DueBadge`
   * `QuickAddButton`
   * `BottomNav`
   * `PageHeader`
   * `AppShell`
8. Define TypeScript models in:

```text
src/lib/types.ts
```

9. Implement mock data first so the app can be visually tested before backend persistence is finalized.
10. Implement dashboard display logic in:

```text
src/lib/dashboard.ts
```

### Acceptance Criteria

* App is fully navigable.
* All pages exist.
* Mobile layout works.
* Dashboard shows realistic mock urgent items.
* Forms exist for creating and editing entries.
* Dashboard shows only urgent, due, upcoming, or unresolved items.
* No dead navigation links.
* No TypeScript errors.

## Agent 2: Backend, Auth, OpenRouter, and GitHub

### Mission

Implement login, API routes, persistence, OpenRouter integration, README, and GitHub workflow.

### Responsibilities

1. Work inside the existing GitHub repo:

```text
https://github.com/Sean-In-The-Library/nanny-app
```

2. Implement simple password gate:

   * `/api/login`
   * `/api/logout`
   * protected middleware
   * env-based passwords for Sean, Tina, and Faith
3. Add server-side validation, preferably with Zod.
4. Create API routes for app data.
5. Decide MVP persistence strategy.
6. Implement OpenRouter route:

```text
POST /api/ai/summarize-care-notes
```

7. Add OpenRouter helper:

```text
src/lib/openrouter.ts
```

8. Add `.env.example`.
9. Make sure `.env.local` and other secrets are ignored.
10. Maintain clean commits.
11. Push working code to GitHub.
12. Add or update README with:

* project purpose
* local setup
* environment variables
* how to run locally
* how to test login
* future Vercel deployment notes

### Required `.gitignore`

```text
.env
.env.local
.next
node_modules
.vercel
```

### Git Workflow

Use the existing repo.

```bash
git clone https://github.com/Sean-In-The-Library/nanny-app.git
cd nanny-app
npm install
npm run dev
```

After work is complete:

```bash
git status
git add .
git commit -m "Build nanny app MVP foundation"
git push origin main
```

If working on a branch:

```bash
git checkout -b feature/mvp-foundation
git add .
git commit -m "Build nanny app MVP foundation"
git push origin feature/mvp-foundation
```

### Acceptance Criteria

* Login works for Sean, Tina, and Faith.
* Wrong password fails.
* Protected pages cannot be accessed without login.
* Logout works.
* OpenRouter call works when `OPENROUTER_API_KEY` is present.
* App runs locally with:

```bash
npm run dev
```

* Code is pushed to GitHub.
* README is accurate.

## Agent 3: Testing, Browser QA, and Later Vercel Deployment

### Mission

Test the app in the browser, verify it works locally, and prepare it for Vercel deployment when ready.

Do not deploy to Vercel until there is something worth deploying.

When ready, connect the GitHub repo to Vercel and deploy from the repo.

### Responsibilities Before Vercel

1. Pull latest code from GitHub.
2. Install dependencies.
3. Run the app locally.
4. Test in browser.
5. Test mobile viewport.
6. Test login and logout.
7. Test dashboard behavior.
8. Test data creation/editing/resolution.
9. Test medication time calculation.
10. Test OpenRouter care-manual summarization.
11. Check console errors.
12. Check TypeScript/build errors.

Local setup:

```bash
git clone https://github.com/Sean-In-The-Library/nanny-app.git
cd nanny-app
npm install
cp .env.example .env.local
npm run dev
```

Local test URL:

```text
http://localhost:3000
```

### Browser Test Checklist

#### Login

* Visit app while logged out.
* Confirm redirect to `/login`.
* Try wrong password.
* Confirm failure message.
* Login as Sean.
* Logout.
* Login as Tina.
* Logout.
* Login as Faith.

#### Dashboard

Create one item in each section and confirm it appears correctly:

* urgent note
* due chore
* low supply
* unresolved tracker
* calendar item within 7 days
* medication entry
* active development goal

Then resolve each item and confirm it disappears or changes state appropriately.

#### Medication

Test:

```text
Medicine: Tylenol
Given at: 9:00 AM
Minimum interval: 4 hours
Expected next allowed time: 1:00 PM
```

Confirm the dashboard displays the correct next allowed time.

#### Chores

Test:

```text
Chore: Clean Wonder Wagon
Frequency: monthly
```

Confirm:

* Can create chore.
* Can mark complete.
* Completion updates last completed date.
* Next due date updates.
* Past-due chore appears on dashboard.

#### Supplies

Test:

```text
Item: Diapers
Status: last_one_opened
```

Confirm:

* Appears on dashboard.
* Can mark ordered.
* Can mark resolved.
* Resolved item no longer appears as an active alert.

#### Trackers

Test:

```text
Child: Connor
Type: no_poop
Details: Did not poop today.
```

Confirm:

* Appears on dashboard.
* Can resolve with one tap.
* Resolved item no longer appears as active.

#### Care Manual AI

Test:

* Paste rough dictated notes.
* Generate care manual with OpenRouter.
* Confirm the app does not overwrite the existing manual until user approves.
* Confirm unclear items are flagged as questions.
* Confirm the model does not invent facts.

#### Mobile

Test in iPhone-width viewport.

Confirm:

* Bottom navigation works.
* Forms are not cramped.
* Buttons are easy to tap.
* Dashboard cards are readable.
* No horizontal scrolling.
* Login works on mobile.

### Vercel Deployment, Later

Only after the app works locally and has useful functionality:

1. Go to Vercel.
2. Import the GitHub repo:

```text
https://github.com/Sean-In-The-Library/nanny-app
```

3. Configure project:

   * Framework: Next.js
   * Build command: `npm run build`
   * Output: default
4. Add environment variables:

   * `OPENROUTER_API_KEY`
   * `APP_PASSWORD_SEAN`
   * `APP_PASSWORD_TINA`
   * `APP_PASSWORD_FAITH`
   * any database or storage variables
5. Deploy preview.
6. Inspect build logs.
7. Fix build errors.
8. Test the Vercel deployment in browser.
9. Test mobile layout.
10. Promote to production when stable.

### Vercel Acceptance Criteria

* Production Vercel URL works.
* App is password protected.
* Sean, Tina, and Faith can log in.
* Dashboard works.
* OpenRouter feature works.
* No obvious browser console errors.
* No broken routes.
* README deployment instructions are accurate.

## Shared Development Rules for All Agents

Build the smallest working private family nanny app first.

Prioritize:

```text
1. Fast entry
2. Mobile usability
3. Dashboard clarity
4. Simple authentication
5. Reliable local testing
6. GitHub push
7. Vercel deployment only when ready
```

Do not overbuild:

* no complex role permissions
* no social features
* no photo upload in MVP
* no enterprise auth
* no calendar integration yet
* no push notifications yet
* no unnecessary database complexity
* no protected IP from Bluey or any other cartoon

Every page should be usable by a tired parent or nanny from a phone in under 10 seconds.

## MVP Build Order

### Phase 1: Repo and Skeleton

* Clone existing GitHub repo.
* Confirm Next.js setup or create it if repo is empty.
* Add TypeScript.
* Add Tailwind.
* Add routing.
* Add app shell.
* Add mock data.
* Add dashboard cards.

### Phase 2: Auth

* Add env password gate.
* Add login page.
* Add logout.
* Protect routes.

### Phase 3: Core Pages and CRUD

Add create/edit/resolve behavior for:

* notes
* chores
* supplies
* trackers
* medication
* calendar
* development
* milestones
* care manuals

### Phase 4: Dashboard Logic

Pull important items from source pages into the dashboard:

* urgent notes
* due chores
* low supplies
* unresolved trackers
* upcoming calendar items
* active development goals
* medication timing

### Phase 5: OpenRouter

* Add care manual summarization.
* Add approve-before-save flow.
* Add error handling when API key is missing.
* Add loading state.
* Add “questions for Sean/Tina” output.

### Phase 6: Local Browser Testing

* Test desktop.
* Test mobile.
* Test login.
* Test dashboard.
* Test CRUD.
* Test OpenRouter.
* Test build.

Run:

```bash
npm run build
npm run lint
```

### Phase 7: GitHub Push

* Commit working code.
* Push to GitHub.
* Confirm repo is clean.

### Phase 8: Vercel Deployment, Later

* Connect GitHub repo to Vercel.
* Add environment variables.
* Deploy.
* Test production URL.
* Fix build issues.
* Promote when stable.

## Definition of Done

The MVP is done when:

* Code is pushed to:

```text
https://github.com/Sean-In-The-Library/nanny-app
```

* App runs locally.
* Sean, Tina, and Faith can log in.
* Unauthenticated users cannot access the app.
* Dashboard displays urgent and upcoming items from source pages.
* Users can add and resolve:

  * notes
  * supplies
  * trackers
  * medication
  * chores
  * calendar items
  * development goals
  * milestones
* Care manual generation works through OpenRouter.
* Browser testing confirms desktop and mobile usability.
* README explains setup, env vars, local testing, GitHub workflow, and later Vercel deployment.
* Vercel deployment is deferred until the app has enough working functionality to justify deployment.

```
```
