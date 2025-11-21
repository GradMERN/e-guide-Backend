# E-Guide Backend API Documentation

Base URL: `http://localhost:3000`

---

## Authentication

### Register

- `POST /api/auth/register`
- Body: `{ firstName, lastName, age, phone, country, city, email, password }`

### Login

- `POST /api/auth/login`
- Body: `{ email, password }`

### Verify Email

- `GET /api/auth/verify-email/:token`

### Resend Verification Email

- `POST /api/auth/resend-verification`
- Body: `{ email }`

### Forgot Password

- `POST /api/auth/forgot-password`
- Body: `{ email }`

### Reset Password

- `POST /api/auth/reset-password/:token`
- Body: `{ newPassword }`

---

## User

### Get Profile

- `GET /api/user/profile`
- Auth: Bearer Token

### Update Profile

- `PUT /api/user/profile`
- Body: `{ firstName, lastName, age, phone, country, city, email }`
- Auth: Bearer Token

### Change Password

- `PUT /api/user/change-password`
- Body: `{ currentPassword, newPassword }`
- Auth: Bearer Token

### Delete Account

- `DELETE /api/user/delete-account`
- Auth: Bearer Token

### Get Payments

- `GET /api/user/payments`
- Auth: Bearer Token

---

## Admin

### Get All Users

- `GET /api/admin/`
- Auth: Admin Token

### Get Dashboard Stats

- `GET /api/admin/dashboard`
- Auth: Admin Token

### Get User by ID

- `GET /api/admin/:id`
- Auth: Admin Token

### Update User Role

- `PATCH /api/admin/:id/role`
- Body: `{ role }`
- Auth: Admin Token

### Delete User

- `DELETE /api/admin/:id`
- Auth: Admin Token

---

## Tours

### Create Tour

- `POST /api/tours/`
- Body: `{ name, description, price, mainImg, coverImgs, place, guide }`
- Auth: Guide Token

### Get All Tours

- `GET /api/tours/`

### Get Tour by ID

- `GET /api/tours/:tourId`

### Update Tour

- `PATCH /api/tours/:tourId`
- Body: `{ name, description, price, mainImg, coverImgs, place, guide }`
- Auth: Guide Token

### Delete Tour

- `DELETE /api/tours/:tourId`
- Auth: Guide Token

### Upload Tour Images

- `PATCH /api/tours/:tourId/images`
- Form Data: `mainImg`, `coverImgs[]`
- Auth: Guide Token

### Delete Tour Image

- `PATCH /api/tours/:tourId/images/delete`
- Auth: Guide Token

---

## Tour Items

### Get Tour Items

- `GET /api/tours/:tourId/items/`
- Auth: Bearer Token

### Get Tour Item by ID

- `GET /api/tours/:tourId/items/:itemId`
- Auth: Bearer Token

### Create Tour Item

- `POST /api/tours/:tourId/items/`
- Body: `{ name, mainImg, imgs, audio, script, location }`
- Auth: Guide Token

### Update Tour Item

- `PATCH /api/tours/:tourId/items/:itemId`
- Body: `{ name, mainImg, imgs, audio, script, location }`
- Auth: Guide Token

---

## Places

### Create Place

- `POST /api/places/`
- Body: `{ name, country, city, category }`
- Auth: Guide/User Token

### Get All Places

- `GET /api/places/`
- Auth: Guide/User Token

### Get Place by ID

- `GET /api/places/:id`
- Auth: Guide/User Token

### Update Place

- `PUT /api/places/:id`
- Body: `{ name, country, city, category }`
- Auth: Guide/User Token

### Delete Place

- `DELETE /api/places/:id`
- Auth: Guide/User Token

---

## Enrollments

### Enroll in Tour

- `POST /api/enrollments/:tourId/enroll`
- Auth: Bearer Token

### Get User Enrollments

- `GET /api/enrollments/`
- Auth: Bearer Token

---

## Payments

### Create Payment Intent

- `POST /api/payments/create/:enrollmentId`
- Auth: Bearer Token

### Stripe Webhook

- `POST /api/payments/webhook`
- (Stripe only)

---

## OAuth

### Google OAuth

- `GET /auth/google`
- Redirects to Google login

### Google OAuth Callback

- `GET /auth/google/callback`
- Handles Google login callback

---

## Notes

- All protected routes require a valid JWT Bearer token in the Authorization header.
- Admin-only routes require an admin token.
- Guide-only routes require a guide token.
- Use correct request body and parameters as specified above.
- For file uploads, use `multipart/form-data`.
