# Construct CRM

Personal sales CRM for **ConstructDev** and **ConstructXR**.

Not a SaaS. No auth. No multi-user. Built for one founder to track leads, follow-ups, calls, meetings, and clients.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + SQLite (local file) / **Turso** (hosted SQLite for Vercel)
- React Hook Form + Zod
- @dnd-kit (pipeline Kanban)
- next-themes (dark mode)

## Local setup

```bash
cd construct-crm
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local data lives in `prisma/dev.db`.

## Multi-device / Vercel (hosted SQLite)

Vercel cannot keep a local SQLite file. This app uses **[Turso](https://turso.tech)** — hosted libSQL (SQLite-compatible) — so the same database is available from any device.

### 1. Create a Turso database

1. Sign up at [turso.tech](https://turso.tech) (free tier is enough)
2. Create a database
3. Copy the **URL** (`libsql://…`) and create an **auth token**

Or with the Turso CLI:

```bash
turso db create construct-crm
turso db show construct-crm --url
turso db tokens create construct-crm
```

### 2. Configure env locally (optional — to use Turso even in dev)

Copy `.env.example` → `.env` and set:

```env
DATABASE_URL="file:./dev.db"
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="…"
```

When `TURSO_DATABASE_URL` is set to a `libsql://` URL, the app uses Turso instead of the local file.

Push the schema once:

```bash
npm run db:push:turso
```

### 3. Deploy to Vercel

1. Import the `construct-crm` repo/folder into Vercel
2. Add environment variables:

| Name | Value |
|------|--------|
| `DATABASE_URL` | `file:./dev.db` (only needed for `prisma generate` at build) |
| `TURSO_DATABASE_URL` | your `libsql://…` URL |
| `TURSO_AUTH_TOKEN` | your Turso token |

3. Deploy

After that, phone, laptop, and tablet all share the same CRM data.

> **Note:** There is still no login. Anyone with the Vercel URL can open the CRM. Keep the URL private (or add auth later).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:seed` | Load sample dummy data |
| `npm run db:reset` | Reset local DB + migrate + seed |
| `npm run db:push:turso` | Apply migrations to Turso |
| `npm run build` | Production build |

## Features

- **Dashboard** — leads, hot leads, deals won, pipeline revenue, follow-ups due, activity
- **Leads** — searchable table, detail page, create/edit
- **Pipeline** — drag-and-drop Kanban (Won auto-creates Client)
- **Calls / Meetings / Follow-ups / Tasks / Clients**

## Notes

- Budget amounts are stored as INR whole numbers
- Auth can be added later by scoping server actions in `src/lib/actions/*`
