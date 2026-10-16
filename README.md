# StudyMate AI

StudyMate is a Next.js study platform with AI-generated reviewers, quizzes, flashcards, document extraction, AI tutoring, authentication, dashboards, and progress tracking.

## Tech Stack

- **Framework:** Next.js 16.4.2 (App Router, Turbopack)
- **React:** 19.3.0
- **Styling:** Tailwind CSS v4, shadcn/ui components, Radix UI primitives
- **Database:** PostgreSQL with Prisma ORM (v5.22.0)
- **Auth:** JWT sessions (jose) + bcryptjs password hashing
- **AI:** Native fetch-based provider adapter with deterministic fallbacks
- **Documents:** PDF parsing (pdf-parse), DOCX extraction (mammoth)
- **Type Safety:** TypeScript, Zod validation schemas
- **Charts:** Recharts
- **Testing:** Vitest, React Testing Library, jsdom

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Random secret for JWT session signing (min 32 chars)

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type checking |

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/       # React components (shadcn/ui + custom)
  lib/              # Prisma client, auth, validation, AI, extraction, storage
  types/            # TypeScript declarations
prisma/
  schema.prisma     # Database schema
```

## Key Features

- **Authentication:** Sign up, sign in, JWT sessions, role-based access (STUDENT/TEACHER/ADMIN)
- **Documents:** Upload PDF/DOCX/TXT, extract text, OCR support
- **Reviewers:** AI-generated study notes, key concepts, definitions from source material
- **Quizzes:** Multiple choice, true/false, short answer, fill-in-the-blank; attempts with scoring
- **Flashcards:** Decks and cards with spaced repetition tracking
- **AI Tutor:** Chat-based tutoring with optional source material grounding
- **Planner:** Study schedule and task management
- **Progress:** Quiz attempt analytics, average scores, flashcard/material counts
- **Dashboards:** Student, teacher, and admin views

## Deployment

The app is ready for deployment on Vercel, Node.js hosting, or Docker. Set all environment variables in your deployment platform and run `npm run build` before starting the production server.

```bash
npm run build
npm run start
```

## License

MIT