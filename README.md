# MediCare Hub — AI Hospital Management

A minimal, production-quality demo of AI-assisted hospital management: patient registration, appointment scheduling, and AI triage/diagnostics.

> **⚠️ Prototype only. Synthetic/demo data. Not medical advice. No real PHI/PII.**

## Live Demo

> Deploy to Vercel: see instructions below.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables (dark theme) |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack React Query v5 |
| Fonts | DM Serif Display + DM Sans + DM Mono (Google Fonts) |
| Icons | Lucide React |
| Testing | Jest + Testing Library |

---

## Features

### 1. Patient Registration
- Form with full validation: name, DOB, sex, phone, email, address, allergies/conditions/medications
- Tag-based medical history input (add/remove chips)
- Duplicate detection by phone or email with a modal resolution UI
- Patient list with search

### 2. Appointment Scheduling
- Filter providers by specialty or name
- View available time slots (IST/UTC-aware)
- Book appointments with patient, provider, slot, reason, channel
- View all appointments with status badges
- Reschedule (pick new datetime) and cancel (with confirmation modal)

### 3. AI Triage & Diagnostics (Deterministic Mock)
- Symptom chips + free-text input
- Vitals: temperature, heart rate, blood pressure, SpO₂
- Onset, age, sex
- Optional file upload (JPEG/PNG/WebP/PDF, max 5 MB) triggers AI Diagnostics
- Deterministic rule-based mock returns: urgency, confidence, differentials, guidance, explanation
- Prominent disclaimer on every result

### 4. Clinician Dashboard (Read-only)
- Stats bar: total, scheduled, completed, cancelled
- Filter by provider and date
- Table view with AI triage outcomes

---

## Architecture Decisions

### In-memory Store
Data is stored in a module-level `store.ts` singleton (arrays + counters). This resets on each server restart — appropriate for a demo/prototype. For production, swap for a real database (Postgres via Prisma, etc.).

### Deterministic AI Mock
The triage endpoint (`/api/ai/triage`) uses a rule-based algorithm:
- Keyword matching on symptoms (critical keywords → Critical urgency, etc.)
- Vital sign thresholds (SpO₂ < 92, temp ≥ 39.5°C, HR > 120 → High/Critical)
- Onset days (≥ 7 with no critical flags → Low)
- Fixed differential lists per symptom cluster

No LLM or external services are called. The output is 100% deterministic for the same input.

### Timezone Handling
All times stored as UTC ISO strings. The UI displays in IST (Asia/Kolkata) using `date-fns-tz`.

---

## Setup & Run

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm start
```

---

## Tests

```bash
# Run all tests
npm test

# Run with verbose output
npm test -- --verbose

# Watch mode
npm test -- --watch
```

Test coverage:
- `__tests__/store.test.ts` — unit tests for the in-memory store (CRUD, filtering, duplicate detection)
- `__tests__/triage.test.ts` — unit tests for the deterministic triage logic

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

---

## Accessibility Notes

- All form inputs have `<label>` associations
- Error messages use `role="alert"` for screen readers
- Buttons have descriptive `aria-label` where needed
- Keyboard navigation supported throughout
- Focus styles visible on all interactive elements (`focus-visible` ring)
- Color contrast follows WCAG AA guidelines (dark theme)
- Modal traps are dismissible via Escape / clicking outside

---

## Performance Notes

- Next.js App Router enables automatic code splitting per route
- Static assets served via Next.js optimized pipeline
- React Query caches API responses (30s stale time for patients, 60s for providers)
- No heavy dependencies (no heavy UI libraries, no full icon packs)

---

## Security Notes (Frontend Scope)

- No API keys in code/repo — all mocks are server-side route handlers
- File upload validates type (`ALLOWED_FILE_TYPES`) and size (5 MB max) before submitting
- No PII logged to browser console
- Input validation via Zod on both client (React Hook Form) and server (API routes)

---

## Limitations

- In-memory store resets on server restart (by design for demo)
- No authentication/authorization (out of scope per brief)
- Triage mock is rule-based, not a real AI model
- i18n strings are externalized in `lib/utils.ts → STRINGS` — wire to `next-intl` for full i18n
- No real file content is analyzed (file upload is UI-only, diagnostics return fixed mock output)
