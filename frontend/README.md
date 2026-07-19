# Frontend Technical Documentation

Next.js frontend for the Meeting Room Booking System dashboard.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Application Responsibilities

- Select active actor (mock auth via backend actor list)
- Render permission-aware dashboard sections and actions
- Manage bookings, users, roles, and analytics views
- Surface backend validation and authorization errors to users

## Core Frontend Structure

- src/app/page.tsx
	- Main dashboard UI and feature workflows
	- Actor switching and data refresh orchestration
- src/lib/api-client.ts
	- Typed API client wrapper
	- Header injection for x-user-id and x-user-role
	- Unified ApiError shape
- src/lib/types.ts
	- Shared frontend type contracts
- src/lib/logger.ts
	- Centralized client logging helper

## Runtime Configuration

Required environment variable:

- NEXT_PUBLIC_API_BASE_URL

Example:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-host/api
```

If omitted, fallback is http://localhost:3001/api.

## Permission-Driven UX

UI behavior is controlled using actor permissions from /auth/actors.

Examples:

- booking:create controls create booking form submission
- booking:view controls bookings table visibility/data load
- user:* controls user management actions
- role:* controls role management features

## Error Handling

- API failures are normalized through ApiError
- Standardized notice banners are shown in the dashboard
- 429 responses map to a specific rate-limit message

## Logging and Clean Code Rules

- Frontend logging is centralized in src/lib/logger.ts
- eslint rule blocks console.log usage
- allowed console methods: info, warn, error

## Scripts

- npm run dev: start local dev server
- npm run build: create production build
- npm run start: run built app
- npm run lint: run ESLint checks

## Local Development

1. npm install
2. set NEXT_PUBLIC_API_BASE_URL
3. npm run dev

## Deployment

For Vercel:

1. Set NEXT_PUBLIC_API_BASE_URL to the deployed backend /api URL
2. Build and deploy

Important: frontend and backend must point to the same environment pair (same stage/database) to avoid actor-id mismatches.
