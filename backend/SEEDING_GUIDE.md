# Database Seeding Guide

This backend now uses a lean seed instead of the old large demo dataset.

The goal is simple:
- reset the test database quickly
- create proper Better Auth users
- keep just enough data to exercise backend flows without waiting on hundreds of rows

## What the lean seed creates

- 5 admin users across all admin roles
- 4 regular users
- 2 approved creators
- 1 pending creator application
- 3 coin packages
- 3 gifts
- 2 discount codes
- 2 streams with stats
- 4 posts with media, likes, comments, and views
- 3 coin purchases
- 3 gift transactions
- 2 withdrawal requests
- 2 moderation reports
- 1 stream report
- 1 ad creative
- 1 geo block
- core system settings used by backend services

## Important Better Auth note

Users are not seeded with raw `prisma.user.create()` calls.

The seed uses Better Auth internals from `auth.$context` to:
- create the user
- hash the password with Better Auth's password hasher
- link the `credential` account correctly

That keeps seeded users sign-in compatible without triggering OTP email delivery during seeding.

## Commands

From the `backend` directory:

```bash
# Seed without deleting existing data first
bun run db:seed

# Delete everything in the current database, then seed again
bun run db:reset-seed

# Delete everything only
bun run db:clear-seed

# Verify the seeded counts
bun run db:verify-seed
```

## Local flow

```bash
cd backend
bun run db:generate
bun run db:migrate
bun run db:reset-seed
bun run db:verify-seed
```

## Default credentials

### Admins

- `admin@streamit.com` / `Admin@12345`
- `moderator@streamit.com` / `Moderator@123`
- `finance@streamit.com` / `Finance@12345`
- `support@streamit.com` / `Support@12345`
- `compliance@streamit.com` / `Compliance@123`

### Users

- `viewer.one@streamit.com` / `Viewer@12345`
- `viewer.two@streamit.com` / `Viewer@12345`
- `reporter@streamit.com` / `Viewer@12345`
- `applicant@streamit.com` / `Viewer@12345`

### Creators

- `rohan.creator@streamit.com` / `Creator@12345`
- `sara.creator@streamit.com` / `Creator@12345`

## Why this is faster

The old seed tried to create large volumes of demo content.

This lean seed keeps only the records needed to test:
- auth and login
- creator approval logic
- posts, comments, likes, follows
- stream and stream-report flows
- purchases, gifts, and withdrawals
- moderation dashboards
- admin settings and compliance endpoints

## Files involved

- `backend/prisma/seed-comprehensive.ts`
- `backend/prisma/seed-helpers.ts`
- `backend/scripts/verify-seed.ts`

## Safety note

`db:reset-seed` and `db:clear-seed` delete all rows in the connected database.

Make sure your `DATABASE_URL` points to the intended test database before running them.
