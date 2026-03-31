# StreamIt Backend

## Installation

```bash
bun install
```

## Development

```bash
bun run dev
```

## Database

```bash
# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Push schema changes
bun run db:push

# Open Prisma Studio
bun run db:studio

# Seed payment data
bun run db:seed

# Seed discount codes
bun run db:seed-discount
```

## Scripts

- `dev` - Start development server with hot reload
- `start` - Start production server
- `build` - Build for production
- `typecheck` - Run TypeScript type checking
- `lint` - Run ESLint
- `lint:fix` - Fix ESLint errors
- `format` - Format code with Prettier
- `format:check` - Check code formatting
- `db:generate` - Generate Prisma client
- `db:migrate` - Run database migrations
- `db:migrate:deploy` - Deploy migrations to production
- `db:push` - Push schema changes to database
- `db:studio` - Open Prisma Studio
- `db:seed` - Seed payment data
- `db:seed-discount` - Seed discount codes
- `auth:generate` - Generate Better Auth types
- `setup` - Complete setup (install, generate, migrate)

---

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
