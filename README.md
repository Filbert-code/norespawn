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
.github/workflows/
  supabase-keepalive.yml   Prevents free-tier auto-pause
vercel.json        SPA rewrite for client-side routing
docs/setup.html    Full setup guide
```
