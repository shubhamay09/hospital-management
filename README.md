# MediCare Hub

**AI-Assisted Hospital Management System**

A full-stack web application for patient registration, appointment scheduling, and AI-powered clinical triage — built as a functional prototype with synthetic data.

> ⚠️ **Disclaimer:** This is a demo prototype using synthetic data only. All AI outputs are deterministic mocks. Not intended for real clinical use. No real PHI/PII is processed.

---

## Live Demo

🔗 [medicare-hub.vercel.app](https://medicare-hub.vercel.app) *(replace with your Vercel URL)*

---

## What It Does

### Patient Registration
New patients are registered with full demographic and medical history details. The system detects duplicate entries by phone or email and prompts the user with a resolution dialog rather than silently failing. Registered patients can be searched and browsed from a live list.

### Appointment Scheduling
Clinicians or staff can search for providers by specialty or name, browse their available time slots (displayed in IST), and book appointments for registered patients. Existing appointments can be rescheduled or cancelled with a confirmation step.

### AI Triage
Patients or staff describe symptoms using free-text input or pre-defined chips, enter vitals (temperature, heart rate, blood pressure, SpO₂), and optionally upload a medical file. The system returns a triage urgency level, a ranked list of differential diagnoses with confidence scores, clinical guidance, and a plain-language explanation. An optional AI Diagnostics result is generated when a file is uploaded.

### Clinician Dashboard
A read-only view of all appointments with summary stats, filterable by provider and date. Each appointment row shows the latest AI triage outcome alongside the scheduling details.

---

## Screenshots

> *(Add screenshots here once deployed)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Forms & Validation | React Hook Form + Zod |
| Data Fetching | TanStack React Query v5 |
| API | Next.js Route Handlers (server-side mocks) |
| Testing | Jest + Testing Library |
| Deployment | Vercel |

---

## How the AI Mock Works

There is no external AI or LLM involved. The triage endpoint uses a deterministic, rule-based algorithm:

- **Critical** — triggered by keywords like "chest pain", "unconscious", or SpO₂ below 92%
- **High** — triggered by temperature ≥ 39.5°C, heart rate > 120 bpm, or "severe" in symptoms
- **Low** — triggered by mild symptoms or onset ≥ 7 days with no critical flags
- **Medium** — everything else

Differential diagnoses are matched from fixed symptom clusters (e.g. fever + sore throat → viral/strep pharyngitis). The same input always returns the same output. No API calls are made at runtime.

---

## Project Structure

```
├── app/
│   ├── (dashboard)/
│   │   ├── registration/     # Patient registration & search
│   │   ├── scheduling/       # Provider search, booking, appointments list
│   │   ├── triage/           # AI triage form & results
│   │   └── clinician/        # Read-only clinician dashboard
│   └── api/
│       ├── patients/         # GET + POST with duplicate detection
│       ├── providers/        # GET with specialty/name filtering
│       ├── appointments/     # GET + POST + PATCH (reschedule/cancel)
│       ├── ai/triage/        # Deterministic triage mock
│       └── ai/diagnostics/   # File-type-validated diagnostics mock
├── lib/
│   ├── store.ts              # In-memory data store with seed data
│   └── utils.ts              # Utilities + externalized UI strings
├── types/                    # Shared TypeScript types
├── components/ui/            # Design system components
└── __tests__/                # Unit tests
```

---

## Running Tests

```bash
npm test
```

Two test suites are included:

- **`store.test.ts`** — covers patient CRUD, provider filtering, appointment lifecycle, and duplicate detection (12 tests)
- **`triage.test.ts`** — covers the urgency classification rules across all four urgency levels (7 tests)

---

## Accessibility

- All form inputs are associated with visible labels
- Error messages use `role="alert"` for screen reader announcement
- Keyboard navigation works throughout with visible focus rings
- Modals are dismissible via Escape key or clicking outside
- Color contrast meets WCAG AA on the dark theme

---

## Limitations

- **In-memory data** — the store resets on every server restart. For production, replace with a real database (e.g. Postgres via Prisma).
- **No authentication** — out of scope for this prototype.
- **Mock AI only** — the triage output is rule-based, not a real clinical model.
- **File upload is UI-only** — uploaded files are not read or analyzed; diagnostics always return fixed mock output.
- **i18n** — UI strings are externalized in `lib/utils.ts → STRINGS` and ready to wire into `next-intl` for multi-language support.

---

## License

MIT — free to use and modify for non-clinical purposes.
