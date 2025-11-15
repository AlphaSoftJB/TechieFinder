# TechieFinder Mobile App

React Native mobile application for iOS and Android built with Expo.

## Features

- **Cross-platform**: Single codebase for iOS and Android
- **Authentication**: Login and registration with JWT tokens
- **Search & Discovery**: Find technicians by service, location, and rating
- **Booking System**: Schedule appointments with technicians
- **Camera Integration**: Upload portfolio photos (technicians)
- **Push Notifications**: Real-time job alerts and booking updates
- **Offline Support**: AsyncStorage for local data persistence

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (Mac only)
- For Android: Android Studio with Android SDK
- Expo Go app on your mobile device (for testing)

## Installation

```bash
cd mobile
npm install
```

## Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Testing on Physical Device

1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Run `npm start` on your computer
3. Scan the QR code with Expo Go app

## Project Structure

```
mobile/
├── App.tsx                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── assets/                # Images, fonts, icons
├── src/
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── TechnicianProfileScreen.tsx
│   │   ├── UserDashboardScreen.tsx
│   │   └── TechnicianDashboardScreen.tsx
│   ├── components/       # Reusable components
│   ├── navigation/       # Navigation configuration
│   │   └── RootNavigator.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── services/         # API clients
│   │   └── api.ts
│   └── utils/           # Utility functions
```

## Configuration

### Backend API URL

Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Push Notifications

1. Configure Firebase Cloud Messaging for Android
2. Configure APNs for iOS
3. Update `app.json` with notification settings

## Building for Production

### Android APK

```bash
expo build:android -t apk
```

### Android App Bundle (for Play Store)

```bash
expo build:android -t app-bundle
```

### iOS

```bash
expo build:ios
```

## Key Dependencies

- **expo**: ~50.0.0 - Framework for React Native apps
- **react-navigation**: ^6.x - Navigation library
- **expo-camera**: ~14.0.0 - Camera access for portfolio photos
- **expo-image-picker**: ~14.7.0 - Image selection from gallery
- **expo-notifications**: ~0.27.0 - Push notifications
- **@react-native-async-storage/async-storage**: 1.21.0 - Local storage
- **axios**: ^1.6.0 - HTTP client

## Features Implementation Status

### Completed
- ✅ Project structure and configuration
- ✅ Authentication flow (Login/Register)
- ✅ Navigation (Stack + Tab navigators)
- ✅ API client with JWT authentication
- ✅ AuthContext for state management

### In Progress
- 🔄 Screen implementations (Home, Search, Dashboards)
- 🔄 Camera integration for portfolio uploads
- 🔄 Push notifications setup

### Planned
- ⏳ Real-time messaging
- ⏳ Payment integration
- ⏳ Offline mode with data sync
- ⏳ Map integration for location services

## Testing

```bash
# Run tests (when implemented)
npm test
```

## Deployment

### Expo Application Services (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all
```

### App Store Submission (iOS)

1. Build with `eas build --platform ios`
2. Download IPA file
3. Upload to App Store Connect via Transporter
4. Submit for review

### Google Play Submission (Android)

1. Build with `eas build --platform android`
2. Download AAB file
3. Upload to Google Play Console
4. Submit for review

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache
expo start -c
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules
npm install
```

## License

Copyright © 2024 TechieFinder. All rights reserved.
