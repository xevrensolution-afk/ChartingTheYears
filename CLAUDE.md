# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Charting the Years** — an interactive atlas of historical literature. Users explore books through a world map, filtering by era, country, and category. Admins manage the catalog via a separate dashboard.

## Commands

```bash
npm run dev       # start Next.js dev server
npm run build     # production build (TypeScript errors are ignored — see next.config.mjs)
npm run lint      # ESLint
npm run seed      # seed the database: npx ts-node scripts/seed-db.ts
```

Seed scripts: `scripts/seed-db.ts`, `scripts/seed-admin.ts`, `scripts/analyze-xml.ts`

## Environment Variables

Required in `.env.local`:
```
MONGODB_URI=...
MONGODB_DB=chartingtheyears   # default if not set
JWT_SECRET=...
```

## Architecture

### Route structure

| Path | Purpose |
|------|---------|
| `/user` | Public-facing atlas (map + books) |
| `/admin/*` | Admin dashboard — protected by middleware |
| `/auth/signin`, `/auth/signup` | Auth pages |
| `/api/*` | Next.js Route Handlers (Node.js runtime) |

Middleware at [src/middleware.ts](src/middleware.ts) runs on Edge and enforces:
- `/admin/*` — requires valid JWT cookie with `role === 'ADMIN'`
- `/auth/*` — redirects already-authenticated users to their area

### Auth dual-runtime pattern

JWT verification exists in two forms because Next.js middleware runs on the Edge runtime:
- `verifyJwtEdge()` in [src/lib/auth.ts](src/lib/auth.ts) — uses `jose`, called from middleware
- `verifyJwt()` — uses `jsonwebtoken`, called from API route handlers

The JWT is stored as a cookie named `token` (7-day expiry). The Axios client at [src/lib/apiClient.ts](src/lib/apiClient.ts) attaches it as `Authorization: Bearer <token>` via a request interceptor set up in `AuthContext`.

### Data layer

Mongoose models in `src/models/`: `Book`, `User`, `Category`, `Tag`, `Review`, `ReadingList`, `Settings`.

`connectDB()` in [src/lib/db.ts](src/lib/db.ts) caches the connection on `global` to survive Next.js hot reloads.

Zod schemas for all domain types live in [src/lib/schemas.ts](src/lib/schemas.ts) — use these as the authoritative type definitions; the Mongoose schemas are the DB layer.

### Component layers

There are **two** component directories — don't confuse them:
- `components/ui/` — shadcn/radix scaffolded components (root level, largely unused in app code)
- `src/components/ui/kit/` — the actual design system used throughout the app (`Card`, `Button`, `Badge`, `Input`, `Select`, `Modal`, `Stars`, `Icon`, `Toast`, etc.)
- `src/components/features/` — domain components (`BookCard`, `BookForm`, `HistoricalMap`, `BookPopupModal`, `CategoryForm`, `TagForm`, `RichTextEditor`, `ImageUploader`)
- `src/components/layout/` — shell components (`Sidebar`, `Topbar`, `UserSidebar`, `PageLayout`, etc.)

### State / Context

| Context | File | Purpose |
|---------|------|---------|
| `AuthContext` | [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) | User identity, login/logout, Axios interceptor setup |
| `SettingsContext` | [src/contexts/SettingsContext.tsx](src/contexts/SettingsContext.tsx) | Site-wide settings (defaultEra, booksPerPage, mapStyle, etc.) |
| `FilterContext` | [src/contexts/FilterContext.tsx](src/contexts/FilterContext.tsx) | Sidebar filter state (language, type, year range, rating, tags) |

### User-facing page flow

`/user` page ([src/app/user/page.tsx](src/app/user/page.tsx)):
1. Era switcher sets `activeEra` — null means idle (no books shown)
2. `HistoricalMap` highlights countries that have books in the current selection
3. Category filter buttons refine the book grid
4. Sidebar filters (`FilterContext`) for language, type, year range, rating, tags
5. Book grid uses infinite scroll via `IntersectionObserver`
6. Clicking a book card opens `BookPopupModal`
7. Reading list works for guests (localStorage) and logged-in users (DB) — `useReadingList` hook abstracts this

### Book import

`/admin/books/import` accepts WordPress WXR XML files, POSTs to `/api/books/import` with up to 3-minute timeout. The import route decodes base64 cover images embedded in the XML and stores them on the book document.

### Styling

Tailwind CSS v4 with custom design tokens. Key semantic color names used throughout: `ink`, `ink-mute`, `ink-soft`, `canvas`, `surface-2`, `surface-3`, `line`, `accent`, `accent-soft`, `coffee`, `danger`, `publish`, `draft`.
