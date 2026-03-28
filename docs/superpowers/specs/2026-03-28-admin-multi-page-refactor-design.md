# Admin Multi-Page Refactor

Replace the monolithic admin dashboard with a multi-event, multi-page architecture using Next.js App Router dynamic segments.

## Problem

The current `/admin` page renders everything in a single `AdminDashboard` component: event config, CSV imports, judge invites, roster, assignment policy, project catalog, live leaderboard, and publish state. It's overwhelming and has no navigational hierarchy. There's also no concept of managing multiple events.

## Route Structure

```
/admin                          Event list + create new event
/admin/access                   Admin auth gate (unchanged)
/admin/[eventId]                Event overview dashboard
/admin/[eventId]/config         Event configuration form
/admin/[eventId]/invites        Judge invite management
/admin/[eventId]/judges         Judge roster + assignment policy
/admin/[eventId]/rankings       Live leaderboard + manual adjustments
/admin/[eventId]/publish        Review + publish leaderboard snapshot
```

## Pages

### Event List (`/admin`)

- Grid of event cards: name, status badge, date range, location, project count, judge count
- "Create event" form (inline or card-style)
- Clicking a card navigates to `/admin/[eventId]`
- Auth guard: redirect to `/admin/access` if no admin session

### Event Overview (`/admin/[eventId]`)

Read-only dashboard for quick orientation:

- Event name, status, date range header
- Summary stat cards: project count, judge count, invites sent, scorecards submitted
- Quick-nav links to each sub-section
- Compact leaderboard top-3 preview (if scores exist)

### Configuration (`/admin/[eventId]/config`)

- All event fields: name, org, format, audience, status, timezone, start/end dates, location, tracks, judge count, organizer goal
- Save button submits `updateEventAction`

### Invites (`/admin/[eventId]/invites`)

- Create invite form: email, label, track, optional custom code
- Invite roster table: email, label, track, status, redeemed-at, revoke button
- Actions: `createInviteAction`, `revokeInviteAction`

### Judges (`/admin/[eventId]/judges`)

- Judge roster table: name, email, track, capacity, current assignment count
- Assignment policy config: scope (all/top20/topN), minimum judges, track-matching, keep-existing toggles
- "Run assignments" button: `saveAssignmentPolicyAction`

### Rankings (`/admin/[eventId]/rankings`)

- Live leaderboard table: rank, project, team, track, submitted scorecards, average score, manual adjustment, final score
- Per-project inline edit: manual adjustment value, tiebreaker note
- Actions: `updateProjectReviewAction`

### Publish (`/admin/[eventId]/publish`)

- Config summary (read-only review of event settings)
- Published snapshot display with timestamp
- "Publish leaderboard" button: `finalizeLeaderboardAction`

## Shared Layout (`/admin/[eventId]/layout.tsx`)

- Auth guard: redirect to `/admin/access` if not admin
- Fetches event name + status for header
- Sidebar nav with links: Overview, Config, Invites, Judges, Rankings, Publish
- Active link highlighted based on current pathname
- "Back to events" link at top of sidebar
- Children rendered in main content area
- Follows the design system: Plus Jakarta Sans, JetBrains Mono for labels, slate+blue palette, compact admin spacing

## Data Layer

Split the monolithic `getAdminDashboardData()` into focused fetchers:

| Function | Used by | Returns |
|----------|---------|---------|
| `listEvents()` | Event list page | All events with counts |
| `getEventSummary(eventId)` | Layout + overview | Event details, stat counts |
| `getEventConfig(eventId)` | Config page | Full event record |
| `getEventInvites(eventId)` | Invites page | Invite list for event |
| `getEventJudges(eventId)` | Judges page | Judge roster + assignment policy |
| `getEventLeaderboard(eventId)` | Rankings page | Live leaderboard entries + projects |
| `getEventPublishState(eventId)` | Publish page | Config summary + published snapshot |

The existing `getAdminDashboardData()` can remain for backward compat initially but new pages use the focused fetchers.

## Server Actions

Existing actions in `app/admin/actions.ts` stay. Changes needed:

- Each action already receives `eventId` via form data
- Redirect paths change from `/admin?eventId=X&saved=Y` to `/admin/[eventId]/[section]`
- `revalidatePath` calls update to match new routes
- New action file at `app/admin/[eventId]/actions.ts` or keep centralized in `app/admin/actions.ts`

## CSV Import

The CSV import panel currently lives in `AdminDashboard`. It moves to the config page or gets its own section within the config page, since importing projects is part of event setup.

## Components

The monolithic `AdminDashboard` component is decomposed:

| New component | Purpose |
|---------------|---------|
| `EventListGrid` | Event cards grid for `/admin` |
| `EventOverview` | Dashboard stats for `/admin/[eventId]` |
| `EventConfigForm` | Config form for `/admin/[eventId]/config` |
| `InviteManager` | Invite form + roster for `/admin/[eventId]/invites` |
| `JudgeManager` | Roster + assignments for `/admin/[eventId]/judges` |
| `LeaderboardView` | Rankings table for `/admin/[eventId]/rankings` |
| `PublishPanel` | Review + publish for `/admin/[eventId]/publish` |

Each is a focused client component receiving only the data it needs via props from the server component page.

## Design

Follows the established design system:
- Plus Jakarta Sans body, JetBrains Mono for labels/badges/eyebrows
- Slate + blue accent palette (#0f172a ink, #2563eb accent, #e2e8f0 borders)
- Compact spacing for admin views
- No gradients, flat colors, subtle shadows
- Sidebar nav uses mono font for section labels
