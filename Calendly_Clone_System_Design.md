# Calendly Clone — System Design Document

> Reference design for the **Scaler SDE Intern Fullstack Assignment**.
> This document describes the architecture, data model, APIs, and core algorithms.
> Students must implement the code themselves based on this design.

---

## 1. High-Level Architecture

```
                ┌────────────────────────────────────────────┐
                │                  USERS                     │
                │  Admin (owner)        Invitee (public)     │
                └─────────────┬──────────────────┬───────────┘
                              │                  │
                              ▼                  ▼
                ┌────────────────────────────────────────────┐
                │              FRONTEND (SPA)                │
                │       React.js / Next.js + Tailwind        │
                │                                            │
                │   Admin Pages          Public Pages        │
                │   - Event Types        - /:slug (booking)  │
                │   - Availability       - /confirmed/:id    │
                │   - Meetings                               │
                └─────────────┬──────────────────────────────┘
                              │  REST / JSON (Axios / fetch)
                              ▼
                ┌────────────────────────────────────────────┐
                │            BACKEND API SERVER              │
                │   Node + Express   OR   Python + FastAPI   │
                │                                            │
                │   Controllers → Services → Repositories    │
                │   - Validation (Zod / Pydantic)            │
                │   - Timezone handling (luxon / pytz)       │
                │   - Slot generation engine                 │
                │   - Concurrency-safe booking               │
                └─────────────┬──────────────────────────────┘
                              │  SQL
                              ▼
                ┌────────────────────────────────────────────┐
                │            POSTGRESQL / MYSQL              │
                │  users, event_types, availability_rules,   │
                │  date_overrides, meetings                  │
                └────────────────────────────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────────────┐
                │     (Optional) Email Service (Nodemailer)  │
                └────────────────────────────────────────────┘
```

**Style:** 3-tier monolith. Single backend service, single DB. No auth (assignment says assume default user).

---

## 2. Tech Stack (Recommended)

| Layer        | Choice                                                  |
|--------------|---------------------------------------------------------|
| Frontend     | **Next.js 14 (App Router)** + TypeScript + TailwindCSS  |
| UI Library   | shadcn/ui (matches Calendly's clean look)               |
| Date/Time    | `luxon` or `date-fns-tz` (timezone-safe)                |
| Backend      | **Node + Express + TypeScript**  OR  FastAPI (Python)   |
| ORM          | Prisma (Node)  OR  SQLAlchemy (Python)                  |
| Database     | PostgreSQL 15                                           |
| Validation   | Zod (Node)  OR  Pydantic (Python)                       |
| Deployment   | Frontend → Vercel · Backend → Render · DB → Neon/Supabase |

---

## 3. Database Schema

### 3.1 ER Diagram

```
┌─────────────┐ 1   *  ┌──────────────┐ 1   *  ┌──────────────┐
│   users     │────────│ event_types  │────────│   meetings   │
└─────────────┘        └──────┬───────┘        └──────────────┘
                              │ 1
                              │
                              │ *
                       ┌──────▼────────────┐
                       │ availability_rules│  (one row per weekday)
                       └───────────────────┘
                              │ 1
                              │ *
                       ┌──────▼──────────┐
                       │ date_overrides  │  (optional, bonus)
                       └─────────────────┘
```

### 3.2 Tables (PostgreSQL DDL)

```sql
-- 1. Users (single default user for this assignment)
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(180) UNIQUE NOT NULL,
    timezone      VARCHAR(64)  NOT NULL DEFAULT 'Asia/Kolkata',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Event Types
CREATE TABLE event_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,           -- "30 min meeting"
    slug            VARCHAR(80)  NOT NULL,           -- "30min"
    duration_min    INT          NOT NULL CHECK (duration_min > 0),
    description     TEXT,
    buffer_before   INT          NOT NULL DEFAULT 0, -- bonus
    buffer_after    INT          NOT NULL DEFAULT 0, -- bonus
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, slug)
);

-- 3. Availability rules (recurring weekly schedule)
-- day_of_week: 0 = Sunday, 6 = Saturday
CREATE TABLE availability_rules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time   TIME     NOT NULL,    -- e.g. '09:00'
    end_time     TIME     NOT NULL,    -- e.g. '17:00'
    CHECK (start_time < end_time)
);
CREATE INDEX idx_avail_user_day ON availability_rules(user_id, day_of_week);

-- 4. Date-specific overrides (BONUS — overrides weekly rule for a single date)
CREATE TABLE date_overrides (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    start_time   TIME,    -- NULL means "unavailable that whole day"
    end_time     TIME,
    UNIQUE (user_id, date)
);

-- 5. Meetings (bookings)
CREATE TABLE meetings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id   UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    invitee_name    VARCHAR(120) NOT NULL,
    invitee_email   VARCHAR(180) NOT NULL,
    start_at        TIMESTAMPTZ  NOT NULL,    -- always store UTC
    end_at          TIMESTAMPTZ  NOT NULL,
    notes           TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'confirmed',
                    -- 'confirmed' | 'cancelled'
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (start_at < end_at)
);

-- CRITICAL: prevent double-booking the same event_type at the same start_at
-- (only for active bookings)
CREATE UNIQUE INDEX uniq_active_booking
    ON meetings (event_type_id, start_at)
    WHERE status = 'confirmed';

CREATE INDEX idx_meetings_range ON meetings (event_type_id, start_at, end_at);
```

---

## 4. REST API Specification

Base URL: `/api`

### 4.1 Admin — Event Types

| Method | Path                       | Purpose                       |
|--------|----------------------------|-------------------------------|
| GET    | `/event-types`             | List all event types          |
| POST   | `/event-types`             | Create new event type         |
| GET    | `/event-types/:id`         | Get one event type            |
| PATCH  | `/event-types/:id`         | Update event type             |
| DELETE | `/event-types/:id`         | Delete event type             |

**POST body example:**
```json
{ "name": "30 Minute Meeting", "slug": "30min", "duration_min": 30,
  "description": "Quick sync" }
```

### 4.2 Admin — Availability

| Method | Path                | Purpose                              |
|--------|---------------------|--------------------------------------|
| GET    | `/availability`     | Get current weekly schedule + tz     |
| PUT    | `/availability`     | Replace entire weekly schedule       |

**PUT body example:**
```json
{
  "timezone": "Asia/Kolkata",
  "rules": [
    { "day_of_week": 1, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 2, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 3, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 4, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 5, "start_time": "09:00", "end_time": "13:00" }
  ]
}
```

### 4.3 Public — Booking

| Method | Path                                          | Purpose                         |
|--------|-----------------------------------------------|---------------------------------|
| GET    | `/public/:slug`                               | Get event type public info      |
| GET    | `/public/:slug/slots?date=YYYY-MM-DD&tz=...`  | Available slots for a date      |
| GET    | `/public/:slug/month?year=2026&month=5&tz=..` | Which dates have any slots      |
| POST   | `/public/:slug/book`                          | Create a booking                |

**Slots response:**
```json
{ "date": "2026-05-22", "timezone": "Asia/Kolkata",
  "slots": ["09:00", "09:30", "10:00", "10:30", "11:30"] }
```

**Booking POST body:**
```json
{ "start_at": "2026-05-22T09:00:00+05:30",
  "invitee_name": "Asha", "invitee_email": "asha@x.com", "notes": "" }
```

**Booking response (201):**
```json
{ "id": "uuid", "start_at": "...", "end_at": "...",
  "event_type": { "name": "30 Minute Meeting", "duration_min": 30 } }
```

### 4.4 Admin — Meetings

| Method | Path                              | Purpose                       |
|--------|-----------------------------------|-------------------------------|
| GET    | `/meetings?filter=upcoming\|past` | List meetings                 |
| POST   | `/meetings/:id/cancel`            | Cancel a meeting              |

---

## 5. Core Algorithm: Slot Generation

This is the heart of the system. Given a date + event type, return bookable slots.

```
INPUT:  event_type_id, date (YYYY-MM-DD), tz_of_viewer
OUTPUT: list of start times (in viewer's tz)

1. Load event_type → duration, buffer_before, buffer_after, user_id
2. Determine the weekly rule for that date's weekday in user's tz
   - If date_override exists for that date, use it instead
   - If no rule and no override → return []
3. Build a working window [day_start, day_end] in the OWNER's timezone,
   then convert to UTC.
4. Slice the window into candidate slots of length `duration_min`,
   stepping by `duration_min` (or 15-min granularity if you prefer).
       slot_start = window_start, window_start + step, ...
       slot_end   = slot_start + duration_min
       discard if slot_end > window_end
5. Fetch all CONFIRMED meetings for this event_type whose
   [start_at, end_at] overlap the day's UTC range.
6. For each candidate slot, mark BUSY if it overlaps any meeting
   expanded by [buffer_before, buffer_after].
       overlap test: slot_start < meeting_end AND slot_end > meeting_start
7. Filter out slots whose slot_start is in the past (now()).
8. Convert remaining slot_starts back to the viewer's tz and return.
```

**Why timezones matter:** the owner sets availability in *their* tz, the invitee views in *their* tz. **Always store UTC in DB**, convert only at the edges.

---

## 6. Concurrency: Preventing Double Booking

Two invitees can hit `POST /book` at the same millisecond. You must prevent both from succeeding.

**Two-layer defense:**

1. **DB constraint (last line of defense):**
   The partial unique index `uniq_active_booking (event_type_id, start_at) WHERE status='confirmed'` guarantees only ONE confirmed row per slot. The loser gets a unique-violation error → return HTTP 409 *"Slot just got taken"*.

2. **Application check inside a transaction:**
   ```sql
   BEGIN;
     -- Re-run availability + overlap check
     -- If OK, INSERT the meeting row
   COMMIT;
   ```
   Wrap the insert in a transaction. The unique index catches the race the app misses.

---

## 7. Frontend Page Structure

```
/                            → Admin dashboard (redirect to /event-types)
/event-types                 → List + Create/Edit/Delete event types
/availability                → Weekly grid editor + timezone picker
/meetings?tab=upcoming|past  → Meetings list, with Cancel button
/:slug                       → PUBLIC booking page (calendar + slots + form)
/:slug/confirmed/:meetingId  → Confirmation page
```

**Component hierarchy (booking page):**
```
<BookingPage slug=...>
  ├── <EventHeader/>              name, duration, host
  ├── <MonthCalendar/>            shows which dates have slots
  ├── <TimeSlotList date=...>     fetches /slots when date selected
  └── <BookingForm slot=...>      shown after slot click
        └── <ConfirmationCard/>   shown after submit
```

---

## 8. User Flows (Sequence)

### 8.1 Booking flow

```
Invitee → Frontend         Backend                  DB
  │                            │                     │
  ├── GET /public/:slug ──────►│ load event_type ───►│
  │                            │◄────────────────────│
  │◄── event metadata ─────────│                     │
  │                            │                     │
  ├── GET /month?...  ────────►│ for each date in   │
  │                            │ month: run slot     │
  │                            │ algo, return dates  │
  │                            │ that have ≥1 slot   │
  │◄── ['2026-05-22', ...] ────│                     │
  │                            │                     │
  ├── GET /slots?date=... ────►│ slot algorithm ────►│
  │                            │◄────────────────────│
  │◄── ['09:00','09:30',...] ──│                     │
  │                            │                     │
  ├── POST /book ─────────────►│ BEGIN TX            │
  │                            │ re-check slot free  │
  │                            │ INSERT meeting     ─►│
  │                            │ COMMIT              │
  │◄── 201 + meeting ──────────│                     │
  │   (redirect to /confirmed) │                     │
```

### 8.2 Cancellation

```
Admin → POST /meetings/:id/cancel
        UPDATE meetings SET status='cancelled', cancelled_at=NOW()
        (slot becomes bookable again — the unique partial index allows it)
```

---

## 9. Backend Folder Structure (Node + Express)

```
backend/
├── src/
│   ├── index.ts                # app bootstrap
│   ├── routes/
│   │   ├── eventTypes.routes.ts
│   │   ├── availability.routes.ts
│   │   ├── meetings.routes.ts
│   │   └── public.routes.ts
│   ├── controllers/            # thin — parse req, call service
│   ├── services/               # business logic
│   │   ├── slotEngine.ts       # ★ the slot algorithm lives here
│   │   └── bookingService.ts   # transactional booking
│   ├── repositories/           # DB access via Prisma
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── time.ts             # luxon helpers
│   ├── validators/             # zod schemas
│   └── middlewares/
│       └── errorHandler.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 # sample event types + meetings
└── package.json
```

**Separation of concerns:** routes → controllers → services → repositories.
Controllers never touch the DB directly. Services contain the rules.

---

## 10. Frontend Folder Structure (Next.js App Router)

```
frontend/
├── app/
│   ├── (admin)/
│   │   ├── event-types/page.tsx
│   │   ├── availability/page.tsx
│   │   └── meetings/page.tsx
│   ├── [slug]/
│   │   ├── page.tsx                  # public booking
│   │   └── confirmed/[id]/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn primitives
│   ├── MonthCalendar.tsx
│   ├── TimeSlotList.tsx
│   ├── BookingForm.tsx
│   ├── EventTypeCard.tsx
│   └── AvailabilityGrid.tsx
├── lib/
│   ├── api.ts               # axios client
│   └── time.ts              # tz helpers
└── package.json
```

---

## 11. Validation Rules (must enforce)

| Field             | Rule                                                       |
|-------------------|------------------------------------------------------------|
| event_type.slug   | lowercase, kebab-case, 1–80 chars, unique per user         |
| duration_min      | one of {15, 30, 45, 60, 90, 120} (or any positive int)     |
| availability      | start_time < end_time; no overlapping rules for same day   |
| booking.start_at  | must be a real available slot (re-run slot algo server-side, NEVER trust client) |
| booking.email     | RFC-valid email                                            |
| timezone          | must be a valid IANA name                                  |

**Critical:** the server MUST re-verify the slot is valid + free before insert. Do not trust the client's "this slot is available" claim.

---

## 12. Edge Cases to Handle

- ✅ Booking a slot that just got taken → return 409
- ✅ Booking in the past → reject
- ✅ Timezone mismatch (owner IST, invitee PST) — slots must render correctly
- ✅ DST transitions — luxon handles this; don't do manual `+offset` math
- ✅ Cancelled meetings free up the slot
- ✅ Deleting an event type cascades meetings (or block delete if upcoming meetings exist — your call, document in README)
- ✅ Slot at the very end of the day: `slot_end ≤ window_end`
- ✅ Buffer time pushes available slots forward correctly (bonus)

---

## 13. Sample Seed Data

```ts
// prisma/seed.ts
await prisma.user.create({
  data: {
    name: "Demo User", email: "demo@calendly-clone.com",
    timezone: "Asia/Kolkata",
    eventTypes: { create: [
      { name: "15 Minute Meeting", slug: "15min", duration_min: 15 },
      { name: "30 Minute Meeting", slug: "30min", duration_min: 30 },
      { name: "60 Minute Meeting", slug: "60min", duration_min: 60 },
    ]},
    availabilityRules: { create: [1,2,3,4,5].map(d => ({
      day_of_week: d, start_time: "09:00", end_time: "17:00",
    }))},
  },
});
// + insert 2-3 sample meetings on upcoming dates
```

---

## 14. Deployment

| Component  | Service           | Notes                                  |
|------------|-------------------|----------------------------------------|
| Frontend   | Vercel            | `next build`, set `NEXT_PUBLIC_API_URL`|
| Backend    | Render / Railway  | Web service, exposes `:PORT`           |
| Database   | Neon / Supabase   | Free Postgres, copy `DATABASE_URL`     |

**Env vars:**
```
DATABASE_URL=postgres://...
PORT=4000
FRONTEND_ORIGIN=https://your-app.vercel.app   # for CORS
DEFAULT_USER_EMAIL=demo@calendly-clone.com    # seeded user
```

**CORS:** allow only the frontend origin in production.

---

## 15. README Checklist (for the student)

The student's README must include:

1. Tech stack used
2. Local setup: `git clone` → `.env` → `npm install` → `prisma migrate dev` → `prisma db seed` → `npm run dev`
3. How to run frontend + backend together
4. The deployed URLs (frontend + backend)
5. **Assumptions made** (e.g. "no auth, single seeded user", "15-min slot granularity")
6. **Database schema diagram** (image or ASCII)
7. **API documentation** (Postman collection or table of endpoints)
8. Screenshots of admin pages + booking flow

---

## 16. Evaluation Mapping

| Criterion             | Where it's demonstrated in this design               |
|-----------------------|------------------------------------------------------|
| Functionality         | All 4 core features covered in sections 4 & 7        |
| UI/UX                 | Page structure section 7, Calendly look via shadcn   |
| Database Design       | Section 3 — normalized schema, constraints, indexes  |
| Code Quality          | Validation (§11), error handling, typed end-to-end   |
| Code Modularity       | Folder structure §9, §10 — routes/services/repos     |
| Code Understanding    | Student must be able to explain §5 (slot algo) and §6 (concurrency) |

---

## 17. Suggested 2-Day Build Plan

**Day 1 (≈8h):**
- [ ] Setup: repos, DB, Prisma schema, seed (1h)
- [ ] Backend: event-types CRUD + availability endpoints (2h)
- [ ] Backend: slot generation algorithm + tests (2h)
- [ ] Backend: booking endpoint with transaction + 409 handling (1h)
- [ ] Frontend: admin pages — event types + availability (2h)

**Day 2 (≈8h):**
- [ ] Frontend: public booking page (calendar + slots + form) (3h)
- [ ] Frontend: confirmation page + meetings page (2h)
- [ ] Polish UI to match Calendly look (1.5h)
- [ ] Deploy + write README (1.5h)

---

**End of design document.** Build to spec, then iterate on polish.
