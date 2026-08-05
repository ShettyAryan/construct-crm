# Construct CRM

Personal local-first sales CRM for **ConstructDev** and **ConstructXR**.

Not a SaaS. No auth. No multi-user. Built for one founder to track leads, follow-ups, calls, meetings, and clients.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + SQLite
- React Hook Form + Zod
- @dnd-kit (pipeline Kanban)
- next-themes (dark mode)

## Setup

```bash
cd construct-crm
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:seed` | Reseed dummy data |
| `npm run db:reset` | Reset DB + migrate + seed |
| `npm run build` | Production build |

## Features

- **Dashboard** — leads, hot leads, deals won, pipeline revenue, follow-ups due, activity
- **Leads** — searchable table, detail page, create/edit
- **Pipeline** — drag-and-drop Kanban (Won auto-creates Client)
- **Calls / Meetings / Follow-ups / Tasks / Clients**

## Notes

- Database file: `prisma/dev.db`
- Budget amounts are stored as INR whole numbers
- Auth can be added later by scoping server actions in `src/lib/actions/*`
