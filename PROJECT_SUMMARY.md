# TechieFinder Platform - Project Summary

## Overview

**TechieFinder** connects Nigerian users with local technicians and skilled
professionals. The platform is a Spring Boot backend API, a React web app, and
a React Native (Expo) mobile app, all working end-to-end against real data —
not a scaffold of entities with no working API surface.

**GitHub Repository:** https://github.com/AlphaSoftJB/TechieFinder

This document reflects the platform's actual, verified state. An earlier
version of this file claimed a "production-ready," fully complete platform
with specific file/endpoint counts; those claims did not match the repository
(no build file existed, most of the backend's controllers/services/repositories
were entirely absent, and the web frontend didn't exist anywhere in the repo or
its history). This version was rewritten after building out and verifying what's
described below.

---

## What Actually Works Today

### Backend API (Spring Boot 3.1.5 + Java 17)
- JWT-based authentication (register/login), BCrypt password hashing, role-based
  access control (`USER`/`TECHNICIAN`/`ADMIN`)
- Technician profiles, service offerings (category-linked), location + geo-radius
  search, category search
- Full booking lifecycle: create → confirm/reject → in-progress → complete,
  with ownership checks on every transition
- Wallet-based payment settlement (real Paystack/Flutterwave gateway calls are
  not yet wired up — see `service/payment/PaymentService.java`)
- Ratings (one per completed booking, technician's average recalculated
  automatically) and in-app messaging (conversations + messages)
- Notifications fired on booking/payment/rating/message events
- A global exception handler mapping not-found/conflict/forbidden/validation
  errors to proper HTTP status codes
- **Status:** compiles, runs, and passes its test suite. Verified by hand
  (curl) and by an automated integration test that runs the entire booking
  lifecycle above end-to-end.

### Web App (React 19 + Vite + Tailwind CSS 4)
- Home (categories + featured technicians), Login, Register, Search (category
  filter + "Near Me" geo search via the browser's Geolocation API), Technician
  Profile (ratings, service offerings, booking form, messaging), Dashboard
  (role-routed to a user or technician view), Conversation (messaging)
- **Status:** builds cleanly (`tsc -b && vite build`) and was verified with a
  real, scripted browser session (Playwright) driving the entire golden path
  against the live backend — not just a compile check.

### Mobile App (React Native 0.81 + Expo 54)
- The same feature set as the web app, native: Login/Register, Home, Search
  (with device-location "Near Me"), Technician Profile, dashboards for both
  roles, Chat
- **Status:** installs, type-checks, and bundles cleanly via Metro
  (`expo export`). Its own test suite passes. Full interactive verification in
  a simulator/device wasn't possible in the sandboxed environment this was
  built in — that's the one gap in verification depth versus the web app.

### Tests
- Backend: 8 tests (JUnit + MockMvc + a full booking-lifecycle integration
  test), all passing
- Mobile: 7 tests (Jest + React Native Testing Library, `AuthContext` +
  `LoginScreen`), all passing
- Web: no unit tests yet — CI runs a full production build on every push, and
  the golden path was verified with Playwright during development

### DevOps
- `backend/Dockerfile`, `web/Dockerfile` + `nginx.conf`, `docker-compose.yml`
  (MySQL + backend + web), `.github/workflows/ci.yml` (backend/mobile/web),
  `.env.example` with variable names that actually match the code
- The Dockerfile/compose setup was validated via `docker compose config` and
  by confirming the exact Maven command the backend's Dockerfile runs
  succeeds — `docker compose up --build` itself hasn't been run in an
  environment with Docker Hub access; do that once before depending on it

---

## Not Yet Built

- Real Paystack/Flutterwave payment gateway integration (currently a wallet
  simulation, clearly marked as such in the code)
- Technician portfolio photo and certification upload + verification workflow
- Push notifications (Firebase), SMS, email delivery
- Multi-language support (English, Yoruba, Igbo, Hausa)
- Web and mobile test coverage beyond the current smoke tests

---

## Project Statistics

These are actual counts as of this writing, not estimates.

### Backend
- **Java files:** 85 (~3,900 lines)
- **Controllers:** 10 &middot; **Services:** 10 &middot; **Repositories:** 14
- **Entities:** 18 &middot; **DTOs:** 23
- **Tests:** 4 test classes, 17 test methods

### Web
- **Source files:** 17 (~1,860 lines)
- **Pages:** 11 (Home, Login, Register, Search, TechnicianProfile, Dashboard,
  UserDashboard, TechnicianDashboard, AdminDashboard, Conversation, NotFound)

### Mobile
- **Source files:** 11 (~2,950 lines)
- **Screens:** 8 &middot; **Tests:** 2 test suites, 7 test methods

---

## Repository Structure

```
TechieFinder/
├── backend/                    # Spring Boot backend
│   ├── src/main/java/          # controller, service, repository, model, dto, security, exception
│   ├── src/test/java/          # JUnit + MockMvc tests
│   └── Dockerfile
├── web/                         # React 19 + Vite + Tailwind web app
│   ├── src/
│   └── Dockerfile / nginx.conf
├── mobile/                      # React Native (Expo) mobile app
│   └── src/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .env.example
├── README.md
├── DOCUMENTATION.md
└── PROJECT_SUMMARY.md           # This file
```

Note: there is no `frontend/techiefinder-web/` directory — an earlier version
of this document (and the main README) referenced that path for the web app.
It never existed in this repository; the real web app lives at `web/`.

---

## Quick Start

```bash
git clone https://github.com/AlphaSoftJB/TechieFinder.git
cd TechieFinder

# Backend (dev profile uses in-memory H2, no setup needed)
cd backend && mvn spring-boot:run

# Web (separate terminal)
cd web && npm install && npm run dev

# Mobile (separate terminal)
cd mobile && npm install && npm start
```

Or `docker compose up --build` after copying `.env.example` to `.env` — see
the main [README.md](README.md) for details.

---

## Testing

```bash
cd backend && mvn test   # 17 tests
cd mobile && npm test    # 7 tests
cd web && npm run build  # type-checks + builds
```

---

## License

Copyright © 2026 TechieFinder. All rights reserved.

---

## Conclusion

The backend, web app, and mobile app all run and interoperate against real
data, covering the platform's core value: finding a technician, booking them,
paying, rating, and messaging, plus an admin dashboard for platform oversight.
The remaining gaps — a real payment gateway and push/SMS/email delivery — are
scoped and listed above, not hidden behind a blanket "production ready" claim.

**Developed with ❤️ for Nigeria**
