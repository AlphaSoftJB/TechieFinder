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
- JWT-based authentication (register/login/refresh), BCrypt password hashing,
  role-based access control (`USER`/`TECHNICIAN`/`ADMIN`), plus Google/Apple
  sign-in (JWKS-verified ID tokens, account linking by email) once configured
  — a clear 400 without a configured client id, not a broken login
- Technician profiles, service offerings (category-linked), location + geo-radius
  + heuristic "recommended for you" search, category search
- Full booking lifecycle: create → confirm/reject → in-progress → complete,
  with ownership checks on every transition
- Payments: instant wallet settlement by default, or a real Paystack/
  Flutterwave checkout (initialize/verify/webhook) once configured
- Technician portfolio photo and certification upload, with admin verification
- Ratings (one per completed booking, technician's average recalculated
  automatically) and in-app messaging (conversations + messages)
- Notifications fired on booking/payment/rating/message events — in-app
  always, plus push (Firebase)/email (SMTP)/SMS (Termii) once configured
- Admin dashboard: platform stats, user suspension, technician/certification
  verification, booking oversight, review moderation
- A global exception handler mapping not-found/conflict/forbidden/validation
  errors to proper HTTP status codes, with unhandled exceptions actually logged
- **Status:** compiles, runs, and passes its test suite. Verified by hand
  (curl) and by automated integration tests covering the entire booking
  lifecycle, payment gateway flow, portfolio/certification upload,
  recommendation ranking, and social sign-in/refresh end-to-end.

### Web App (React 19 + Vite + Tailwind CSS 4)
- Home (categories + recommended technicians), Login, Register (both with
  Google/Apple sign-in buttons, hidden entirely unless a client id is
  configured), Search (category filter + "Near Me" geo search), Technician
  Profile (ratings, service offerings, portfolio, certifications, booking
  form, messaging), Dashboard (role-routed to user/technician/admin views),
  PaymentCallback, Conversation (messaging)
- Full i18next-based language switcher (English, Yorùbá, Igbo, Hausa)
- **Status:** builds cleanly (`tsc -b && vite build`), has a Vitest/RTL unit
  test suite, and was verified with a real, scripted browser session
  (Playwright) driving the entire golden path plus every feature above
  against the live backend — not just a compile check.

### Mobile App (React Native 0.81 + Expo 54)
- The same feature set as the web app, native: Login/Register (with a
  language switcher and Google/Apple sign-in), Home (recommended technicians),
  Search (device-location "Near Me"), Technician Profile (incl. portfolio/
  certifications, read-only), dashboards for both roles, Chat. Payment
  redirects to a real gateway checkout via `expo-web-browser` when one is
  configured. Face ID/Touch ID/fingerprint quick unlock, opt-in right after
  login or toggled from the account screen, backed by `expo-secure-store`'s
  OS-level (Keychain/Keystore) biometric gate on the stored refresh token.
- **Status:** installs, type-checks, and bundles cleanly via Metro
  (`expo export`). Its own test suite passes. Full interactive verification in
  a simulator/device wasn't possible in the sandboxed environment this was
  built in — that's the one gap in verification depth versus the web app,
  and it applies specifically to the Google/Apple sign-in flows and the
  biometric prompt itself (their surrounding logic is unit-tested; the real
  native sheets and the OS keychain need a physical device to fully confirm).
  Portfolio/certification *upload* has no mobile UI yet (web-only for now).

### Tests
- Backend: 48 tests across 14 classes (JUnit + MockMvc + MockRestServiceServer
  for the payment gateway/SMS clients + a mocked JavaMailSender for email +
  a real RSA-signed-JWT verification test for the Google/Apple JWKS logic),
  all passing
- Mobile: 38 tests across 8 suites (Jest + React Native Testing Library:
  `AuthContext`, `LoginScreen`, `RegisterScreen`, `GoogleSignInButton`,
  `AppleSignInButton`, `biometricAuth`, `BiometricUnlockButton`,
  `BiometricUnlockToggle`), all passing
- Web: 23 tests across 6 suites (Vitest + Testing Library: `apiErrorMessage`,
  `AuthContext`, `ProtectedRoute`, `Login`, `GoogleSignInButton`,
  `AppleSignInButton`), all passing; CI runs these plus a full production
  build on every push

### DevOps
- `backend/Dockerfile`, `web/Dockerfile` + `nginx.conf`, `docker-compose.yml`
  (MySQL + backend + web, incl. a persistent uploads volume), `.github/workflows/ci.yml`
  (backend/mobile/web, now including the web test suite), `.env.example` with
  variable names that actually match the code
- The Dockerfile/compose setup was validated via `docker compose config` and
  by confirming the exact Maven command the backend's Dockerfile runs
  succeeds — `docker compose up --build` itself hasn't been run in an
  environment with Docker Hub access; do that once before depending on it

---

## Not Yet Built

- Mobile: portfolio/certification upload UI (web already has it)
- Mobile: translation beyond the login screen
- Content moderation beyond outright review removal (flagging, reports)
- Real payment gateway / push / email / SMS / Google / Apple credentials are
  a deployment decision the operator makes, not a code gap — every
  integration is fully implemented and degrades to a safe no-op/simulation,
  or hides its UI, without them

---

## Project Statistics

These are actual counts as of this writing, not estimates.

### Backend
- **Java files:** 112 (~5,770 lines)
- **Controllers:** 12 &middot; **Services:** 23 &middot; **Repositories:** 14
- **Entities:** 18 &middot; **DTOs:** 28
- **Tests:** 14 test classes, 48 test methods

### Web
- **Source files:** 23 non-test (~2,590 lines) + 6 test suites, 23 test methods
- **Pages:** 12 (Home, Login, Register, Search, TechnicianProfile, Dashboard,
  UserDashboard, TechnicianDashboard, AdminDashboard, PaymentCallback,
  Conversation, NotFound)

### Mobile
- **Source files:** 20 non-test (~3,520 lines)
- **Screens:** 8 &middot; **Tests:** 8 test suites, 38 test methods

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
cd backend && mvn test   # 48 tests
cd mobile && npm test    # 38 tests
cd web && npm test       # 23 tests
cd web && npm run build  # type-checks + builds
```

---

## License

Copyright © 2026 TechieFinder. All rights reserved.

---

## Conclusion

The backend, web app, and mobile app all run and interoperate against real
data, covering the platform's core value: finding (or getting recommended) a
technician, booking them, paying, rating, and messaging, plus an admin
dashboard for platform oversight, portfolio/certification credibility
signals, multi-language support, Google/Apple sign-in, and (on mobile) Face
ID/Touch ID/fingerprint quick unlock. Real payment gateway calls, push/email/
SMS delivery, and social sign-in are fully implemented and wired up — they
just need an operator to supply real credentials to go live, which is a
deployment decision rather than a missing feature. The remaining gaps (mobile
upload UI for portfolio/certifications, mobile translation beyond the login
screen) are scoped and listed above, not hidden behind a blanket "production
ready" claim.

**Developed with ❤️ for Nigeria**
