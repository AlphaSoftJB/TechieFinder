# TechieFinder Platform - Technical Documentation

## Executive Summary

TechieFinder connects Nigerian users with local technicians. This document
describes the platform as it actually exists and runs: a Spring Boot backend,
a React web app, and a React Native mobile app, all verified working against
each other. Where a feature is planned but not built, it's labeled as such
rather than described as if it existed — an earlier version of this document
described a web frontend, test suites, and push/SMS/email delivery that never
existed in the codebase; this rewrite reflects what was actually built and
verified.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Documentation](#backend-documentation)
3. [Web App Documentation](#web-app-documentation)
4. [Mobile App Documentation](#mobile-app-documentation)
5. [Database Schema](#database-schema)
6. [Authentication & Security](#authentication--security)
7. [Deployment Guide](#deployment-guide)
8. [API Reference](#api-reference)
9. [Testing Strategy](#testing-strategy)
10. [Known Limitations](#known-limitations)

---

## System Architecture

### High-Level Overview

Three client-facing surfaces (web, mobile, and the backend's own H2 console
in dev) talk to a single Spring Boot REST API backed by MySQL in production
or an in-memory H2 database in development.

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
├──────────────────────┬──────────────────────────────────┤
│   Web (React 19)     │    Mobile (React Native/Expo)    │
│   Port: 3000          │    iOS & Android                 │
└──────────┬───────────┴──────────────┬───────────────────┘
           │      REST API, JWT bearer auth              │
┌──────────┴──────────────────────────┴───────────────────┐
│         Backend (Spring Boot 3.1.5, Java 17)              │
│                    Port: 8080                             │
└──────────────────────┬──────────────────────────────────┘
┌──────────────────────┴──────────────────────────────────┐
│      MySQL 8 (prod, via docker-compose) / H2 (dev)         │
└──────────────────────────────────────────────────────────┘
```

### Component Interaction Flow (booking example)

1. Web/mobile client authenticates via `POST /api/auth/login`, stores the
   returned JWT (`localStorage` on web, `AsyncStorage` on mobile)
2. Client attaches `Authorization: Bearer <token>` to subsequent requests via
   an axios interceptor
3. Customer searches technicians (`GET /api/technicians/available?category=`
   or `/api/technicians/nearby?latitude=&longitude=`)
4. Customer creates a booking (`POST /api/bookings`) — the technician gets a
   `BOOKING_CREATED` notification
5. Technician confirms (`PATCH /api/bookings/{id}/status`) — ownership is
   checked server-side (only the assigned technician's user account can
   confirm/reject/progress a booking; either party can cancel it)
6. Customer pays (`POST /api/payments/bookings/{id}/pay`) — settles against a
   simulated wallet today, not a real payment gateway
7. Technician marks the job in-progress, then completed
8. Customer rates the booking once (`POST /api/ratings`) — the technician's
   `rating`/`totalRatings` are recalculated from all their ratings

---

## Backend Documentation

### Project Structure

```
backend/src/main/java/com/techiefinder/
├── TechieFinderApplication.java
├── config/
│   ├── SecurityConfig.java       # JWT filter chain, CORS, method security
│   ├── JpaConfig.java             # @EnableJpaAuditing (createdAt/updatedAt)
│   └── DataInitializer.java       # Seeds 10 service categories on startup
├── controller/                    # One package per domain area
│   ├── auth/ AuthController
│   ├── user/ UserController
│   ├── technician/ TechnicianController
│   ├── booking/ BookingController
│   ├── payment/ PaymentController
│   ├── rating/ RatingController
│   ├── notification/ NotificationController
│   ├── messaging/ ConversationController
│   └── publicapi/ PublicController
├── service/                       # Business logic, one package per domain
├── repository/                    # Spring Data JPA repositories
├── model/                         # JPA entities (18 total)
├── dto/                           # Request/response DTOs
├── security/                      # JwtTokenProvider, JwtAuthenticationFilter,
│                                     CustomUserDetails(Service)
└── exception/                     # GlobalExceptionHandler + ApiError
```

### Core Dependencies (`pom.xml`)

Spring Boot 3.1.5 starters: `web`, `data-jpa`, `security`, `validation`,
`actuator`, `mail`. Plus: `h2` (dev, runtime), `mysql-connector-j` (prod, runtime),
`jjwt-api`/`jjwt-impl`/`jjwt-jackson` 0.11.5, `firebase-admin` (push), `lombok`,
`spring-boot-starter-test` + `spring-security-test` (test scope).

### Configuration

Two property files, layered (Spring merges the active profile's file on top
of the base one):

**`application.properties`** (default/dev profile — no `SPRING_PROFILES_ACTIVE`
needed):
```properties
spring.datasource.url=jdbc:h2:mem:techiefinder
spring.jpa.hibernate.ddl-auto=create-drop
jwt.secret=${JWT_SECRET:<74-byte dev-only default>}
cors.allowed.origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173,http://localhost:8080}
admin.default.email=${ADMIN_EMAIL:admin@techiefinder.com}
admin.default.password=${ADMIN_PASSWORD:ChangeMe123!}
payment.gateway.provider=${PAYMENT_GATEWAY_PROVIDER:wallet}
payment.gateway.callback.url=${PAYMENT_CALLBACK_URL:http://localhost:3000/payments/callback}
```
See the README's "Configurable, requires your own credentials" section for
the payment/Firebase/email/SMS variables — all default to a safe no-op/
simulation without real credentials.

**`application-prod.properties`** (`SPRING_PROFILES_ACTIVE=prod`):
```properties
spring.datasource.url=${DATABASE_URL:jdbc:mysql://localhost:3306/techiefinder}
spring.datasource.username=${DATABASE_USERNAME:root}
spring.datasource.password=${DATABASE_PASSWORD:password}
spring.jpa.hibernate.ddl-auto=update
jwt.secret=${JWT_SECRET:...}
```

`jwt.secret` must be at least 64 bytes since tokens are signed with HS512 —
a short secret throws `WeakKeyException` at the first login/register call.

---

## Web App Documentation

### Technology Stack
React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7, axios, i18next/
react-i18next, Vitest + Testing Library.

### Project Structure
```
web/src/
├── pages/            # Home, Login, Register, Search, TechnicianProfile,
│                       Dashboard, UserDashboard, TechnicianDashboard,
│                       AdminDashboard, PaymentCallback, Conversation, NotFound
├── components/       # Layout (nav + outlet + language switcher), ProtectedRoute (role-gated)
├── contexts/          # AuthContext (JWT in localStorage)
├── i18n/              # i18next init + locales/{en,yo,ig,ha}.json
└── lib/api.ts         # axios instance, bearer-token interceptor, 401 handler
```

### Key Behavior
- Dev server (`npm run dev`, port 3000) proxies `/api/*` and `/uploads/*` to
  `localhost:8080` via `vite.config.ts` — no CORS issues in local dev
- A built bundle can point at a different backend host via `VITE_API_URL`
- Category, "Near Me" geo-radius, and "Recommended for you" search all call
  the same `/technicians/available` / `/technicians/nearby` /
  `/technicians/recommended` endpoints the mobile app uses
- Same `AuthContext`/`api.ts` shape as the mobile app, deliberately, so the
  two clients' behavior stays in sync as the API evolves
- Language preference persists in `localStorage` (`techiefinder.language`)
  via `i18next-browser-languagedetector`

---

## Mobile App Documentation

### Overview
Expo-managed React Native app (Expo 54, React Native 0.81, React 19).

### Key Features
Login/Register (login screen has a working en/yo/ig/ha language switcher via
i18next, plus Google sign-in via `expo-auth-session`'s Google provider and
Apple sign-in via `expo-apple-authentication`, both hidden unless a client id
is configured), Home (categories + recommended technicians), Search (category
+ device-location "Near Me" via `expo-location`), Technician Profile (ratings,
service offerings, portfolio photos, verified certifications, booking form,
messaging), role-routed dashboards, Chat. Booking payment redirects to a real
gateway checkout (`expo-web-browser`) when one is configured, otherwise
settles instantly against the wallet simulation.

**Biometric quick unlock**: after any login (password or social), the app
offers to remember the session behind Face ID/Touch ID/fingerprint
(`useBiometricOptIn` hook); a toggle on the account screen
(`BiometricUnlockToggle`) lets the user turn it on/off later. The refresh
token is stored via `expo-secure-store` with `requireAuthentication: true`,
so the OS itself (Keychain/Keystore) — not just an app-level check — gates
reading it back out; a plain `AsyncStorage` flag tracks on/off state so the
UI can check it without triggering a prompt just to render. Each unlock
rotates the stored token (`refreshStoredToken`) so quick unlock keeps working
indefinitely rather than expiring after one use.

### Development Setup
```bash
cd mobile && npm install && npm start
```
Defaults to `http://localhost:8080/api`. Override with `EXPO_PUBLIC_API_URL`
for the Android emulator (`10.0.2.2`) or a physical device (your LAN IP).

### Building for Production
```bash
npx eas build --platform ios
npx eas build --platform android
```
Requires an Expo/EAS account; `app.json`'s `extra.eas.projectId` is still a
placeholder value and needs to be set to a real project ID first.

---

## Database Schema

### Entity Overview (18 entities)

- **User** ↔ UserProfile (1:1), UserAddress (1:N), UserPaymentMethod (1:N).
  `password` is nullable (social-only accounts authenticate entirely via a
  verified Google/Apple ID token) and `authProvider`/`providerId` identify
  which provider (if any) created the account.
- **Technician** ↔ User (1:1), TechnicianService (1:N, "what I offer"),
  TechnicianAvailability (1:N), TechnicianLocation (1:1), TechnicianPortfolio
  (1:N), TechnicianCertification (1:N)
- **ServiceCategory** — referenced by TechnicianService and TechnicianPortfolio
- **Booking** → User (customer), Technician, User (cancelledBy, nullable)
- **Payment** → User, Booking (nullable — supports non-booking transactions)
- **Rating** → User, Technician, Booking (1:1, unique — one rating per booking)
- **Conversation** → User, Technician, Booking (nullable); **Message** →
  Conversation, User (sender)
- **Notification** → User

### Schema Management
No Flyway/Liquibase — schema is Hibernate-managed (`ddl-auto=create-drop` in
dev on H2, `update` in prod on MySQL). For a real production deployment,
introducing a migration tool before the schema needs its first manual change
is recommended; `update` with no migration history has no rollback path.

### Notable Design Choices
- All entities extend `BaseEntity` (`id`, `createdAt`, `updatedAt`, `active`
  soft-delete flag) and use Lombok `@Builder`. Every field with a non-null
  default (enum status, boolean flag, `BigDecimal.ZERO`, or a `mappedBy`
  collection) is annotated `@Builder.Default` — without it, Lombok's builder
  silently drops the field's initializer and inserts `NULL` instead, which
  is a real bug class this codebase hit once already (see git history).
- No DTO-less entity exposure: every controller returns a mapped DTO, never
  the entity directly, so fields like `User.password` never serialize.
- `equals()`/`hashCode()` are identity-based (`id` only, defined once in
  `BaseEntity`), not Lombok's field-by-field `@Data` default. Several entities
  have bidirectional relations (e.g. `User` ↔ `UserProfile`); a naive
  field-by-field `hashCode()` recurses through them infinitely the moment
  Hibernate needs to put one in a `HashSet` (a lazily-loaded `@OneToMany`
  collection is backed by one) — this is a real `StackOverflowError` this
  codebase hit once already, surfaced by the technician recommendation
  endpoint being the first code path to touch `Technician.getServices()`
  outside a narrow existing path.

---

## Authentication & Security

### JWT Token-Based Authentication
- HS512-signed tokens via `io.jsonwebtoken` (jjwt 0.11.5)
- `JwtAuthenticationFilter` runs once per request, validates the bearer token,
  and populates the Spring Security context via `CustomUserDetailsService`
- Access token expiry: 24h (`jwt.expiration`, ms); refresh token: 7d
  (`jwt.refresh.expiration`) — both configurable via env vars
- `POST /api/auth/refresh` redeems a refresh token for a new access/refresh
  pair without the password — used by the mobile app's biometric quick unlock

### Social Sign-In (Google/Apple)
- `POST /api/auth/social/google` and `POST /api/auth/social/apple` verify the
  client-supplied ID token's signature against the provider's own published
  JWKS (`GoogleIdTokenVerifierClient`/`AppleIdTokenVerifierClient`, backed by
  a shared `JwksIdTokenVerifier` using `com.auth0:jwks-rsa` + jjwt's
  `SigningKeyResolver` — no Google/Apple SDK dependency needed just to check
  a signature) and its issuer/audience, then finds-or-creates the matching
  `User` (`SocialAuthService`)
- An identity with the same email as an existing LOCAL/other-provider account
  links to it rather than creating a duplicate
- Both clients follow the same `isConfigured()` safe-fallback pattern as the
  payment gateways: blank `GOOGLE_OAUTH_CLIENT_ID`/(`APPLE_OAUTH_CLIENT_ID`
  and `APPLE_OAUTH_BUNDLE_ID`) means the endpoint returns a clear 400 instead
  of attempting verification, and both web/mobile hide their sign-in buttons
  entirely when their own client-id env var is unset
- Apple's ID token never includes a name, only email — the client passes
  `firstName`/`lastName` through from the one-time native authorization
  response if it wants one recorded on first sign-up
- Attempting a password login (`POST /api/auth/login`) on a social-only
  account (`password == null`) fails fast with a clear message rather than
  comparing against a null BCrypt hash

### Password Security
BCrypt via `PasswordEncoder` (Spring Security default strength).

### CORS Configuration
`SecurityConfig.corsConfigurationSource()` reads `cors.allowed.origins` (a
comma-separated list) via `@Value`, not a hardcoded list — override it with
the `CORS_ALLOWED_ORIGINS` env var per environment. Default covers the web
app's dev port (3000), Vite's own default (5173), and the backend's own port
(8080, for tools like a REST client hitting the API directly).

### Role-Based Access Control
`USER` / `TECHNICIAN` / `ADMIN` via Spring Security method security
(`@PreAuthorize`) on individual controller methods, plus path-based rules in
`SecurityConfig` for `/api/admin/**` and `/api/technician/**`.

---

## Deployment Guide

### Prerequisites
Docker + Compose v2 (recommended path), or Java 17 + Maven + Node 20+ + MySQL
8 for a manual deployment.

### Docker Compose (recommended)
```bash
cp .env.example .env   # fill in real JWT_SECRET, DATABASE_PASSWORD, etc.
docker compose up --build
```
Brings up MySQL (`mysql:8.0`, with a healthcheck gating the backend's start),
the backend (`prod` profile), and the web app (built + served via nginx,
which also proxies `/api` to the backend container). See `docker-compose.yml`.

> This was validated with `docker compose config` (parses correctly, env
> interpolation resolves) and by confirming the exact `mvn package` command
> the backend Dockerfile runs succeeds locally. `docker compose up --build`
> itself was not run end-to-end in the sandboxed environment this was built
> in, because its network policy blocks Docker Hub's image CDN. Run it once
> in a normal environment before depending on it for a real deployment.

### Manual Backend Deployment
```bash
cd backend
mvn clean package
SPRING_PROFILES_ACTIVE=prod \
DATABASE_URL=jdbc:mysql://<host>:3306/techiefinder \
DATABASE_USERNAME=... DATABASE_PASSWORD=... JWT_SECRET=... \
java -jar target/techiefinder-backend-1.0.0.jar
```
Put this behind a reverse proxy (nginx/Caddy) terminating TLS; the app itself
serves plain HTTP on 8080.

### Manual Web Deployment
```bash
cd web && npm run build
```
Serve `dist/` as static files behind any web server, proxying `/api/*` to the
backend (see `web/nginx.conf` for a working example).

### Mobile Deployment
`npx eas build --platform ios|android` (needs a configured EAS project),
then submit the resulting binary to the App Store / Google Play.

---

## API Reference

Base path: `/api`. Bearer-token endpoints require `Authorization: Bearer <token>`.

### Auth (public)
```
POST /api/auth/register
{ "email": "...", "password": "...", "firstName": "...", "lastName": "...",
  "phoneNumber": "...", "role": "USER" | "TECHNICIAN" }
→ { accessToken, refreshToken, userId, email, firstName, lastName, role }

POST /api/auth/login
{ "email": "...", "password": "..." }
→ same shape as register
# 400 if this account was created via Google/Apple sign-in (no password to check)

POST /api/auth/refresh
{ "refreshToken": "..." }
→ same shape as register (a fresh access/refresh pair)
# 401 if the refresh token is invalid/expired/for a suspended account

POST /api/auth/social/google
{ "idToken": "<a real Google-issued ID token>",
  "role": "USER" | "TECHNICIAN"   # only used the first time this identity signs up
}
→ same shape as register
# 400 if GOOGLE_OAUTH_CLIENT_ID isn't configured server-side

POST /api/auth/social/apple
{ "idToken": "<a real Apple-issued ID token>",
  "firstName": "...", "lastName": "...",  # only used on first sign-up; Apple
                                           # never puts a name in the token
  "role": "USER" | "TECHNICIAN"
}
→ same shape as register
# 400 if APPLE_OAUTH_CLIENT_ID/APPLE_OAUTH_BUNDLE_ID isn't configured server-side
```

### Public
```
GET /api/public/health           → "TechieFinder API is running"
GET /api/public/categories       → [{ id, name, slug, description, iconUrl }]
```

### Technicians
```
GET  /api/technicians/available?category=<slug>       (category optional)
GET  /api/technicians/nearby?latitude=&longitude=&radiusKm=
GET  /api/technicians/recommended?latitude=&longitude=&limit=10   (auth optional; see below)
GET  /api/technicians/{id}
GET  /api/technicians/{id}/services
GET  /api/technicians/me                                (auth: TECHNICIAN)
POST /api/technicians/create/{userId}                   (auth: TECHNICIAN|ADMIN)
PUT  /api/technicians/me/location                       (auth: TECHNICIAN)
POST /api/technicians/me/services                       (auth: TECHNICIAN)
GET  /api/technicians/me/services                       (auth: TECHNICIAN)

GET    /api/technicians/{id}/portfolio                  → [TechnicianPortfolioDto]
POST   /api/technicians/me/portfolio (multipart: image, title, description?, categorySlug?)
                                                          (auth: TECHNICIAN)
DELETE /api/technicians/me/portfolio/{itemId}           (auth: TECHNICIAN, ownership-checked)

GET    /api/technicians/{id}/certifications             → [TechnicianCertificationDto]
POST   /api/technicians/me/certifications (multipart: name, issuingOrganization,
        credentialId?, issueDate?, expiryDate?, certificateFile?)   (auth: TECHNICIAN)
DELETE /api/technicians/me/certifications/{certificationId}   (auth: TECHNICIAN, ownership-checked)
```
`/recommended` ranks available technicians by a transparent weighted score
(`matchScore` on the response) — rating, completion rate, proximity (if
lat/lon given), category match with the caller's past bookings (if
authenticated), and verification status. It is not a call to an external
ML/LLM API. Works for guests; personalizes further when authenticated.

### Bookings
```
POST  /api/bookings
{ "technicianId": 1, "scheduledDateTime": "2026-08-01T10:00:00",
  "serviceDescription": "...", "serviceAddress": "...", "city": "...",
  "state": "...", "estimatedPrice": 15000 }

GET   /api/bookings/{id}
GET   /api/bookings/my                    # as customer
GET   /api/bookings/technician/my         # as technician
PATCH /api/bookings/{id}/status
{ "status": "CONFIRMED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  "reason": "..." }   # reason only used for CANCELLED
```
`CONFIRMED`/`REJECTED`/`IN_PROGRESS`/`COMPLETED` may only be set by the
assigned technician; either party can `CANCEL`.

### Payments
```
POST /api/payments/bookings/{bookingId}/pay
# Settles instantly against a simulated wallet by default. If
# payment.gateway.provider (PAYMENT_GATEWAY_PROVIDER) names a real gateway
# AND its secret key is a real (non-placeholder) value, this instead
# initializes a real Paystack/Flutterwave transaction and returns
# { requiresRedirect: true, authorizationUrl, transactionReference } for the
# client to redirect to.

GET  /api/payments/my
GET  /api/payments/verify/{reference}          (auth) # finalizes a pending gateway payment
POST /api/payments/webhook/paystack            (public; verified via x-paystack-signature)
POST /api/payments/webhook/flutterwave         (public; verified via verif-hash)
```

### Ratings
```
POST /api/ratings
{ "bookingId": 1, "rating": 5, "review": "..." }   # only once per COMPLETED booking
GET  /api/ratings/technician/{id}
```

### Messaging
```
GET  /api/conversations/my
POST /api/conversations/with-technician/{technicianId}   # get-or-create
GET  /api/conversations/{id}/messages
POST /api/conversations/{id}/messages
{ "content": "..." }
```

### Notifications
```
GET   /api/notifications/my
GET   /api/notifications/my/unread-count
PATCH /api/notifications/{id}/read
```

### Admin (auth: ADMIN)
```
GET    /api/admin/stats
→ { totalUsers, totalCustomers, totalTechnicians, pendingTechnicianVerifications,
    totalBookings, pendingBookings, completedBookings, cancelledBookings,
    totalRevenue, totalRatings, averageRating }

GET    /api/admin/users                         → [UserDto]
PATCH  /api/admin/users/{id}/status
{ "active": false }   # suspends/reactivates a non-admin account

GET    /api/admin/technicians                   → [TechnicianDto]
PATCH  /api/admin/technicians/{id}/verification
{ "status": "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" }

GET    /api/admin/bookings                      → [BookingDto]
GET    /api/admin/ratings                       → [RatingDto]
DELETE /api/admin/ratings/{id}                   # removes a review, recalculates the technician's rating

GET    /api/admin/certifications                → [TechnicianCertificationDto]
PATCH  /api/admin/certifications/{id}/verification
{ "status": "PENDING" | "VERIFIED" | "REJECTED" }
```
A default admin (`admin@techiefinder.com` / `ChangeMe123!` in dev, override
via `ADMIN_EMAIL`/`ADMIN_PASSWORD`) is seeded on first startup by
`DataInitializer`. `POST /api/auth/register` rejects `"role": "ADMIN"` with a
403 — admin accounts can only be seeded or created by an existing admin.
A suspended account (`active: false`) is rejected at login with a 401.

### Error Responses
All errors return a consistent shape via `GlobalExceptionHandler`:
```json
{ "timestamp": "...", "status": 404, "message": "Technician not found", "fieldErrors": null }
```
`IllegalArgumentException` → 404, `IllegalStateException` → 409,
`SecurityException` → 403, bean validation failures → 400 (with
`fieldErrors`), bad credentials → 401, a database unique-constraint
violation → 409, anything else → 500 with a generic message (no stack traces
leaked to clients).

---

## Testing Strategy

### Backend
`mvn test` runs 14 classes / 48 tests:
- `TechieFinderApplicationTests` — Spring context loads
- `AuthControllerTest` (MockMvc) — register success/validation/duplicate-email,
  wrong-password login, unauthenticated access to a protected endpoint, guest
  read access to technician browsing endpoints
- `AdminControllerTest` (MockMvc) — default admin seeding/login, ADMIN
  self-registration is rejected, non-admins are rejected from `/api/admin/**`,
  stats/users/technicians/bookings/ratings listing, suspend/reactivate a user
  (and that a suspended user's login is rejected), admins can't suspend other
  admins, technician verification status updates
- `BookingFlowIntegrationTest` (MockMvc, full context) — the entire booking
  lifecycle from the API Reference section above, plus negative cases
  (wrong-role status update, double-pay, double-rate)
- `PaymentGatewayTest` / `PaymentGatewayFallbackTest` (MockMvc +
  `MockRestServiceServer`) — real Paystack checkout/verify/webhook flow against
  a faked (non-placeholder) secret key, and confirms the wallet-simulation
  fallback when the configured provider's key is still a placeholder
- `TechnicianPortfolioAndCertificationTest` (MockMvc, multipart) — photo/cert
  upload, ownership-checked deletion, unsupported file type rejection, admin
  certification verification
- `TechnicianRecommendationTest` (MockMvc) — guest read access, higher-rated
  technicians rank first, proximity affects the score when coordinates are given
- `DeliveryClientsDefaultConfigTest` / `EmailClientTest` / `SmsClientTest` /
  `NotificationServiceDeliveryTest` — push/email/SMS clients report
  unconfigured and no-op safely by default; flip to "configured" and actually
  attempt a send once real (non-placeholder) credentials are supplied, verified
  against a mocked `JavaMailSender` / `MockRestServiceServer` respectively
- `JwksIdTokenVerifierTest` — signs real JWTs with a locally-generated RSA
  key pair (standing in for Google's/Apple's actual signing keys) and a fake
  `JwkProvider`, exercising the real signature/issuer/audience verification
  logic without a network call to either provider
- `SocialLoginAndRefreshTest` (MockMvc, `@MockBean` verifier clients) —
  Google/Apple sign-in creates a new user on first login, reuses the same
  user on a second login with the same provider identity, links to an
  existing local account with the same email, returns 400 when not
  configured, Apple's client-supplied name is recorded on first sign-up,
  a social-only account's password login fails with a clear message, and
  `/api/auth/refresh` issues a new token pair (or 401 for an invalid/expired
  token or a suspended account)

Several of these tests configure a distinct Spring context (`@TestPropertySource`
overriding provider/credential properties), which is why each of those also
overrides `spring.datasource.url` to a random per-context H2 database name —
the base config points every context at the same *named* in-memory H2 database
(shared JVM-wide by design), so multiple differently-configured contexts would
otherwise race to create/drop the same schema.

### Mobile
`npm test` runs 8 suites / 38 tests (Jest + `@testing-library/react-native`):
`AuthContext` (session persistence, login/logout, social login, refresh-token
unlock, error surfacing), `LoginScreen`/`RegisterScreen` (validation, submit,
error handling, i18n strings), `GoogleSignInButton`/`AppleSignInButton`
(hidden when unconfigured, forwards the ID token, surfaces provider errors),
`biometricAuth` (hardware/enrollment checks, enable/disable, token rotation,
prompt-cancelled-returns-null), and `BiometricUnlockButton`/
`BiometricUnlockToggle` (visibility rules, wiring to the auth flow). Google's
`useIdTokenAuthRequest` and `expo-apple-authentication` are mocked globally
(`jest.setup.js`) since their real behavior depends on native platform code
Jest can't exercise meaningfully.

### Web
`npm test` runs 6 suites / 23 tests (Vitest + `@testing-library/react`):
`apiErrorMessage` (pure function), `AuthContext` (session persistence,
login/logout, social login), `ProtectedRoute` (auth + role-gating redirects),
`Login` page (submit, error display, social buttons hidden when unconfigured),
and `GoogleSignInButton`/`AppleSignInButton` (script-loading, credential
forwarding, error handling). CI (`.github/workflows/ci.yml`) runs these plus a
full production build (`tsc -b && vite build`) on every push.

The golden path plus every feature added this round was also verified with a
Playwright script driving the live backend + web dev server end-to-end:
registration, technician setup (location + service + portfolio photo +
certification), recommended-technician search, booking, wallet payment,
completion, rating, messaging, notifications, admin moderation (suspend/
reactivate a user, verify a technician, verify a certification), guest viewing
of portfolio/certifications, and the web language switcher.

---

## Known Limitations

- **Real payment gateway / push / email / SMS / Google / Apple need your own
  credentials** — each is fully implemented (real Paystack/Flutterwave HTTP
  integration, Firebase Admin SDK, JavaMailSender, Termii HTTP client, JWKS
  signature verification against Google's/Apple's real public keys) but
  degrades to a safe no-op/simulation, or hides its UI entirely, without real
  credentials configured. This is a deployment step, not a missing feature —
  see the README's "Configurable, requires your own credentials" section
- **Google/Apple sign-in and mobile biometric quick unlock haven't been
  exercised against a live Google/Apple account or a real device in this
  environment** — the JWT signature/issuer/audience verification, account
  linking, and refresh-token/SecureStore logic are covered by real tests
  (see Testing Strategy), but there's no substitute for a real Google Cloud/
  Apple Developer app registration and a physical device's Face ID/Touch ID/
  fingerprint sensor; do a manual pass with real credentials before depending
  on this in production
- **Admin dashboard moderation is basic** — reviews can only be removed
  outright (no flagging/reporting workflow), and there's no audit log of
  admin actions (suspensions, verification changes, deletions)
- **Mobile portfolio/certification upload has no UI yet** — the backend
  endpoints work (verified via the same tests/Playwright run as the web UI);
  only the web technician dashboard has the upload screens
- **Mobile translation covers only the login screen** — the web app has a
  full language switcher across Home/Login/Register; mobile's i18n
  infrastructure is wired up but only `LoginScreen` uses it so far
- **Recommendation ranking is heuristic, not ML** — a transparent weighted
  score (rating, completion rate, proximity, category match, verification),
  not a call to an external LLM/ML API (none is configured for this backend)
- **No schema migration tool** (Flyway/Liquibase) — see
  [Database Schema](#database-schema)
- **Docker Compose** config is validated but not run end-to-end in this
  environment (see [Deployment Guide](#deployment-guide))

---

## References

- Spring Boot: https://spring.io/projects/spring-boot
- React: https://react.dev/
- Expo: https://docs.expo.dev/
- Vite: https://vite.dev/
