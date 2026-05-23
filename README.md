# Calendly Clone 🗓️

A full-stack scheduling and availability management application built as a clone of Calendly. This project allows users to create event types, set their weekly availability (with date-specific overrides), and share a public booking page where invitees can schedule meetings that automatically sync across timezones.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Routing** | React Router v6 |
| **Date/Time** | Luxon (timezone-safe operations) |
| **HTTP Client** | Axios |
| **Backend** | Node.js + Express.js v5 |
| **ORM** | Prisma |
| **Database** | PostgreSQL (hosted on Neon) |
| **Validation** | Zod |
| **Email** | Nodemailer |
| **UI Components** | Radix UI primitives + shadcn/ui style |

---

## ✨ Features

### Core Functionality
- **Event Types Management** — Create, edit, and delete event types with custom URLs, durations, and descriptions.
- **Group Events & Capacity** — Allow multiple invitees to book the same time slot by defining a custom maximum capacity per event type.
- **Multiple Schedules** — Create distinct schedules (e.g., Working Hours, Overtime Hours) and assign them to specific event types independently.
- **Availability Rules** — Define your weekly recurring schedule (e.g., Mon–Fri 9:00 AM – 5:00 PM).
- **Public Booking Page** — A timezone-aware public page where invitees can see available slots and book meetings.
- **Meeting Dashboard** — View upcoming and past meetings beautifully grouped by time slot.
- **Concurrency Safety** — Transactional booking and constraints prevent over-booking a time slot beyond its capacity.

### Bonus Features
- **Buffer Times** — Automatically add padding before and after meetings.
- **Custom Invitee Questions** — Define dynamic required/optional questions that invitees answer during booking.
- **Rescheduling Flow** — Move an existing meeting to a new open time slot.
- **Date-Specific Overrides** — Override your standard weekly schedule for specific dates (e.g., a half-day off).
- **Email Notifications** — Automated emails sent to invitees upon booking, rescheduling, and cancellation (via SMTP).

---

## 🗄️ Database Schema

### Tables

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `name` | VARCHAR(120) | |
| `email` | VARCHAR(180) UNIQUE | |
| `timezone` | VARCHAR(64) | Default: `Asia/Kolkata` |
| `created_at` | TIMESTAMPTZ | |

#### `schedules`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | CASCADE delete |
| `name` | VARCHAR(120) | e.g. "Working Hours" |
| `timezone` | VARCHAR(64) | IANA timezone |
| `is_default` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `event_types`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | CASCADE delete |
| `schedule_id` | UUID FK → schedules | RESTRICT delete |
| `name` | VARCHAR(120) | e.g. "30 Minute Meeting" |
| `slug` | VARCHAR(80) | e.g. "30min", unique per user |
| `duration_min` | INT | Must be > 0 |
| `description` | TEXT | Optional |
| `buffer_before` | INT | Minutes, default 0 |
| `buffer_after` | INT | Minutes, default 0 |
| `is_active` | BOOLEAN | Default true |
| `custom_questions` | JSON | Array of question objects |
| `created_at` | TIMESTAMPTZ | |

#### `availability_rules`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `schedule_id` | UUID FK → schedules | CASCADE delete |
| `day_of_week` | SMALLINT | 0 = Sunday … 6 = Saturday |
| `start_time` | VARCHAR(5) | `HH:mm` format |
| `end_time` | VARCHAR(5) | `HH:mm` format |

#### `date_overrides`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `schedule_id` | UUID FK → schedules | CASCADE delete |
| `date` | DATE | |
| `start_time` | VARCHAR(5) | NULL = entire day blocked |
| `end_time` | VARCHAR(5) | |

> **Unique constraint:** `(schedule_id, date)`

#### `meetings`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `event_type_id` | UUID FK → event_types | CASCADE delete |
| `invitee_name` | VARCHAR(120) | |
| `invitee_email` | VARCHAR(180) | |
| `start_at` | TIMESTAMPTZ | **Always stored in UTC** |
| `end_at` | TIMESTAMPTZ | **Always stored in UTC** |
| `notes` | TEXT | Optional |
| `answers` | JSON | Custom question answers |
| `status` | VARCHAR(20) | `scheduled` \| `cancelled` |
| `cancelled_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

> **Key index:** `idx_meetings_range ON meetings(event_type_id, start_at, end_at)`

---

## ⚙️ Core Algorithm: Slot Generation

The slot engine (`backend/src/services/slotEngine.js`) is the heart of the system.

```
INPUT:  eventType, dateRange [startDt, endDt], hostTimezone
OUTPUT: list of { start, end } ISO datetime slots (UTC)

For each day in range:
  1. Check date_overrides — if blocked, skip day entirely
     If custom hours set, use those instead of weekly rule
  2. Look up availability_rule for that weekday
     No rule → skip day
  3. Build window [dayStart, dayEnd] in host timezone → convert to UTC
  4. Walk window in 15-min increments:
       slotStart = windowStart, +15min, +15min, ...
       slotEnd   = slotStart + durationMin
       Discard if slotEnd > windowEnd
  5. Fetch confirmed meetings overlapping the day
  6. For each candidate: mark BUSY if overlaps any meeting
       (expanded by bufferBefore / bufferAfter)
       overlap test: slotStart < meetingEnd AND slotEnd > meetingStart
  7. Filter out past slots (slotStart <= now)
  8. Return remaining slots
```

**Timezone principle:** Owner sets availability in *their* timezone; invitee views in *their* timezone. **UTC is always stored in DB**, conversions happen only at the edges via Luxon.

---

## 🔒 Concurrency: Preventing Double-Booking

Two simultaneous booking requests are handled by a **two-layer defense**:

1. **Application check inside a transaction**
   - Re-run conflict check before inserting
   - `findConflicting()` queries for any `scheduled` meeting overlapping the requested slot

2. **DB constraint (last line of defense)**
   - Index `idx_meetings_range ON meetings(event_type_id, start_at, end_at)` ensures fast overlap queries
   - Unique violation on concurrent inserts → returns **HTTP 409** *"Slot just got taken"*

---

## 📁 Project Structure

```
calendly-clone/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # DB models & relations
│   │   ├── seed.js                # Demo user + event types + rules
│   │   └── migrations/            # SQL migration files
│   └── src/
│       ├── index.js               # Express app bootstrap
│       ├── routes/
│       │   ├── eventTypes.routes.js
│       │   ├── availability.routes.js
│       │   ├── meetings.routes.js
│       │   └── public.routes.js
│       ├── controllers/           # Thin — parse req, call service
│       │   ├── eventTypes.controller.js
│       │   ├── availability.controller.js
│       │   ├── meetings.controller.js
│       │   └── public.controller.js
│       ├── services/              # Business logic
│       │   ├── slotEngine.js      # ★ Slot generation algorithm
│       │   ├── bookingService.js  # Transactional booking + reschedule
│       │   ├── availabilityService.js
│       │   ├── eventTypeService.js
│       │   └── emailService.js
│       ├── repositories/          # DB access via Prisma
│       │   ├── eventTypeRepo.js
│       │   ├── availabilityRepo.js
│       │   ├── meetingRepo.js
│       │   └── scheduleRepo.js
│       ├── validators/            # Zod schemas
│       │   ├── eventType.validator.js
│       │   ├── availability.validator.js
│       │   └── booking.validator.js
│       ├── lib/
│       │   ├── prisma.js          # Prisma singleton
│       │   └── time.js            # Luxon helpers
│       └── middlewares/
│           └── errorHandler.js
│
└── frontend/
    └── src/
        ├── App.jsx                # Routes definition
        ├── main.jsx
        ├── index.css              # Tailwind + CSS variables
        ├── layouts/
        │   └── AdminLayout.jsx    # Sidebar + header shell
        ├── pages/
        │   ├── admin/
        │   │   ├── EventTypesPage.jsx
        │   │   ├── AvailabilityPage.jsx
        │   │   └── MeetingsPage.jsx
        │   └── public/
        │       ├── PublicLayout.jsx
        │       ├── BookingPage.jsx
        │       └── ReschedulePage.jsx
        ├── components/
        │   ├── ui/                # shadcn-style primitives
        │   │   ├── button.jsx
        │   │   └── card.jsx
        │   └── EventTypeDialog.jsx
        └── lib/
            ├── api.js             # Axios client + API methods
            ├── time.js            # Timezone options + formatters
            └── utils.js           # cn() helper
```

---

## 🔌 API Documentation

Base URL: `http://localhost:4000/api`

### Admin — Event Types

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/event-types` | List all event types |
| `POST` | `/event-types` | Create a new event type |
| `PUT` | `/event-types/:id` | Update an event type |
| `DELETE` | `/event-types/:id` | Delete an event type |

**POST / PUT body:**
```json
{
  "name": "30 Minute Meeting",
  "slug": "30min",
  "duration_min": 30,
  "description": "Quick sync",
  "buffer_before": 5,
  "buffer_after": 5,
  "schedule_id": "<uuid>",
  "custom_questions": []
}
```

### Admin — Availability / Schedules

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/availability` | List all schedules |
| `POST` | `/availability` | Create a new schedule |
| `PUT` | `/availability/:id` | Update schedule name, timezone & rules |
| `DELETE` | `/availability/:id` | Delete a schedule |
| `GET` | `/availability/:id/overrides` | Get date overrides for a schedule |
| `POST` | `/availability/:id/overrides` | Add/update a date override |
| `DELETE` | `/availability/:id/overrides/:overrideId` | Remove a date override |

**PUT body example:**
```json
{
  "name": "Working Hours",
  "timezone": "Asia/Kolkata",
  "rules": [
    { "day_of_week": 1, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 2, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 5, "start_time": "09:00", "end_time": "13:00" }
  ]
}
```

### Admin — Meetings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meetings?status=upcoming\|past` | List meetings |
| `GET` | `/meetings/:id` | Get a specific meeting |
| `POST` | `/meetings/:id/cancel` | Cancel a meeting |
| `PATCH` | `/meetings/:id/reschedule` | Reschedule a meeting |

### Public — Booking Flow

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/public/:slug` | Get public details for an event type |
| `GET` | `/public/:slug/slots?start=YYYY-MM-DD&end=YYYY-MM-DD` | Get available slots |
| `POST` | `/public/:slug/book` | Confirm a booking |

**Slots response:**
```json
[
  { "start": "2026-05-22T03:30:00.000Z", "end": "2026-05-22T04:00:00.000Z" },
  { "start": "2026-05-22T04:00:00.000Z", "end": "2026-05-22T04:30:00.000Z" }
]
```

**Booking POST body:**
```json
{
  "startAt": "2026-05-22T03:30:00.000Z",
  "inviteeName": "Asha",
  "inviteeEmail": "asha@example.com",
  "inviteeTimezone": "Asia/Kolkata",
  "notes": "Looking forward to it!",
  "answers": {}
}
```

---

## 🖥️ Frontend Page Structure

```
/                         → Redirect to /event-types
/event-types              → List + Create/Edit/Delete event types
/availability             → Weekly schedule editor + date overrides
/meetings                 → Upcoming & past meetings, cancel button
/:slug                    → PUBLIC booking page (calendar + slots + form)
/reschedule/:meetingId    → Reschedule an existing booking
```

## 🛠️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm
- PostgreSQL database (local or cloud — Neon / Supabase)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd calendly-clone
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Server
PORT=4000

# CORS
FRONTEND_ORIGIN="http://localhost:3000"

# Seed user
DEFAULT_USER_EMAIL="demo@calendly-clone.com"

# Email (optional — mock mode used if omitted)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

Initialize the database and start the backend:
```bash
npx prisma migrate dev
npm run seed
npm run dev
```
> Backend runs on `http://localhost:4000`

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL="http://localhost:4000/api"
```

```bash
npm run dev
```
> Frontend runs on `http://localhost:3000`

---

## 🚀 Deployment

| Component | Service | Notes |
|-----------|---------|-------|
| Frontend | Vercel | `npm run build`, set `VITE_API_URL` |
| Backend | Render / Railway | Web service, set env vars |
| Database | Neon / Supabase | Free Postgres, copy `DATABASE_URL` |

**Production CORS:** Set `FRONTEND_ORIGIN` to your Vercel deployment URL.

---

## 📸 Screenshots

### Booking Confirmed
![Booking Confirmed](./screenshots/Screenshot%20(645).png)

### Event Types Dashboard
![Event Types](./screenshots/Screenshot%20(646).png)

### Meetings Dashboard
![Meetings Dashboard](./screenshots/Screenshot%20(647).png)

### Availability Editor
![Availability Dashboard](./screenshots/Screenshot%20(648).png)

### Adding an Event Type (Custom Schedule)
![Add Event Type](./screenshots/Screenshot%20(649).png)

### Booking Page (Calendar View)
![Booking Page](./screenshots/Screenshot%20(650).png)
