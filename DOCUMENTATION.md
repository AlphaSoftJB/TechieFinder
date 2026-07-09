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
`actuator`. Plus: `h2` (dev, runtime), `mysql-connector-j` (prod, runtime),
`jjwt-api`/`jjwt-impl`/`jjwt-jackson` 0.11.5, `lombok`, `spring-boot-starter-test`
+ `spring-security-test` (test scope).

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
```

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
React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7, axios.

### Project Structure
```
web/src/
├── pages/            # Home, Login, Register, Search, TechnicianProfile,
│                       Dashboard, UserDashboard, TechnicianDashboard,
│                       Conversation, NotFound
├── components/       # Layout (nav + outlet), ProtectedRoute
├── contexts/          # AuthContext (JWT in localStorage)
└── lib/api.ts         # axios instance, bearer-token interceptor, 401 handler
```

### Key Behavior
- Dev server (`npm run dev`, port 3000) proxies `/api/*` to `localhost:8080`
  via `vite.config.ts` — no CORS issues in local dev
- A built bundle can point at a different backend host via `VITE_API_URL`
- Category search and "Near Me" geo-radius search both call the same
  `GET /technicians/available` / `GET /technicians/nearby` endpoints the
  mobile app uses
- Same `AuthContext`/`api.ts` shape as the mobile app, deliberately, so the
  two clients' behavior stays in sync as the API evolves

---

## Mobile App Documentation

### Overview
Expo-managed React Native app (Expo 54, React Native 0.81, React 19).

### Key Features
Login/Register, Home (categories + featured technicians), Search (category +
device-location "Near Me" via `expo-location`), Technician Profile (ratings,
service offerings, booking form, messaging), role-routed dashboards, Chat.

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

- **User** ↔ UserProfile (1:1), UserAddress (1:N), UserPaymentMethod (1:N)
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

---

## Authentication & Security

### JWT Token-Based Authentication
- HS512-signed tokens via `io.jsonwebtoken` (jjwt 0.11.5)
- `JwtAuthenticationFilter` runs once per request, validates the bearer token,
  and populates the Spring Security context via `CustomUserDetailsService`
- Access token expiry: 24h (`jwt.expiration`, ms); refresh token: 7d
  (`jwt.refresh.expiration`) — both configurable via env vars

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
GET  /api/technicians/{id}
GET  /api/technicians/{id}/services
GET  /api/technicians/me                                (auth: TECHNICIAN)
POST /api/technicians/create/{userId}                   (auth: TECHNICIAN|ADMIN)
PUT  /api/technicians/me/location                       (auth: TECHNICIAN)
POST /api/technicians/me/services                       (auth: TECHNICIAN)
GET  /api/technicians/me/services                       (auth: TECHNICIAN)
```

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
POST /api/payments/bookings/{bookingId}/pay   # settles against a simulated wallet
GET  /api/payments/my
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
`mvn test` runs 3 classes / 8 tests:
- `TechieFinderApplicationTests` — Spring context loads
- `AuthControllerTest` (MockMvc) — register success/validation/duplicate-email,
  wrong-password login, unauthenticated access to a protected endpoint
- `BookingFlowIntegrationTest` (MockMvc, full context) — the entire booking
  lifecycle from the API Reference section above, plus negative cases
  (wrong-role status update, double-pay, double-rate)

### Mobile
`npm test` runs 2 suites / 7 tests (Jest + `@testing-library/react-native`):
`AuthContext` (session persistence, login/logout, error surfacing) and
`LoginScreen` (validation, submit, error handling).

### Web
No unit tests yet. CI (`.github/workflows/ci.yml`) runs a full production
build (`tsc -b && vite build`) on every push, which catches type errors and
build breakage. The golden path was verified manually with a Playwright
script during development, driving two concurrent browser sessions (customer
+ technician) through registration, technician setup, search, booking,
payment, completion, rating, messaging, and notifications against the live
backend.

---

## Known Limitations

- **Payments** settle against a simulated wallet, not Paystack/Flutterwave —
  `PaymentService`'s docstring flags exactly where to swap in a real gateway
  call once API keys are available
- **No admin dashboard** — `ADMIN` role exists in the data model and security
  config but has no dedicated UI or endpoints beyond what `USER`/`TECHNICIAN`
  already expose
- **No push/SMS/email delivery** — notifications are in-app (DB-backed) only;
  the `sentViaPush`/`sentViaEmail`/`sentViaSms` fields on `Notification` exist
  but nothing sets them to `true` via an actual delivery channel
- **No technician portfolio/certification upload UI** — the entities and
  repositories exist; no controller/service/screen uses them yet
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
