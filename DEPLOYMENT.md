# StudyMate Deployment Checklist

## Pre-Deploy

- [ ] PostgreSQL database provisioned (Neon, Supabase, RDS, or self-hosted)
- [ ] `DATABASE_URL` set in deployment platform env vars
- [ ] `AUTH_SECRET` set (generate a 32+ char random string)
- [ ] `NODE_ENV=production` set
- [ ] Optional: S3 credentials set if using `STORAGE_PROVIDER=s3`
- [ ] Optional: AI provider API keys set (OpenAI, Anthropic, etc.)

## Database

- [ ] `npx prisma generate` run in build step
- [ ] `npx prisma migrate deploy` run against production database
- [ ] Verify Prisma Client version matches schema (`prisma@5.22.0`)

## Build

- [ ] `npm run build` completes without errors
- [ ] `tsc --noEmit` passes
- [ ] All API routes and pages render correctly

## Deploy

- [ ] Deploy to platform (Vercel, Node.js host, Docker, etc.)
- [ ] Verify `/` loads without errors
- [ ] Verify auth flows (signup, login, logout)
- [ ] Verify document upload and extraction
- [ ] Verify quiz creation and attempts

## Post-Deploy

- [ ] Monitor error logs
- [ ] Verify database connections
- [ ] Set up backups for PostgreSQL
