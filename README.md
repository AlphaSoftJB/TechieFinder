# TechieFinder Platform

> **Connecting Nigerians with Skilled Local Technicians**

TechieFinder is a platform for the Nigerian market that connects users with local technicians and skilled professionals including plumbers, electricians, carpenters, mechanics, and more. The platform supports category and geo-radius technician search, booking, in-app messaging, ratings, and wallet-based payments, across a Spring Boot backend, a React web app, and a React Native mobile app.

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)

---

## Status

All three apps run and interoperate against a real backend today, verified end-to-end
(automated backend/mobile tests plus a full browser-driven walkthrough of the web app):
register → set up a technician (location + service offering) → category/geo search finds
them → book → confirm → pay → complete → rate → message → notifications fire throughout.

**Not yet implemented** (see [Roadmap](#roadmap)): real Paystack/Flutterwave gateway calls
(payments currently settle against a simulated wallet — see
`backend/.../service/payment/PaymentService.java`), push/SMS/email
delivery, technician portfolio/certification upload, and multi-language support.

---

## Features

### For Users
- **Search**: Find technicians by service category, or by location (geo-radius, via the browser/device's location)
- **Multi-Platform**: Web app and native mobile app (iOS & Android, via Expo)
- **Reviews & Ratings**: Rate a completed booking once; technician's average updates automatically
- **Booking**: Request a booking with a technician, track its status through completion
- **Messaging**: Message a technician directly, tied to their profile
- **Wallet Payments**: Settle a booking's payment instantly (real payment gateway integration not yet wired up)
- **Notifications**: In-app notifications for booking/payment/rating/message events

### For Technicians
- **Dashboard**: Confirm/reject/start/complete jobs, view stats
- **Service Offerings**: Declare what services you offer, under which category, at what price
- **Service Area**: Set your location and service radius so nearby customers can find you
- **Availability**: `available`/`acceptingJobs` flags control whether you show up in search

### For Admins
- **Dashboard**: Platform-wide stats (users, technicians, bookings, revenue, ratings)
- **User Management**: Suspend/reactivate any non-admin account
- **Technician Verification**: Approve, reject, or suspend a technician's verification status
- **Booking Oversight**: View every booking on the platform
- **Content Moderation**: View and remove reviews

A default admin account is seeded on first startup (`admin@techiefinder.com` /
`ChangeMe123!` in dev — override via `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Accounts
can never self-register with the `ADMIN` role; admins are seeded or created by
an existing admin only.

### Planned (not yet built)
- Content moderation beyond review removal (flagging, reports)
- Technician portfolio photos and certification upload + verification workflow
- Push notifications (Firebase), SMS, and email delivery
- Real payment gateway integration (Paystack/Flutterwave)
- Multi-language support (English, Yoruba, Igbo, Hausa)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
├──────────────────────┬──────────────────────────────────┤
│   Web Application    │    Mobile Application            │
│   (React + Tailwind) │    (React Native + Expo)         │
│   Port: 3000         │    iOS & Android                 │
└──────────┬───────────┴──────────────┬───────────────────┘
           │                          │
           │      REST API (JWT)      │
           │                          │
┌──────────┴──────────────────────────┴───────────────────┐
│              Backend API Server                          │
│           (Spring Boot + Java 17)                        │
│              Port: 8080                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│         MySQL 8 (prod) / H2 in-memory (dev)              │
│                   Port: 3306                             │
└──────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Backend
- Java 17+
- Maven 3.8+
- MySQL 8.0+ (**only for the `prod` profile** — the default dev profile uses an
  in-memory H2 database, so you can run the backend with zero external
  dependencies)

### Web
- Node.js 20+

### Mobile
- Node.js 20+
- Expo CLI (`npx expo`, no global install needed)
- Xcode (for iOS development, Mac only) or Android Studio (for Android)

### Docker (optional, for the full stack in containers)
- Docker with Compose v2

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AlphaSoftJB/TechieFinder.git
cd TechieFinder
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

That's it for local development — the default profile runs against an in-memory
H2 database and seeds 10 service categories on startup. The API is now available
at `http://localhost:8080`.

To run against real MySQL instead (the `prod` profile), see
[Environment Variables](#environment-variables) below, or use Docker Compose.

### 3. Web

```bash
cd web
npm install
npm run dev
```

Available at `http://localhost:3000`. The dev server proxies `/api` requests to
the backend on `:8080` automatically (see `web/vite.config.ts`) — no extra
configuration needed as long as the backend is running.

### 4. Mobile

```bash
cd mobile
npm install
npm start
```

Scan the QR code with the Expo Go app, or press `i`/`a` for a simulator/emulator.

By default the app points at `http://localhost:8080/api`, which works for the iOS
simulator. For the Android emulator or a physical device, set `EXPO_PUBLIC_API_URL`
before starting Expo (e.g. `10.0.2.2` for the Android emulator, or your machine's
LAN IP for a physical device):

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api npm start
```

### 5. Everything at once with Docker Compose

```bash
cp .env.example .env   # then fill in real secrets
docker compose up --build
```

Brings up MySQL, the backend (`prod` profile), and the web app (built and served
via nginx, which also proxies `/api` to the backend) — backend on `:8080`, web on
`:3000`. The mobile app isn't containerized (native/Expo tooling doesn't fit a
container the same way); run it locally as in step 4.

> **Note:** this compose setup was validated with `docker compose config` and by
> confirming the exact `mvn package` command the backend's Dockerfile runs
> succeeds and produces the jar the Dockerfile expects. It has not been run
> end-to-end (`docker compose up --build`) in an environment with Docker Hub
> access — do that once before relying on it for a real deployment.

---

## Project Structure

```
TechieFinder/
├── backend/                          # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/techiefinder/
│   │   │   │   ├── config/           # Security, JPA auditing config
│   │   │   │   ├── controller/       # REST controllers
│   │   │   │   ├── dto/              # Request/response DTOs
│   │   │   │   ├── exception/        # Global exception handler
│   │   │   │   ├── model/            # JPA entities
│   │   │   │   ├── repository/       # Spring Data repositories
│   │   │   │   ├── security/         # JWT filter/provider
│   │   │   │   └── service/          # Business logic
│   │   │   └── resources/
│   │   │       ├── application.properties       # dev (H2)
│   │   │       └── application-prod.properties  # prod (MySQL)
│   │   └── test/                     # JUnit + MockMvc tests
│   ├── Dockerfile
│   └── pom.xml
│
├── web/                               # React 19 + Vite + Tailwind web app
│   ├── src/
│   │   ├── pages/                    # Home, Login, Register, Search, ...
│   │   ├── components/               # Layout, ProtectedRoute
│   │   ├── contexts/                 # AuthContext
│   │   └── lib/                      # API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── mobile/                            # React Native (Expo) mobile app
│   ├── src/
│   │   ├── screens/                  # Screen components
│   │   ├── navigation/               # Navigation config
│   │   ├── contexts/                 # AuthContext
│   │   └── services/                 # API client
│   ├── App.tsx
│   ├── app.json                      # Expo configuration
│   └── package.json
│
├── .github/workflows/ci.yml           # Backend/mobile/web CI
├── docker-compose.yml                 # backend + MySQL + web
├── .env.example                       # Env vars matching the actual code
├── DOCUMENTATION.md                   # Deeper technical reference
├── README.md                          # This file
└── LICENSE
```

---

## Environment Variables

See `.env.example` at the repo root for the full list with defaults — these are
the actual variable names the code reads (`backend/src/main/resources/application-prod.properties`),
not aspirational names:

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | backend (prod) | MySQL connection |
| `JWT_SECRET` | backend | Token signing key — must be ≥64 bytes (HS512) |
| `CORS_ALLOWED_ORIGINS` | backend | Comma-separated allowed origins, defaults to `localhost:3000,5173,8080` |
| `FILE_UPLOAD_DIR` | backend | Upload directory (feature not yet implemented) |
| `PAYSTACK_*` / `FLUTTERWAVE_*` | backend | Reserved for real gateway integration (not yet wired up) |
| `EXPO_PUBLIC_API_URL` | mobile | Override the API base URL (emulator/device) |
| `VITE_API_URL` | web | Override the API base URL for a built (non-dev) bundle |

---

## Testing

### Backend

```bash
cd backend
mvn test
```

8 tests: application context loads, auth (register/login/validation/duplicate-email/
unauthenticated-access), and a full booking-lifecycle integration test (register →
technician setup → category/geo search → book → confirm → pay → complete → rate →
message → notifications).

### Mobile

```bash
cd mobile
npm test
```

7 tests covering `AuthContext` (session persistence, login/logout, error handling)
and `LoginScreen` (validation, submit, error handling).

### Web

No unit tests yet — CI runs a full production build (`npm run build`, which
type-checks via `tsc -b`) on every push. The golden path (registration through
booking, payment, rating, messaging, and notifications) has been verified with a
Playwright-driven browser session against the real backend during development.

---

## Building for Production

### Backend

```bash
cd backend
mvn clean package -DskipTests
# JAR file will be in target/techiefinder-backend-1.0.0.jar
```

### Web

```bash
cd web
npm run build
# Static files in dist/
```

### Mobile

```bash
cd mobile
npx eas build --platform ios
npx eas build --platform android
```
(Requires an Expo/EAS account and project configuration — `app.json`'s
`extra.eas.projectId` is still a placeholder.)

---

## Deployment

The fastest path is Docker Compose (see [above](#5-everything-at-once-with-docker-compose)).
For a manual deployment:

1. **Backend**: `mvn clean package`, run the jar with `SPRING_PROFILES_ACTIVE=prod`
   and the env vars from `.env.example` set, behind a reverse proxy with TLS.
2. **Web**: `npm run build`, serve `dist/` as static files (nginx, or any static
   host), proxying `/api` to the backend.
3. **Mobile**: build with EAS and submit to the App Store / Google Play.

---

## API Reference

All endpoints are under `/api`. Endpoints not listed as public require a
`Authorization: Bearer <token>` header.

**Auth** (public): `POST /auth/register`, `POST /auth/login`

**Public**: `GET /public/categories`, `GET /public/health`

**Technicians**: `GET /technicians/available?category=slug`, `GET /technicians/nearby?latitude=&longitude=&radiusKm=`,
`GET /technicians/{id}`, `GET /technicians/{id}/services`, `GET /technicians/me`,
`POST /technicians/create/{userId}`, `PUT /technicians/me/location`,
`POST /technicians/me/services`, `GET /technicians/me/services`

**Users**: `GET /users/{id}`, `GET /users/email/{email}` (admin only)

**Bookings**: `POST /bookings`, `GET /bookings/{id}`, `GET /bookings/my`,
`GET /bookings/technician/my`, `PATCH /bookings/{id}/status`

**Payments**: `POST /payments/bookings/{bookingId}/pay`, `GET /payments/my`

**Ratings**: `POST /ratings`, `GET /ratings/technician/{id}`

**Messaging**: `GET /conversations/my`, `POST /conversations/with-technician/{id}`,
`GET /conversations/{id}/messages`, `POST /conversations/{id}/messages`

**Notifications**: `GET /notifications/my`, `GET /notifications/my/unread-count`,
`PATCH /notifications/{id}/read`

See [DOCUMENTATION.md](DOCUMENTATION.md) for request/response shapes.

---

## Security

- **Authentication**: JWT (HS512), stateless sessions
- **Password Hashing**: BCrypt
- **CORS**: Configured via `cors.allowed.origins` (env-overridable), not hardcoded
- **SQL Injection**: Protected by JPA/Hibernate parameterized queries
- **XSS**: React escapes user input by default
- **Role-Based Access**: Spring Security method security (`USER`/`TECHNICIAN`/`ADMIN`)
- **Error Handling**: A global exception handler maps not-found/conflict/forbidden/
  validation errors to proper HTTP status codes instead of leaking stack traces

---

## Contributing

This is a proprietary project. Contributions are managed internally. For questions or suggestions, please contact the development team.

---

## License

Copyright © 2026 TechieFinder. All rights reserved.

This is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

---

## Team

Developed by the TechieFinder development team.

---

## Support

For technical support or questions:
- Email: support@techiefinder.com
- Documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

---

## Roadmap

### Done
- Backend: auth, technician profiles/search (category + geo-radius), booking
  lifecycle, wallet-based payments, ratings, messaging, notifications, global
  error handling
- Web app: full golden-path UI against the real backend
- Mobile app: full golden-path UI against the real backend
- Admin dashboard: stats, user suspension, technician verification, booking
  oversight, review moderation (backend + web UI)
- Tests: backend (JUnit/MockMvc), mobile (Jest/RNTL)
- DevOps: Dockerfiles, docker-compose, CI (backend/mobile/web)

### Next
- Real Paystack/Flutterwave gateway integration (currently a wallet simulation)
- Technician portfolio photos and certification upload/verification
- Push notifications (Firebase), SMS, email delivery
- Web/mobile unit and component test coverage beyond the current smoke tests

### Later
- Multi-language support (English, Yoruba, Igbo, Hausa)
- AI-powered technician recommendations

---

## Acknowledgments

- Spring Boot team for the excellent framework
- React and React Native communities
- Expo team for simplifying mobile development
- Nigerian technicians and users who inspired this platform

---

**Made with ❤️ in Nigeria**
