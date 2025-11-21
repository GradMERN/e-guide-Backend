# E-Tour Guide — App Overview

This document explains what the app does, main actors, use cases and full scenarios to help developers, testers, and integrators understand the system.

## Purpose

E-Tour Guide is a backend API for a digital tour guide platform. It provides endpoints for:

- User authentication (local & Google OAuth)
- Email verification and password reset
- Profiles and account management
- Guides to create/manage tours and tour items
- Users to enroll in tours and consume protected tour content
- Places management (locations and categories)
- Reviews and automatic rating aggregation
- Enrollment lifecycle and (placeholder) payments
- Media upload (images, audio) stored under `public/tours`

## Actors

- User: Regular consumer who browses tours, enrolls, reads/listens to tour items.
- Guide: Creator of tours and tour items, manages content and media.
- Admin: Manages users (view/change role/delete) and has full access.

## Main Features / Endpoints

- Auth

  - POST `/api/auth/register` — register new user (local)
  - POST `/api/auth/login` — login (local)
  - GET `/api/auth/verify-email/:token` — verify account email
  - POST `/api/auth/resend-verification` — resend verification email
  - POST `/api/auth/forgot-password` — send reset token
  - POST `/api/auth/reset-password/:token` — reset password
  - Google OAuth endpoints (via Passport) redirect back with JWT

- User / Profile (`/api/user`)

  - GET `/profile` — get current user's profile
  - PUT `/profile` — update profile
  - PUT `/change-password` — change password
  - DELETE `/delete-account` — delete own account

- Admin (`/api/admin`) — protected by admin role

  - GET `/` — list users
  - GET `/:id` — get user
  - PATCH `/:id/role` — update role
  - DELETE `/:id` — delete user

- Tours (`/api/tours`) — restricted to guides for create/update/delete

  - POST `/` — create a tour
  - GET `/` — list tours (filter/sort/fields/paginate)
  - GET `/:tourId` — get single tour
  - PATCH `/:tourId` — update tour
  - DELETE `/:tourId` — delete tour and associated files
  - PATCH `/:tourId/images` — upload `mainImg` and `coverImgs` (multipart)
  - PATCH `/:tourId/images/delete` — delete image
  - Nested: `/api/tours/:tourId/items` — tour items

- Tour Items

  - GET `/api/tours/:tourId/items` — list items
  - GET `/api/tours/:tourId/items/:itemId` — get single item
  - Access control: full content returned only to admin, guide, or users with `in_progress` enrollment for that tour.

- Places (`/api/places`) — create/read/update/delete places

- Enrollments (`/api/enrollments`)

  - POST `/:tourId/enroll` — enroll in tour
  - GET `/` — get user's enrollments

- Reviews & Payments — models present; payments (Stripe) currently placeholder.

## Data Model Highlights

- `User` includes `loginMethod` to handle local and Google sign-ins; password is required for local users only.
- `TourItem` uses GeoJSON `Point` with 2dsphere index for location data.
- `Review` enforces unique (tour, user) and triggers rating aggregation on save/update.
- `Enrollment` automatically sets `expiresAt` when status becomes `in_progress`.

## Typical Scenarios

1. New user registration

   - User posts registration data -> server creates user, hashes password, sends verification email with token.
   - User clicks verification link -> account marked verified, server returns JWT.

2. Login and consume content

   - User logs in (local or via Google OAuth), receives JWT.
   - User browses tours via `/api/tours` (supports filtering/sorting/pagination).
   - User enrolls in a paid/free tour via `POST /api/enrollments/:tourId/enroll`.
   - While enrollment `in_progress`, user can access full tour items content.

3. Guide flow

   - Guide registers and is assigned `guide` role (or admin creates role change).
   - Guide creates Place(s), creates Tour(s) with `place` reference, uploads images.
   - Guide adds TourItems (audio, images, script, geo location) for the tour.

4. Admin flow
   - Admin lists users, changes roles, deletes accounts.

## Operational Notes

- Media stored in `public/tours/{tourId}/...` — ensure backups and disk-space monitoring.
- Email and OAuth credentials must be configured via environment variables (not committed).
- Rate limiting is applied globally; consider stricter limits for auth endpoints.

## Testing / Local Dev

- Use `test.env` (provided) with a local MongoDB instance to run tests and development.
- To run locally:

```cmd
copy test.env .env
npm install
node server.js
```

## Checklist for next improvements

- [ ] Rotate any leaked credentials and remove `.env` from repository
- [ ] Harden multer file filters and add max size limits
- [ ] Add per-route rate limit on auth endpoints
- [ ] Standardize API response format
- [ ] Add unit/integration tests for auth, enrollments, file uploads
- [ ] Add CI flows and PR checks
