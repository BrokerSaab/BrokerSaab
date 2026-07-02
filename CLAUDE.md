# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (run both apps)
```bash
npm run dev          # Start backend + frontend concurrently
npm run install:all  # Install all workspace dependencies
```

### Backend (`apps/backend`)
```bash
npm run backend:dev    # ts-node with nodemon (watches src/)
npm run backend:build  # tsc → dist/
npm run backend:start  # node dist/app.js

# Database
npm run db:migrate    # prisma migrate dev
npm run db:generate   # prisma generate (after schema changes)
npm run db:seed       # ts-node prisma/seed.ts
```

### Frontend (`apps/frontend`)
```bash
npm run frontend:dev    # next dev --turbo
npm run frontend:build  # next build
npm run frontend:lint   # next lint
```

No test framework is configured.

## Architecture

**NPM workspaces monorepo** — three apps: `apps/backend` (Express), `apps/frontend` (Next.js 15 App Router), `apps/mobile` (Expo, mostly placeholder). Shared TypeScript types live in `packages/shared-types`.

### Frontend → Backend connection

In production, Next.js rewrites `/api/v1/*` → `BACKEND_URL/api/v1/*` and `/uploads/*` → `BACKEND_URL/uploads/*` (configured in `next.config.mjs`). This means the frontend always calls `/api/v1/...` — never the backend URL directly. `NEXT_PUBLIC_API_URL` is always `/api/v1`. The only place the raw backend URL is used client-side is for WebSocket (`NEXT_PUBLIC_WS_URL`) and for constructing file/avatar URLs.

`typescript ignoreBuildErrors: true` — the Next.js build will succeed even with TS errors. Don't rely on `npm run frontend:build` to catch type bugs.

### Backend structure

`apps/backend/src/app.ts` bootstraps Express, registers all routes under `/api/v1/`, attaches Socket.IO, and serves `uploads/` statically (with `Cross-Origin-Resource-Policy: cross-origin` for Vercel → Render cross-origin file access).

Routes are in `src/routes/` — one file per domain:
- `auth.ts` — OTP login (clients), email+password login (admins), JWT issue/refresh
- `advisors.ts` — public search/profile; advisor self-management
- `admin.ts` — dashboard KPIs, advisor approval queue, sub-admin assignment, bulk operations
- `subscriptions.ts` — advisor subscription lifecycle + Razorpay webhook
- `payments.ts` — Razorpay order creation / verification
- `contacts.ts` — contact-unlock credit pack purchase + webhook
- `bookings.ts`, `quotes.ts`, `tickets.ts`, `chat.ts`, `support.ts`, `users.ts`

Middleware chain: `helmet → cors → json → authenticateJWT (per-route) → requireRole (per-route) → validateRequest (Zod)`.

### Auth model

Stateless JWT. Two tokens: short-lived access token + refresh token. Middleware in `src/middlewares/auth.ts` exports `authenticateJWT` (verifies Bearer token, attaches `req.user`) and `requireRole(roles[])` (RBAC gate). Token payload: `{ id, phoneNumber, role }`.

Four roles: `SUPER_ADMIN`, `SUB_ADMIN`, `ADVISOR`, `CLIENT`. Admin users are a separate `AdminUser` model — not the same table as `Advisor` or `User`.

Clients register/login via phone OTP (Twilio Verify). Advisors use the same OTP flow. Admins use email + bcrypt password.

### Database (Prisma + PostgreSQL)

Schema at `apps/backend/prisma/schema.prisma` (~661 lines, 25+ models). Key relationships:

- `Advisor` ↔ `AdvisorDocument` (KYC files — `documentUrl` is either a Cloudinary HTTPS URL or a local `/uploads/kyc/…` path)
- `Advisor` ↔ `AdvisorSubscription` — trial/paid status. `calcValidUntil()` logic lives in `subscriptions.ts`. Trial = 6 months, paid = 2 years.
- `User` ↔ `Wallet` ↔ `ContactUnlock` — clients buy credit packs to unlock advisor contact info
- `ServiceTicket` — escrow work-order with staged workflow (`OPEN → IN_PROGRESS → AWAITING_CONFIRM → CLOSED → PAYOUT_RELEASED`)
- `AdminUser` ↔ `Advisor.assignedSubAdmin` — sub-admins own an advisor review queue; super admins manage sub-admins and make final approval calls
- `OnboardingSession` — tracks 8-step advisor onboarding funnel (used by admin funnel analytics)

`VerificationStatus` enum governs the advisor approval pipeline: `PENDING → UNDER_REVIEW → SUBMITTED_FOR_APPROVAL → APPROVED` (sub-admin submits; super admin approves).

### File storage

`src/middlewares/upload.ts` switches between Cloudinary (when `CLOUDINARY_*` env vars are present) and local disk (`uploads/kyc/`, `uploads/tickets/`). **Production on Render must have Cloudinary configured** — the local disk is ephemeral and wiped on every redeploy. `render.yaml` already declares the Cloudinary env var slots (`sync: false`); set the actual values in the Render dashboard.

### Real-time (Socket.IO)

Server bootstrapped in `app.ts`. Clients join rooms by `chatRoomId`. Advisors/users also join personal rooms by their ID for push-style notifications (booking updates, new messages, etc.).

### Payments (Razorpay)

Two distinct payment flows:
1. **Advisor subscription** (`/api/v1/subscriptions`) — advisor pays for platform access. Webhook at `/api/v1/subscriptions/webhook`.
2. **Contact unlock packs** (`/api/v1/contacts`) — clients buy credit packs to reveal advisor phone/email. Webhook at `/api/v1/contacts/webhook`.

Razorpay order is created server-side → frontend opens Razorpay checkout → on success, frontend calls a verify endpoint → backend validates signature → updates DB.

### Frontend state

`AuthContext` (`src/contexts/AuthContext.tsx`) — global auth state (user object, token getter, role, logout). Wrap with `ClientProviders` which also sets up TanStack Query and `LanguageContext` (English/Hindi toggle).

Token is stored in localStorage. `token()` is a function (not a value) — call it immediately before any fetch to always get the current value.

### Admin panel

Single large page at `src/app/admin/page.tsx`. Super admin and sub-admin both land here; the UI conditionally renders controls based on `isSuperAdmin` (derived from `auth.user.role`). Tabs: Dashboard, Advisors, Users, Funnel, Subscriptions, Tickets, Change Requests.

## Deployment

| Target | Service | Trigger |
|--------|---------|---------|
| Backend (prod) | Render (`brokersaab-backend`, srv-d8gjhjeq1p3s739lntr0) | push to `main`, auto-deploy via render.yaml |
| Frontend (prod) | Hostinger VPS, PM2 | push to `main` → GitHub Action SSH deploy |
| Frontend (staging) | Vercel | push to `develop` → GitHub Action vercel CLI |

Live URLs: `https://frontend-tellar.vercel.app` (staging) · `https://brokersaab-backend.onrender.com` (backend API).

Local dev with Docker: `docker compose up` brings up Postgres on `:5412`, Redis on `:6379`, backend on `:5000`, frontend on `:3000`.

## Design system

Colors: Navy (`#0F172A`/`#1E293B`) primary, Gold (`#F59E0B`) accent, Slate-950 body text. Tailwind custom tokens `gold-*` and `navy-*` are defined in the Tailwind config. Icons: Lucide React exclusively.
