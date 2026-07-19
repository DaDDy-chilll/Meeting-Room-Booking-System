# Backend Technical Documentation

NestJS backend for the Meeting Room Booking System.

## Stack

- NestJS 11 (modular architecture)
- Prisma ORM
- PostgreSQL in production (Neon/Vercel Postgres compatible)
- SQLite fallback only for local development convenience

## Module Structure

- src/auth: actor discovery and request actor context
- src/bookings: booking CRUD and booking analytics APIs
- src/users: user management and role assignment
- src/roles: dynamic role and permission management
- src/common: guards, decorators, filters, interceptors, throttling
- src/prisma: database connection and bootstrap seeding

## Auth and Authorization

- Auth model: header-based actor context
  - x-user-id: required for protected endpoints
  - x-user-role: optional consistency check against persisted role
- Authorization model: permission-based RBAC
  - @Roles(...) decorator metadata
  - PermissionsGuard validates required permissions against actor permissions

## Database and Seeding

- Prisma datasource provider: postgresql
- Schema includes User, Role, Permission, Booking
- Seed command: npm run db:seed
- Deterministic default records:
  - roles: admin, owner, user
  - users: System Admin, Room Owner, Standard User

## Runtime Database Resolution

Prisma runtime chooses database URL from:

1. DATABASE_URL
2. POSTGRES_PRISMA_URL
3. POSTGRES_URL

On Vercel production, SQLite file URLs are blocked by default to prevent data loss from ephemeral storage.

Temporary override (demo only):

- ALLOW_SQLITE_IN_PRODUCTION=true

This override is unsafe for real production persistence.

## API Surface

Base path: /api

- GET /auth/actors
- GET /auth/me
- GET/POST/DELETE /bookings
- GET /bookings/grouped/by-user
- GET /bookings/summary/usage
- GET/POST/PATCH/DELETE /users
- GET/POST/PATCH/DELETE /roles
- GET /roles/permissions/available

## Security and Operational Controls

- helmet middleware enabled
- CORS enabled (currently wildcard)
- global ValidationPipe with whitelist + transform
- global exception filter
- global and route-level throttling
- structured HTTP request logging interceptor

## Scripts

- npm run start:dev: start backend in watch mode
- npm run build: generate Prisma client + compile Nest app
- npm run db:push: sync Prisma schema to connected database
- npm run db:seed: seed default roles/users/permissions
- npm run test: run unit tests
- npm run test:e2e: run e2e tests

## Production Deployment (Vercel)

Required environment variables:

- DATABASE_URL (recommended) or POSTGRES_PRISMA_URL
- PORT

Build pipeline:

1. prisma generate
2. prisma db push
3. prisma db seed
4. nest build

Configured script:

- npm run vercel-build

## Local Development

1. npm install
2. set DATABASE_URL in .env (local Postgres recommended)
3. npm run db:push
4. npm run db:seed
5. npm run start:dev
