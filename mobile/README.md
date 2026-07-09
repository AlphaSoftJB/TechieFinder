# TechieFinder Mobile App

React Native (Expo) mobile app for iOS and Android.

## Status

All 8 screens are wired to the real backend (not stubs) and verified via
`npx tsc --noEmit` and a full Metro bundle export (`expo export`). Interactive
verification in an actual simulator/device wasn't possible in the sandboxed
environment this was built in — that's the one gap versus the web app, which
was verified with a real scripted browser session.

## Screens

| Screen | Notes |
|---|---|
| LoginScreen | Validation, error handling, loading state |
| RegisterScreen | Role selection (USER/TECHNICIAN), full validation |
| HomeScreen | Categories (from `/public/categories`), featured technicians |
| SearchScreen | Category filter chips + "Near Me" geo search (`expo-location`) |
| TechnicianProfileScreen | Ratings, service offerings, booking form, message button |
| UserDashboardScreen | Bookings (pay/cancel/rate), notifications |
| TechnicianDashboardScreen | Jobs (confirm/reject/start/complete), service area, service offerings, notifications |
| ChatScreen | Send/receive messages on a conversation |

## Technology Stack

- React Native 0.81, Expo ~54
- React Navigation 7 (Stack + Bottom Tabs)
- `@expo/vector-icons` (Ionicons), `expo-location`
- axios, `@react-native-async-storage/async-storage`
- React Context API for auth state

## Installation

```bash
cd mobile
npm install
```

## Running the App

```bash
npm start        # Expo dev server, scan the QR code with Expo Go
npm run ios       # iOS simulator (Mac only)
npm run android   # Android emulator
```

## Configuration

### Backend API URL

The app defaults to `http://localhost:8080/api` (works for the iOS
simulator). Override via `EXPO_PUBLIC_API_URL` for the Android emulator or a
physical device:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api npm start        # Android emulator
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api npm start    # physical device (your LAN IP)
```

### EAS project ID

`app.json`'s `extra.eas.projectId` is still a placeholder — set it to a real
project ID before running an EAS build.

## Project Structure

```
mobile/
├── App.tsx                    # Wraps RootNavigator in AuthProvider
├── app.json                   # Expo configuration (camera + location permissions)
├── src/
│   ├── screens/               # 8 screens, see table above
│   ├── navigation/RootNavigator.tsx
│   ├── contexts/AuthContext.tsx    # JWT session in AsyncStorage
│   └── services/api.ts             # axios client, bearer-token interceptor, 401 handler
└── assets/
```

## Authentication Flow

1. On launch, `AuthContext` reads a stored session from `AsyncStorage`
2. If present, the token is attached to `api.ts`'s axios instance and the
   user is routed straight to their role's dashboard
3. `POST /api/auth/login` or `/register` on submit; the response is persisted
   and the app re-renders as authenticated
4. A 401 response from any API call triggers an automatic logout

## Testing

```bash
npm test
```

7 tests (Jest + `@testing-library/react-native`): `AuthContext` (session
persistence, login/logout, error surfacing) and `LoginScreen` (validation,
submit, error handling).

Manual verification checklist for whoever next runs this in a real
simulator/device (not yet checked off in this environment):
- [ ] Login/register both roles
- [ ] Browse Home, filter Search by category and by "Near Me"
- [ ] View a technician profile, submit a booking
- [ ] Technician: confirm → start → complete a job
- [ ] Customer: pay, then rate the completed booking
- [ ] Exchange a chat message both directions
- [ ] Notifications reflect booking/payment/rating/message events

## Building for Production

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Troubleshooting

**Metro bundler acting up:** `npx expo start -c` (clears cache)

**API connection issues:** confirm the backend is running, and that you're
using `EXPO_PUBLIC_API_URL` (not `localhost`) when testing on the Android
emulator or a physical device — see [Configuration](#configuration)

## Not Yet Built

- Camera integration for portfolio photo uploads (permissions are declared
  in `app.json`; no screen uses the camera yet)
- Push notifications (Firebase) — notifications are in-app only today
- Offline mode / local caching

## License

Copyright © 2026 TechieFinder. All rights reserved.

## Support

- GitHub: https://github.com/AlphaSoftJB/TechieFinder
- Documentation: see the main [README.md](../README.md) and
  [DOCUMENTATION.md](../DOCUMENTATION.md) in the repository root

---

**Made with ❤️ in Nigeria**
