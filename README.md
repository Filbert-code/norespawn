# NoRespawn

A dead-simple workout tracker. Train like every set is your last life.

Built with **React + Vite + TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**,
backed by **Supabase** (Postgres + Auth) and deployed on **Vercel**.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

Open http://localhost:5173.

## Full setup guide

A complete, click-by-click guide for standing up the whole stack — Supabase,
Google OAuth, Vercel, and the keep-alive workflow — lives at
[`docs/setup.html`](docs/setup.html). Open it in any browser.

## Docs & design

| Doc                                                       | What it covers                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`docs/setup.html`](docs/setup.html)                      | End-to-end stack setup (Supabase, OAuth, Vercel).                         |
| [`docs/data-models.html`](docs/data-models.html)          | The full data-model design + §15 v1 build-scope decisions.                |
| [`docs/art-style-bible.md`](docs/art-style-bible.md)      | Grimdark art direction, palette, and the AI asset-generation pipeline.    |

UI mockups for every screen live under `src/mockups/` and are browsable at
`/mockups` while the dev server is running.

## Environment variables

| Variable                 | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase Project URL (Settings → API)               |
| `VITE_SUPABASE_ANON_KEY` | Supabase `anon` / public key (safe for the browser) |

See `.env.example`. Never put the `service_role` key in this app.

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start the Vite dev server         |
| `npm run build`   | Type-check and build for prod     |
| `npm run preview` | Preview the production build      |
| `npm run lint`    | Run ESLint                        |

## Project structure

```
src/
  components/ui/   shadcn/ui components
  lib/
    supabase.ts    Supabase browser client
    utils.ts       cn() helper
  App.tsx          Landing page
  mockups/         Coded UI mockups (browse at /mockups)
supabase/
  migrations/      Postgres schema (tables, enums, RLS, views)
  seed.sql         Lookup taxonomy + starter exercise catalog
.github/workflows/
  supabase-keepalive.yml   Prevents free-tier auto-pause
vercel.json        SPA rewrite for client-side routing
docs/              Setup guide, data-model design, art style bible
```
