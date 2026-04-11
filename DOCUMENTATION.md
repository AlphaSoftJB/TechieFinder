# TechieFinder Platform - Complete Documentation

**Version:** 1.0.0  
**Last Updated:** February 2024  
**Author:** Manus AI

---

## Executive Summary

TechieFinder is a comprehensive platform designed for the Nigerian market that connects users with verified local technicians and skilled professionals. The platform consists of three main components: a Spring Boot backend API, a React web application, and React Native mobile applications for iOS and Android. The system features real-time location-based search, secure JWT authentication, booking management, rating systems, and technician portfolio management.

This document provides complete technical documentation covering architecture, API specifications, deployment procedures, and operational guidelines for the TechieFinder platform.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend API Documentation](#backend-api-documentation)
3. [Web Frontend Documentation](#web-frontend-documentation)
4. [Mobile App Documentation](#mobile-app-documentation)
5. [Database Schema](#database-schema)
6. [Authentication & Security](#authentication--security)
7. [Deployment Guide](#deployment-guide)
8. [API Reference](#api-reference)
9. [Testing Strategy](#testing-strategy)
10. [Maintenance & Operations](#maintenance--operations)

---

## System Architecture

### High-Level Overview

The TechieFinder platform follows a modern three-tier architecture with clear separation of concerns. The backend serves as a RESTful API provider built with Spring Boot and Java 17, managing all business logic, data persistence, and security. The frontend consists of two client applications: a responsive React web application for desktop and mobile browsers, and native mobile applications built with React Native and Expo for iOS and Android devices.

**Technology Stack:**

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Backend Framework | Spring Boot | 3.1.5 | RESTful API server |
| Backend Language | Java | 17 | Application logic |
| Database | MySQL | 8.0+ | Data persistence |
| Web Frontend | React | 19 | Web user interface |
| Web Styling | Tailwind CSS | 4 | UI styling |
| Mobile Framework | React Native | 0.73 | Mobile applications |
| Mobile Platform | Expo | 50 | Build and deployment |
| Authentication | JWT | - | Secure token-based auth |
| Build Tool | Maven | 3.8+ | Backend build management |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├──────────────────────┬──────────────────────────────────────┤
│   Web Application    │     Mobile Applications              │
│   (React + Tailwind) │   (React Native + Expo)             │
│   - User Interface   │   - iOS App                          │
│   - Technician UI    │   - Android App                      │
└──────────┬───────────┴───────────────┬──────────────────────┘
           │                           │
           │      HTTPS/REST API       │
           │                           │
┌──────────┴───────────────────────────┴──────────────────────┐
│                    Application Layer                         │
│              Spring Boot Backend (Port 8080)                 │
├──────────────────────────────────────────────────────────────┤
│  Controllers  │  Services  │  Security  │  Repositories     │
│  - Auth       │  - User    │  - JWT     │  - JPA/Hibernate  │
│  - User       │  - Tech    │  - CORS    │  - MySQL          │
│  - Technician │  - Booking │  - Roles   │                   │
│  - Booking    │  - Payment │            │                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────────┐
│                      Data Layer                              │
│                    MySQL Database                            │
├──────────────────────────────────────────────────────────────┤
│  Tables: users, technicians, bookings, payments, ratings,   │
│  messages, notifications, service_categories, etc.           │
└──────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**User Registration and Authentication Flow:**

The authentication process begins when a user submits registration credentials through either the web or mobile interface. The client application sends a POST request to the `/api/auth/register` endpoint with user details including email, password, first name, last name, phone number, and selected role (USER or TECHNICIAN). The backend AuthController receives this request and delegates processing to the AuthService, which validates the input data, checks for existing accounts with the same email, hashes the password using BCrypt, and creates a new user record in the database. Upon successful registration, the system generates a JWT access token containing the user's ID, email, and role, which is returned to the client along with user profile information. The client stores this token securely (in localStorage for web, AsyncStorage for mobile) and includes it in the Authorization header of all subsequent API requests.

**Technician Search and Booking Flow:**

When a user searches for technicians, the web or mobile client sends a GET request to `/api/technicians/available` with optional query parameters for filtering by service category, location, rating, and availability. The backend TechnicianController processes this request, applying filters through the TechnicianService which queries the database using JPA repositories with custom query methods. The service returns a list of matching technicians with their profiles, ratings, services offered, and current availability. When a user selects a technician and initiates a booking, the client sends a POST request to `/api/bookings` with booking details including technician ID, service type, preferred date and time, and location. The BookingService validates the request, checks technician availability, creates a booking record with PENDING status, and returns the booking confirmation to the client.

---

## Backend API Documentation

### Project Structure

The backend follows a standard Spring Boot layered architecture with clear separation between controllers, services, repositories, and models. The project is organized into functional packages corresponding to different business domains.

```
backend/
├── src/main/java/com/techiefinder/
│   ├── TechieFinderApplication.java          # Main application entry point
│   ├── config/
│   │   ├── SecurityConfig.java               # Spring Security configuration
│   │   ├── JpaConfig.java                    # JPA and auditing config
│   │   └── DataInitializer.java              # Initial data seeding
│   ├── security/
│   │   ├── JwtTokenProvider.java             # JWT token generation/validation
│   │   ├── JwtAuthenticationFilter.java      # JWT filter for requests
│   │   ├── CustomUserDetails.java            # UserDetails implementation
│   │   └── CustomUserDetailsService.java     # UserDetailsService impl
│   ├── model/
│   │   ├── BaseEntity.java                   # Base entity with audit fields
│   │   ├── user/
│   │   │   ├── User.java                     # User entity
│   │   │   ├── UserProfile.java              # User profile details
│   │   │   ├── UserAddress.java              # User addresses
│   │   │   └── UserPaymentMethod.java        # Payment methods
│   │   ├── technician/
│   │   │   ├── Technician.java               # Technician entity
│   │   │   ├── ServiceCategory.java          # Service categories
│   │   │   ├── TechnicianService.java        # Services offered
│   │   │   ├── TechnicianAvailability.java   # Availability schedule
│   │   │   ├── TechnicianLocation.java       # Location data
│   │   │   ├── TechnicianPortfolio.java      # Portfolio items
│   │   │   └── TechnicianCertification.java  # Certifications
│   │   ├── booking/
│   │   │   └── Booking.java                  # Booking entity
│   │   ├── payment/
│   │   │   └── Payment.java                  # Payment entity
│   │   ├── rating/
│   │   │   └── Rating.java                   # Rating/review entity
│   │   ├── messaging/
│   │   │   ├── Conversation.java             # Conversation entity
│   │   │   └── Message.java                  # Message entity
│   │   └── notification/
│   │       └── Notification.java             # Notification entity
│   ├── repository/
│   │   ├── user/                             # User repositories
│   │   ├── technician/                       # Technician repositories
│   │   ├── booking/                          # Booking repositories
│   │   ├── payment/                          # Payment repositories
│   │   ├── rating/                           # Rating repositories
│   │   ├── messaging/                        # Messaging repositories
│   │   └── notification/                     # Notification repositories
│   ├── service/
│   │   ├── auth/
│   │   │   └── AuthService.java              # Authentication service
│   │   ├── user/
│   │   │   └── UserService.java              # User management service
│   │   └── technician/
│   │       └── TechnicianService.java        # Technician service
│   ├── controller/
│   │   ├── auth/
│   │   │   └── AuthController.java           # Auth endpoints
│   │   ├── user/
│   │   │   └── UserController.java           # User endpoints
│   │   ├── technician/
│   │   │   └── TechnicianController.java     # Technician endpoints
│   │   └── publicapi/
│   │       └── PublicController.java         # Public endpoints
│   └── dto/
│       ├── auth/                             # Auth DTOs
│       ├── user/                             # User DTOs
│       ├── technician/                       # Technician DTOs
│       └── booking/                          # Booking DTOs
├── src/main/resources/
│   ├── application.properties                # Development config
│   └── application-prod.properties           # Production config
└── pom.xml                                   # Maven dependencies
```

### Core Dependencies

The backend relies on several key Spring Boot starters and third-party libraries to provide essential functionality.

**Spring Boot Starters:**

- `spring-boot-starter-web`: Provides embedded Tomcat server and RESTful web services support
- `spring-boot-starter-data-jpa`: JPA and Hibernate for database operations
- `spring-boot-starter-security`: Spring Security for authentication and authorization
- `spring-boot-starter-validation`: Bean validation with Hibernate Validator

**Security and Authentication:**

- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (version 0.11.5): JWT token generation and validation

**Database:**

- `mysql-connector-j`: MySQL JDBC driver for database connectivity

**Utilities:**

- `lombok`: Reduces boilerplate code with annotations

### Configuration

**Application Properties (Development):**

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/techiefinder?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
jwt.secret=your-secret-key-change-in-production-minimum-256-bits
jwt.expiration=86400000

# CORS Configuration
cors.allowed-origins=http://localhost:3000,http://localhost:3001
```

**Production Configuration:**

For production deployment, sensitive configuration values should be externalized using environment variables rather than hardcoded in property files. The production configuration file (`application-prod.properties`) should reference environment variables for database credentials, JWT secrets, and API keys.

---

## Web Frontend Documentation

### Technology Stack

The web frontend is built with modern React 19 and utilizes Tailwind CSS 4 for styling, providing a responsive and performant user interface. The application uses Wouter for client-side routing, shadcn/ui for pre-built accessible components, and Context API for state management.

**Key Libraries:**

| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| Tailwind CSS 4 | Utility-first styling |
| Wouter | Lightweight routing |
| shadcn/ui | Component library |
| Lucide React | Icon library |
| Sonner | Toast notifications |

### Project Structure

```
client/
├── public/
│   └── index.html                    # HTML template
├── src/
│   ├── App.tsx                       # Root component with routes
│   ├── main.tsx                      # Application entry point
│   ├── index.css                     # Global styles and Tailwind
│   ├── const.ts                      # App constants
│   ├── pages/
│   │   ├── Home.tsx                  # Landing page
│   │   ├── Login.tsx                 # Login page
│   │   ├── Register.tsx              # Registration page
│   │   ├── Search.tsx                # Technician search
│   │   ├── TechnicianProfile.tsx     # Technician detail page
│   │   ├── UserDashboard.tsx         # User dashboard
│   │   ├── TechnicianDashboard.tsx   # Technician dashboard
│   │   └── NotFound.tsx              # 404 page
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   └── ErrorBoundary.tsx         # Error handling
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Authentication state
│   │   └── ThemeContext.tsx          # Theme management
│   ├── lib/
│   │   └── api.ts                    # API client
│   └── hooks/                        # Custom React hooks
└── package.json                      # Dependencies
```

### Design System

The TechieFinder web application employs a Nigerian-inspired color scheme featuring green and orange tones that reflect the national flag colors, creating a sense of local identity and trust. The design follows a mobile-first responsive approach with careful attention to accessibility and user experience.

**Color Palette:**

- **Primary (Green)**: `#1B8B4D` - Used for primary actions, branding, and active states
- **Accent (Orange)**: `#F97316` - Used for highlights, ratings, and secondary actions
- **Background**: `#FAFAF9` - Soft off-white for main backgrounds
- **Muted**: `#F5F5F4` - Light gray for secondary backgrounds
- **Foreground**: `#0A0A0A` - Near-black for primary text

**Typography:**

The application uses system font stacks for optimal performance and native appearance across different operating systems. Headings use bold weights (700) while body text uses regular weight (400) for comfortable reading.

### Key Features

**Authentication System:**

The authentication system provides secure user registration and login with JWT token management. The AuthContext manages authentication state globally, storing tokens in localStorage and automatically including them in API requests. The system supports role-based access control with separate interfaces for regular users and technicians.

**Search and Discovery:**

The search page allows users to find technicians based on multiple criteria including service category, location, minimum rating, and availability. Filters can be applied dynamically without page reloads, and results update in real-time as users type in the search box. Each technician card displays key information including name, location, rating, years of experience, and offered services.

**Booking Workflow:**

Users can view detailed technician profiles with portfolio items, certifications, and customer reviews. The booking interface allows users to select preferred dates and times, specify service requirements, and submit booking requests. Technicians receive notifications of new booking requests and can accept or decline them from their dashboard.

**Dashboard Features:**

The user dashboard provides an overview of booking history, active appointments, saved addresses, and payment methods. Users can track booking status, view past services, and rate completed jobs. The technician dashboard displays job requests, earnings summary, performance metrics, and quick actions for managing services, availability, and portfolio.

---

## Mobile App Documentation

### Overview

The TechieFinder mobile applications for iOS and Android are built using React Native and Expo, sharing a single codebase while providing native performance and user experience on both platforms. The apps include camera integration for portfolio uploads, push notifications for real-time updates, and offline support with local data caching.

### Key Features

**Native Capabilities:**

- Camera access for capturing portfolio photos
- Image picker for selecting existing photos
- Push notifications for booking alerts
- Geolocation for finding nearby technicians
- Offline data persistence with AsyncStorage

**Navigation Structure:**

The mobile app uses React Navigation with a combination of stack and tab navigators. Unauthenticated users see login and registration screens, while authenticated users access the main tab navigator with different tabs based on their role (USER or TECHNICIAN).

### Development Setup

To run the mobile app in development mode, developers need Node.js 18 or higher, Expo CLI, and either Xcode (for iOS development on Mac) or Android Studio (for Android development). The Expo Go app can be installed on physical devices for quick testing without building native binaries.

**Installation Steps:**

1. Navigate to the mobile directory: `cd mobile`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Scan the QR code with Expo Go app on your device

### Building for Production

Production builds for iOS and Android can be created using Expo Application Services (EAS). The build process generates native binaries (IPA for iOS, AAB for Android) that can be submitted to the App Store and Google Play Store respectively.

---

## Database Schema

### Entity Relationship Overview

The database schema consists of multiple interconnected tables representing users, technicians, bookings, payments, ratings, messages, and notifications. The schema is designed to support the complete lifecycle of service discovery, booking, payment, and review processes.

### Core Tables

**Users Table:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | User first name |
| last_name | VARCHAR(100) | NOT NULL | User last name |
| phone_number | VARCHAR(20) | | Contact phone number |
| role | VARCHAR(20) | NOT NULL | USER or TECHNICIAN |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Technicians Table:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique technician identifier |
| user_id | BIGINT | FOREIGN KEY (users.id), UNIQUE | Reference to user account |
| bio | TEXT | | Professional biography |
| years_of_experience | INT | | Years of experience |
| average_rating | DECIMAL(3,2) | DEFAULT 0.00 | Average customer rating |
| total_ratings | INT | DEFAULT 0 | Total number of ratings |
| is_verified | BOOLEAN | DEFAULT FALSE | Verification status |
| is_available | BOOLEAN | DEFAULT TRUE | Current availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Profile creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Bookings Table:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique booking identifier |
| user_id | BIGINT | FOREIGN KEY (users.id) | Customer user ID |
| technician_id | BIGINT | FOREIGN KEY (technicians.id) | Technician ID |
| service_type | VARCHAR(100) | NOT NULL | Type of service |
| scheduled_date | DATE | NOT NULL | Scheduled service date |
| scheduled_time | TIME | NOT NULL | Scheduled service time |
| status | VARCHAR(20) | NOT NULL | PENDING, ACCEPTED, COMPLETED, CANCELLED |
| location | VARCHAR(255) | | Service location |
| description | TEXT | | Service description |
| estimated_cost | DECIMAL(10,2) | | Estimated cost |
| actual_cost | DECIMAL(10,2) | | Final cost |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Booking creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### Relationships

The database enforces referential integrity through foreign key constraints. A User can have one Technician profile (one-to-one relationship). A Technician can have multiple TechnicianServices, TechnicianPortfolio items, and TechnicianCertifications (one-to-many relationships). Bookings connect Users and Technicians in a many-to-many relationship through the booking table. Each Booking can have one Payment and one Rating.

---

## Authentication & Security

### JWT Token-Based Authentication

The platform implements stateless authentication using JSON Web Tokens (JWT). When a user successfully logs in, the server generates a signed JWT containing the user's ID, email, and role. This token is returned to the client and must be included in the Authorization header of all subsequent requests requiring authentication.

**Token Structure:**

- **Header**: Algorithm (HS256) and token type (JWT)
- **Payload**: User ID, email, role, issued at timestamp, expiration timestamp
- **Signature**: HMAC SHA-256 signature using secret key

**Token Lifecycle:**

Tokens are valid for 24 hours (86400000 milliseconds) by default. When a token expires, the client must re-authenticate by sending credentials to the login endpoint. The backend validates tokens on every protected endpoint request, checking the signature, expiration, and extracting user information for authorization decisions.

### Password Security

User passwords are never stored in plain text. During registration, passwords are hashed using BCrypt with a cost factor of 10, which provides strong protection against brute-force attacks. BCrypt automatically generates a unique salt for each password, ensuring that identical passwords produce different hashes.

### CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured to allow requests from the web frontend running on different ports during development. In production, CORS should be restricted to only allow requests from the deployed frontend domain.

### Role-Based Access Control

The system implements role-based access control with three primary roles: USER, TECHNICIAN, and ADMIN. Spring Security method-level security annotations (`@PreAuthorize`) protect controller endpoints, ensuring that only users with appropriate roles can access specific resources. For example, only users with the TECHNICIAN role can update technician profiles or manage service offerings.

---

## Deployment Guide

### Prerequisites

Before deploying the TechieFinder platform, ensure the following infrastructure and tools are available:

- **Server**: Linux server (Ubuntu 20.04+ recommended) with at least 2GB RAM and 20GB storage
- **Database**: MySQL 8.0+ server (can be on the same server or separate database server)
- **Java**: OpenJDK 17 installed on the server
- **Node.js**: Version 18+ for building the frontend
- **Domain**: Registered domain name with DNS configured
- **SSL Certificate**: SSL/TLS certificate for HTTPS (Let's Encrypt recommended)

### Backend Deployment

**Step 1: Build the Application**

On your development machine or CI/CD server, navigate to the backend directory and build the JAR file using Maven:

```bash
cd backend
mvn clean package -DskipTests
```

This produces an executable JAR file in the `target` directory named `techiefinder-backend-1.0.0.jar`.

**Step 2: Configure Production Database**

Create a production MySQL database and user:

```sql
CREATE DATABASE techiefinder_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'techiefinder'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON techiefinder_prod.* TO 'techiefinder'@'localhost';
FLUSH PRIVILEGES;
```

**Step 3: Set Environment Variables**

Create a production configuration file or set environment variables on the server:

```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:mysql://localhost:3306/techiefinder_prod
export DB_USERNAME=techiefinder
export DB_PASSWORD=strong_password_here
export JWT_SECRET=your-production-jwt-secret-minimum-256-bits
```

**Step 4: Deploy and Run**

Transfer the JAR file to the server and run it as a systemd service for automatic restart and management:

```bash
# Create service file
sudo nano /etc/systemd/system/techiefinder.service
```

Service file content:

```ini
[Unit]
Description=TechieFinder Backend Service
After=network.target

[Service]
Type=simple
User=techiefinder
WorkingDirectory=/opt/techiefinder
ExecStart=/usr/bin/java -jar /opt/techiefinder/techiefinder-backend-1.0.0.jar
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=techiefinder

Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DB_URL=jdbc:mysql://localhost:3306/techiefinder_prod"
Environment="DB_USERNAME=techiefinder"
Environment="DB_PASSWORD=strong_password_here"
Environment="JWT_SECRET=your-production-jwt-secret"

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable techiefinder
sudo systemctl start techiefinder
sudo systemctl status techiefinder
```

### Frontend Deployment

**Step 1: Build the Web Application**

Navigate to the frontend directory and build the production bundle:

```bash
cd frontend/techiefinder-web/client
npm install
npm run build
```

This creates an optimized production build in the `dist` directory.

**Step 2: Configure Web Server**

Install and configure Nginx as a reverse proxy:

```bash
sudo apt install nginx
```

Create Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend static files
    root /var/www/techiefinder/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Step 3: Deploy Frontend Files**

Copy the built files to the web server directory:

```bash
sudo mkdir -p /var/www/techiefinder/frontend
sudo cp -r dist/* /var/www/techiefinder/frontend/
sudo chown -R www-data:www-data /var/www/techiefinder
```

Restart Nginx:

```bash
sudo systemctl restart nginx
```

### Mobile App Deployment

**iOS Deployment:**

1. Build the iOS app using EAS: `eas build --platform ios`
2. Download the generated IPA file
3. Upload to App Store Connect using Transporter or Xcode
4. Complete App Store listing with screenshots, description, and metadata
5. Submit for Apple review

**Android Deployment:**

1. Build the Android app using EAS: `eas build --platform android`
2. Download the generated AAB (Android App Bundle) file
3. Create a Google Play Console account and app listing
4. Upload the AAB file to the Play Console
5. Complete store listing with screenshots, description, and metadata
6. Submit for Google Play review

### Post-Deployment Verification

After deployment, verify that all components are functioning correctly:

1. Access the web application at your domain and test user registration and login
2. Test technician search and profile viewing
3. Verify API endpoints are accessible and returning correct responses
4. Check database connections and data persistence
5. Monitor application logs for errors
6. Test mobile apps on physical devices

---

## API Reference

### Authentication Endpoints

**POST /api/auth/register**

Registers a new user account.

*Request Body:*
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+234 800 000 0000",
  "role": "USER"
}
```

*Response (201 Created):*
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  }
}
```

**POST /api/auth/login**

Authenticates a user and returns a JWT token.

*Request Body:*
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

*Response (200 OK):*
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  }
}
```

### Public Endpoints

**GET /api/public/categories**

Retrieves all service categories.

*Response (200 OK):*
```json
[
  {
    "id": 1,
    "name": "Plumbing",
    "slug": "plumbing",
    "description": "Plumbing installation, repair, and maintenance"
  },
  {
    "id": 2,
    "name": "Electrical",
    "slug": "electrical",
    "description": "Electrical wiring, repairs, and installations"
  }
]
```

### Technician Endpoints

**GET /api/technicians/available**

Retrieves available technicians with optional filtering.

*Query Parameters:*
- `category` (optional): Filter by service category slug
- `location` (optional): Filter by location
- `minRating` (optional): Minimum rating (0.0 to 5.0)

*Response (200 OK):*
```json
[
  {
    "id": 1,
    "firstName": "Chukwudi",
    "lastName": "Okonkwo",
    "email": "chukwudi@example.com",
    "phoneNumber": "+234 803 123 4567",
    "bio": "Professional plumber with 10 years experience",
    "yearsOfExperience": 10,
    "averageRating": 4.8,
    "totalRatings": 45,
    "isVerified": true,
    "isAvailable": true
  }
]
```

**GET /api/technicians/{id}**

Retrieves detailed information about a specific technician.

*Response (200 OK):*
```json
{
  "id": 1,
  "firstName": "Chukwudi",
  "lastName": "Okonkwo",
  "bio": "Professional plumber with 10 years experience",
  "yearsOfExperience": 10,
  "averageRating": 4.8,
  "totalRatings": 45,
  "services": [
    {
      "id": 1,
      "serviceName": "Plumbing Repair",
      "description": "General plumbing repairs",
      "priceRange": "₦5,000 - ₦20,000"
    }
  ],
  "portfolio": [
    {
      "id": 1,
      "title": "Residential Complex Plumbing",
      "description": "Complete plumbing installation",
      "imageUrl": "https://example.com/portfolio/1.jpg"
    }
  ],
  "certifications": [
    {
      "id": 1,
      "name": "Licensed Plumber",
      "issuer": "Nigerian Plumbing Association",
      "issueYear": 2015
    }
  ]
}
```

### Booking Endpoints

**POST /api/bookings**

Creates a new booking request.

*Request Headers:*
```
Authorization: Bearer {token}
```

*Request Body:*
```json
{
  "technicianId": 1,
  "serviceType": "Plumbing Repair",
  "scheduledDate": "2024-03-15",
  "scheduledTime": "10:00:00",
  "location": "123 Main Street, Lagos",
  "description": "Leaking pipe in kitchen",
  "estimatedCost": 15000.00
}
```

*Response (201 Created):*
```json
{
  "id": 1,
  "userId": 2,
  "technicianId": 1,
  "serviceType": "Plumbing Repair",
  "scheduledDate": "2024-03-15",
  "scheduledTime": "10:00:00",
  "status": "PENDING",
  "location": "123 Main Street, Lagos",
  "description": "Leaking pipe in kitchen",
  "estimatedCost": 15000.00,
  "createdAt": "2024-02-10T14:30:00Z"
}
```

**GET /api/bookings/user/{userId}**

Retrieves all bookings for a specific user.

*Request Headers:*
```
Authorization: Bearer {token}
```

*Response (200 OK):*
```json
[
  {
    "id": 1,
    "technicianName": "Chukwudi Okonkwo",
    "serviceType": "Plumbing Repair",
    "scheduledDate": "2024-03-15",
    "status": "PENDING",
    "estimatedCost": 15000.00
  }
]
```

---

## Testing Strategy

### Backend Testing

The backend includes comprehensive integration tests covering authentication, user management, technician operations, and booking workflows. Tests are written using JUnit 5 and Spring Boot Test framework with MockMvc for testing REST endpoints.

**Running Tests:**

```bash
cd backend
mvn test
```

**Test Coverage:**

- Authentication: User registration, login, token validation
- User Service: Profile management, address management, payment methods
- Technician Service: Profile creation, service management, availability updates
- Booking Service: Booking creation, status updates, cancellation
- Security: JWT token generation and validation, role-based access control

### Frontend Testing

Frontend tests use Jest and React Testing Library to test component rendering, user interactions, and integration with the API client.

**Running Tests:**

```bash
cd frontend/techiefinder-web/client
npm test
```

### End-to-End Testing

End-to-end testing should be performed manually or using tools like Cypress or Playwright to test complete user workflows including registration, login, technician search, booking creation, and payment processing.

---

## Maintenance & Operations

### Monitoring

Production deployments should include monitoring for application health, performance metrics, and error tracking. Recommended tools include:

- **Application Monitoring**: Spring Boot Actuator for health checks and metrics
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana) or cloud-based solutions
- **Error Tracking**: Sentry or similar error tracking service
- **Uptime Monitoring**: UptimeRobot or Pingdom for availability checks

### Backup Strategy

Regular database backups are critical for data protection and disaster recovery. Implement automated daily backups with retention policies:

```bash
# Daily MySQL backup script
#!/bin/bash
BACKUP_DIR="/var/backups/techiefinder"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u techiefinder -p techiefinder_prod > "$BACKUP_DIR/backup_$DATE.sql"
gzip "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### Security Updates

Regularly update dependencies to patch security vulnerabilities:

- Backend: Run `mvn versions:display-dependency-updates` to check for updates
- Frontend: Run `npm audit` to identify and fix vulnerabilities
- Server: Keep operating system and server software up to date with security patches

### Performance Optimization

Monitor application performance and optimize as needed:

- Database: Add indexes on frequently queried columns
- Caching: Implement Redis caching for frequently accessed data
- CDN: Use a CDN for static assets to reduce server load
- Database Connection Pooling: Configure HikariCP for optimal connection management

---

## Conclusion

The TechieFinder platform provides a comprehensive solution for connecting users with skilled technicians in Nigeria. This documentation covers all aspects of the system architecture, deployment, and operations. For additional support or questions, please refer to the project repository or contact the development team.

**Version History:**

- **1.0.0** (February 2024): Initial release with core features including authentication, technician search, booking management, and mobile applications.

---

## References

This documentation was created based on the TechieFinder platform implementation and industry best practices for Spring Boot, React, and React Native applications.
