# Calendly Clone 🗓️

A full-stack scheduling and availability management application built as a clone of Calendly. This project allows users to create event types, set their weekly availability (with date-specific overrides), and share a public booking page where invitees can schedule meetings that automatically sync across timezones.

---

## 🚀 Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS (Styling)
- React Router (Routing)
- Luxon (Timezone and Date manipulation)
- Axios (API Client)

**Backend:**
- Node.js + Express.js
- Prisma (ORM)
- PostgreSQL (Database hosted on Neon)
- Zod (Request Validation)
- Nodemailer (Email Notifications)
- Luxon (Timezone-safe slot calculations)

---

## ✨ Features

### Core Functionality
- **Event Types Management:** Create, edit, and delete event types with custom URLs, durations, and descriptions.
- **Availability Rules:** Define your weekly recurring schedule (e.g., Mon-Fri 9:00 AM - 5:00 PM).
- **Public Booking Page:** A timezone-aware public page where invitees can see available slots and book meetings.
- **Meeting Dashboard:** View upcoming and past meetings, and cancel them.
- **Concurrency Safety:** Transactional booking and database-level constraints prevent double-booking the same time slot.

### Bonus Features Implemented
- **Buffer Times:** Automatically add padding before and after meetings so you aren't double-booked back-to-back.
- **Custom Invitee Questions:** Define dynamic required/optional questions (e.g., Phone Number, Notes) that invitees must answer during booking.
- **Rescheduling Flow:** Easily move an existing meeting to a new open time slot.
- **Date-Specific Overrides:** Override your standard weekly schedule for specific dates (e.g., taking a half-day off next Friday).
- **Email Notifications:** Automated emails sent to invitees upon booking, rescheduling, and cancellation (using SMTP).

---

## 🛠️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm
- PostgreSQL database (Local or Cloud like Neon/Supabase)

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

Create a `.env` file in the `backend` directory:
```env
# Database Connection
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Server Port
PORT=4000

# Frontend origin (for CORS)
FRONTEND_ORIGIN="http://localhost:3001"

# Default Seeded User
DEFAULT_USER_EMAIL="demo@calendly-clone.com"

# SMTP Configuration (For Email Notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

Initialize the database and start the backend:
```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```
*The backend will run on `http://localhost:4000`*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:4000/api"
```

Start the frontend development server:
```bash
npm run dev
```
*The frontend will run on `http://localhost:3001`*

---

## 🏗️ Assumptions Made

1. **Authentication:** As per assignment constraints, authentication is bypassed. The system assumes a single default "Owner" user seeded into the database (`demo@calendly-clone.com`).
2. **Timezones:** All dates and times are stored in the database in **UTC**. Conversions to the host's or invitee's local timezone are handled dynamically by `luxon` in the backend algorithm and frontend UI.
3. **Slot Granularity:** The slot generation algorithm steps forward by the exact `duration` of the event type.

---

## 🗄️ Database Schema Diagram

```text
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
                       │ date_overrides  │  (overrides weekly rule)
                       └─────────────────┘
```

---

## 🔌 API Documentation

Base URL: `http://localhost:4000/api`

### Admin (Event Types)
- `GET /event-types` - List all event types
- `POST /event-types` - Create a new event type
- `GET /event-types/:id` - Get details of an event type
- `PATCH /event-types/:id` - Update an event type
- `DELETE /event-types/:id` - Delete an event type

### Admin (Availability)
- `GET /availability` - Get the current weekly schedule
- `POST /availability` - Create a new schedule
- `PUT /availability/:id` - Update an existing schedule (rules & timezone)
- `GET /availability/:id/overrides` - Fetch date-specific overrides
- `POST /availability/:id/overrides` - Add/Update a date-specific override
- `DELETE /availability/:id/overrides/:overrideId` - Delete an override

### Admin (Meetings)
- `GET /meetings?status=upcoming|past` - Get meetings
- `GET /meetings/:id` - Get a specific meeting
- `POST /meetings/:id/cancel` - Cancel a meeting
- `PATCH /meetings/:id/reschedule` - Reschedule a meeting

### Public (Booking Flow)
- `GET /public/:slug` - Get public details for an event type
- `GET /public/:slug/slots?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get available time slots for a date range
- `POST /public/:slug/book` - Confirm a booking

---

## 📸 Screenshots

*(Replace these placeholders with actual screenshots before submitting!)*

- **Admin Dashboard:** `[Insert Screenshot]`
- **Availability Editor:** `[Insert Screenshot]`
- **Public Booking Page:** `[Insert Screenshot]`
- **Booking Confirmation:** `[Insert Screenshot]`
