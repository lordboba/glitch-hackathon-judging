# glitch-hackathon-judging

Next.js mockup for a configurable hackathon platform based on `/Users/tylerxiao/Downloads/hackathon_platform_boilerplate.md`.

## What it includes

- organizer access route with a separate authorization code gate
- general hackathon configuration workspace for format, audience, roles, judging, and invite policy
- invite-based participant entry for judges and builders
- role-specific participant workspace with judge scoring and builder readiness views
- App Router structure that builds cleanly for Vercel

## Local run

1. Install dependencies:

```bash
npm install
```

2. Copy the env template and set the organizer code if you want to change it:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Routes

- `/` landing page and product overview
- `/admin/access` organizer authorization gate
- `/admin` organizer configuration workspace
- `/join` invite-based participant entry
- `/workspace` judge or builder workspace after invite login

## Demo access

- Organizer code: `ORBIT-ADMIN-2026`
- Judge invite: `JUDGE-ORBIT-27`
- Builder invite: `BUILD-ATLAS-19`

## Vercel notes

- Set `ADMIN_AUTH_CODE` in Vercel project environment variables.
- Deploy as a standard Next.js project with `npm run build`.
- Current auth and product data are mock/demo-only and cookie/local-state based, so the next real step is wiring a database and real identity provider.
