# Meeting Room Booking System

Full-stack interview project with **Next.js + NestJS + Prisma**, now upgraded to support **dynamic role creation and dynamic permissions**.

## Architecture Overview

- `backend/` (NestJS):
  - Prisma models: `User`, `Booking`, `Role`, `Permission`.
  - Header-based mock auth context (`x-user-id`, optional `x-user-role` check).
  - Permission-based RBAC via `@Permissions(...)` decorator + `PermissionsGuard`.
  - Security: Helmet, CORS allowlist, global validation pipe, global exception filter, global throttling.
  - Structured request logging (method, path, actor, status, latency).
- `frontend/` (Next.js App Router):
  - Mock actor switcher.
  - Booking management UI.
  - User management UI.
  - **Role management UI** (create role + edit permissions).
  - UI visibility/actions driven by actor permissions.

## Database Schema (Prisma)

```prisma
model User {
  id       String    @id @default(cuid())
  name     String
  roleId   String
  role     Role      @relation(fields: [roleId], references: [id], onDelete: Restrict)
  bookings Booking[]
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  permissions Permission[]
  users       User[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Permission {
  id     String @id @default(cuid())
  roleId String
  action String
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@unique([roleId, action])
}

model Booking {
  id        String   @id @default(cuid())
  userId    String
  startTime DateTime
  endTime   DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Documentation

Base URL: `http://localhost:3001/api`

### Headers
- `x-user-id: <userId>` required for protected endpoints.
- `x-user-role: <roleName>` optional consistency check.

### Error Format
```json
{
  "statusCode": 403,
  "timestamp": "2026-07-19T06:27:13.130Z",
  "path": "/api/bookings",
  "message": "Insufficient permission: booking:create."
}
```

### Auth
- `GET /auth/actors` (public): list users with role and permissions.

### Roles (dynamic)
- `GET /roles` (`role:view`)
- `GET /roles/permissions/available` (`role:view`)
- `POST /roles` (`role:create`)
  - Body: `{ "name": "auditor", "permissions": ["booking:view","role:view"] }`
- `PATCH /roles/:id/permissions` (`role:update-permissions`)
  - Body: `{ "permissions": ["booking:view","booking:view:summary","role:view"] }`

### Users
- `GET /users` (`user:view`)
- `GET /users/roles` (`role:view`) – list assignable roles for user creation/update
- `POST /users` (`user:create`)
  - Body: `{ "name": "Jane", "roleId": "<role-id>" }`
- `PATCH /users/:id/role` (`user:update-role`)
  - Body: `{ "roleId": "<role-id>" }`
- `DELETE /users/:id` (`user:delete`) – bookings cascade by FK rule

### Bookings
- `GET /bookings` (`booking:view`)
- `POST /bookings` (`booking:create`, plus stricter 5/min rate limit)
- `DELETE /bookings/:id` (`booking:delete:own`, with `booking:delete:any` override)
- `GET /bookings/grouped/by-user` (`booking:view:grouped`)
- `GET /bookings/summary/usage` (`booking:view:summary`)

## Booking Rules

- `startTime` must be before `endTime`.
- Overlap is blocked with:
  - `existing.startTime < newEnd && existing.endTime > newStart`
- Adjacent bookings are allowed (`endA === startB`).
- Booking creation runs in a serializable transaction.

## Security & Resilience

- Global throttling: `60 req/min`.
- Booking create throttling: `5 req/min`.
- `helmet` enabled globally.
- CORS restricted by `CORS_ORIGINS`.
- Global `ValidationPipe`:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- Global exception filter sanitizes errors.

## Time & Timezone Strategy

- Backend accepts/stores ISO datetimes in UTC.
- Frontend converts local datetime input to ISO UTC before send.
- UI renders booking times in UTC label format.

## Local Setup

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api npm run dev
```

### Verification
```bash
cd backend && npm run lint && npm run test && npm run build
cd frontend && npm run lint && npm run build
```

## Deployment Notes

- Backend (Render/Railway/Vercel):
  - use a persistent managed database (for example Postgres on Neon/Supabase/Railway)
  - do not use SQLite file URLs like `file:./dev.db` in serverless production
  - set `DATABASE_URL` to your managed Postgres URL (must not be `file:` on Vercel production)
  - set `PORT`, `CORS_ORIGINS`
  - run `npx prisma db push`
  - start with `npm run start:prod`
- Frontend (Vercel):
  - set `NEXT_PUBLIC_API_BASE_URL=https://<backend>/api`
  - ensure `<backend>` is the same deployment/environment that owns the `DATABASE_URL` above

