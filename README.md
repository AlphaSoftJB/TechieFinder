# TechieFinder Platform

> **Connecting Nigerians with Skilled Local Technicians**

TechieFinder is a comprehensive platform designed for the Nigerian market that connects users with verified local technicians and skilled professionals including plumbers, electricians, carpenters, mechanics, and more. The platform features real-time location-based search, secure communication, rating systems, appointment booking, and technician portfolio management.

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)

---

## 🚀 Features

### For Users
- **🔍 Smart Search**: Find technicians by service type, location, rating, and availability
- **📱 Multi-Platform**: Access via web browser or native mobile apps (iOS & Android)
- **⭐ Reviews & Ratings**: Read authentic reviews from other customers
- **📅 Easy Booking**: Schedule appointments with preferred technicians
- **💬 Secure Messaging**: Communicate directly with technicians
- **💳 Multiple Payment Options**: Pay securely with various methods
- **📍 Location-Based**: Find technicians near you with map integration

### For Technicians
- **📊 Professional Dashboard**: Manage your business from one place
- **🎯 Job Management**: Accept, track, and complete service requests
- **💼 Portfolio Showcase**: Display your work with photos and descriptions
- **📜 Certifications**: Upload and display professional certifications
- **📈 Analytics**: Track earnings, ratings, and performance metrics
- **⏰ Availability Management**: Set your working hours and days
- **📸 Camera Integration**: Capture and upload work photos directly from mobile app

### For Administrators
- **👥 User Management**: Manage user accounts and permissions
- **✅ Verification System**: Verify technician credentials and certifications
- **📊 Platform Analytics**: Monitor platform usage and performance
- **🛡️ Content Moderation**: Review and moderate user-generated content

---

## 🏗️ Architecture

The platform consists of three main components:

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
├──────────────────────┬──────────────────────────────────┤
│   Web Application    │    Mobile Applications           │
│   (React + Tailwind) │    (React Native + Expo)        │
│   Port: 3000         │    iOS & Android                 │
└──────────┬───────────┴──────────────┬───────────────────┘
           │                          │
           │      REST API (HTTPS)    │
           │                          │
┌──────────┴──────────────────────────┴───────────────────┐
│              Backend API Server                          │
│           (Spring Boot + Java 17)                        │
│              Port: 8080                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                  MySQL Database                          │
│                   Port: 3306                             │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Backend
- Java 17 or higher
- Maven 3.8+
- MySQL 8.0+

### Web Frontend
- Node.js 18+
- npm or yarn

### Mobile Apps
- Node.js 18+
- Expo CLI
- Xcode (for iOS development, Mac only)
- Android Studio (for Android development)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/TechieFinder.git
cd TechieFinder
```

### 2. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE techiefinder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'techiefinder'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON techiefinder.* TO 'techiefinder'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Backend Setup

```bash
cd backend

# Update application.properties with your database credentials
nano src/main/resources/application.properties

# Build and run
mvn clean install
mvn spring-boot:run
```

The backend API will be available at `http://localhost:8080`

### 4. Web Frontend Setup

```bash
cd frontend/techiefinder-web/client

# Install dependencies
npm install

# Update API base URL in src/lib/api.ts if needed

# Start development server
npm run dev
```

The web application will be available at `http://localhost:3000`

### 5. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Update API base URL in src/services/api.ts

# Start Expo development server
npm start

# Scan QR code with Expo Go app on your device
# Or press 'i' for iOS simulator, 'a' for Android emulator
```

---

## 📁 Project Structure

```
TechieFinder/
├── backend/                    # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/techiefinder/
│   │   │   │   ├── config/           # Configuration classes
│   │   │   │   ├── controller/       # REST controllers
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   ├── model/            # JPA entities
│   │   │   │   ├── repository/       # JPA repositories
│   │   │   │   ├── security/         # Security & JWT
│   │   │   │   └── service/          # Business logic
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                     # Unit & integration tests
│   └── pom.xml                       # Maven dependencies
│
├── frontend/                   # Web frontend (managed separately)
│   └── techiefinder-web/
│       └── client/
│           ├── src/
│           │   ├── pages/            # Page components
│           │   ├── components/       # Reusable components
│           │   ├── contexts/         # React contexts
│           │   ├── lib/              # Utilities & API client
│           │   └── App.tsx           # Root component
│           └── package.json
│
├── mobile/                     # React Native mobile apps
│   ├── src/
│   │   ├── screens/                  # Screen components
│   │   ├── components/               # Reusable components
│   │   ├── navigation/               # Navigation config
│   │   ├── contexts/                 # React contexts
│   │   └── services/                 # API client
│   ├── App.tsx                       # Root component
│   ├── app.json                      # Expo configuration
│   └── package.json
│
├── DOCUMENTATION.md            # Comprehensive technical docs
├── README.md                   # This file
└── LICENSE                     # License information
```

---

## 🔑 Environment Variables

### Backend (`backend/src/main/resources/application.properties`)

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/techiefinder
spring.datasource.username=techiefinder
spring.datasource.password=your_password

# JWT
jwt.secret=your-secret-key-minimum-256-bits
jwt.expiration=86400000

# CORS
cors.allowed-origins=http://localhost:3000
```

### Frontend (`frontend/techiefinder-web/client/src/lib/api.ts`)

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

### Mobile (`mobile/src/services/api.ts`)

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
mvn test
```

### Frontend Tests

```bash
cd frontend/techiefinder-web/client
npm test
```

---

## 📦 Building for Production

### Backend

```bash
cd backend
mvn clean package -DskipTests
# JAR file will be in target/techiefinder-backend-1.0.0.jar
```

### Web Frontend

```bash
cd frontend/techiefinder-web/client
npm run build
# Production files will be in dist/
```

### Mobile Apps

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## 🚀 Deployment

### Backend Deployment

1. Build the JAR file: `mvn clean package`
2. Transfer to server
3. Set up systemd service (see DOCUMENTATION.md)
4. Configure production database
5. Set environment variables
6. Start service: `sudo systemctl start techiefinder`

### Frontend Deployment

1. Build production bundle: `npm run build`
2. Deploy to web server (Nginx, Apache, or cloud hosting)
3. Configure reverse proxy for API requests
4. Set up SSL certificate

### Mobile App Deployment

1. Build with EAS: `eas build --platform all`
2. Download IPA (iOS) and AAB (Android) files
3. Submit to App Store and Google Play Store

Detailed deployment instructions are available in [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Public Endpoints

- `GET /api/public/categories` - Get all service categories
- `GET /api/technicians/available` - Get available technicians

### Protected Endpoints (Require JWT Token)

- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/{userId}` - Get user bookings
- `GET /api/technicians/{id}` - Get technician details
- `PUT /api/technicians/{id}` - Update technician profile

Complete API documentation is available in [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 🛡️ Security

- **Authentication**: JWT token-based authentication
- **Password Hashing**: BCrypt with salt
- **HTTPS**: All production traffic over HTTPS
- **CORS**: Configured to allow only trusted origins
- **SQL Injection**: Protected by JPA/Hibernate parameterized queries
- **XSS**: React automatically escapes user input
- **Role-Based Access**: Spring Security with role-based authorization

---

## 🤝 Contributing

This is a proprietary project. Contributions are managed internally. For questions or suggestions, please contact the development team.

---

## 📄 License

Copyright © 2024 TechieFinder. All rights reserved.

This is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

---

## 👥 Team

Developed by the TechieFinder development team.

---

## 📞 Support

For technical support or questions:
- Email: support@techiefinder.com
- Documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

---

## 🗺️ Roadmap

### Phase 1 (Completed)
- ✅ Backend API with authentication
- ✅ Web frontend with search and booking
- ✅ Mobile app structure
- ✅ Database schema

### Phase 2 (In Progress)
- 🔄 WebSocket real-time notifications
- 🔄 Payment integration (Paystack/Flutterwave)
- 🔄 Advanced geolocation search
- 🔄 Mobile app complete implementation

### Phase 3 (Planned)
- ⏳ Admin dashboard
- ⏳ Analytics and reporting
- ⏳ SMS notifications
- ⏳ Multi-language support (English, Yoruba, Igbo, Hausa)
- ⏳ AI-powered technician recommendations

---

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React and React Native communities
- Expo team for simplifying mobile development
- Nigerian technicians and users who inspired this platform

---

**Made with ❤️ in Nigeria**
