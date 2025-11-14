# TechieFinder

**TechieFinder** is a comprehensive platform connecting users with verified local technicians and skilled professionals across Nigeria. The platform includes a Spring Boot backend API, React web application, and is designed for future React Native mobile apps.

![TechieFinder](https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop)

## 🌟 Features

### For Users
- **Find Skilled Technicians**: Search and browse verified professionals by service category, location, and ratings
- **Easy Booking**: Schedule appointments with technicians at your convenience
- **Secure Payments**: Integrated payment processing with Paystack and Flutterwave
- **Rate & Review**: Share your experience and help others make informed decisions
- **Real-time Messaging**: Communicate directly with technicians
- **Track Bookings**: Monitor your service requests from booking to completion

### For Technicians
- **Professional Profile**: Showcase your skills, certifications, and portfolio
- **Manage Services**: List your services with pricing and availability
- **Job Management**: Accept, track, and complete service requests
- **Earnings Dashboard**: Monitor your income and transaction history
- **Build Reputation**: Receive ratings and reviews from satisfied customers
- **Location-based Visibility**: Get discovered by customers in your service area

### For Administrators
- **Platform Management**: Oversee users, technicians, and service categories
- **Verification System**: Approve and verify technician credentials
- **Analytics Dashboard**: Track platform performance and user engagement
- **Content Management**: Manage service categories and platform content

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.1.5 with Java 17
- **Database**: MySQL (Production) / H2 (Development)
- **Authentication**: JWT-based authentication with refresh tokens
- **Security**: Spring Security with role-based access control
- **API Documentation**: OpenAPI/Swagger
- **Caching**: Redis for performance optimization
- **File Storage**: AWS S3 for images and documents

### Frontend (React)
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom Nigerian-inspired theme
- **UI Components**: shadcn/ui component library
- **State Management**: React Context API
- **Routing**: Wouter for lightweight routing
- **Forms**: Native form handling with validation
- **HTTP Client**: Fetch API with custom wrapper

### Mobile (Planned)
- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit
- **Push Notifications**: Firebase Cloud Messaging
- **Maps**: Google Maps SDK

## 📋 Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 18+** and pnpm
- **MySQL 8.0+** (for production)
- **Git**

## 🚀 Getting Started

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/TechieFinder.git
   cd TechieFinder/backend
   ```

2. **Configure database**
   
   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/techiefinder
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Build and run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   The API will be available at `http://localhost:8080`

4. **Access API documentation**
   
   Open `http://localhost:8080/swagger-ui.html` in your browser

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend/techiefinder-web
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure API endpoint**
   
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

   The web app will be available at `http://localhost:3000`

## 🗄️ Database Schema

### Core Entities

- **Users**: User accounts with authentication
- **Technicians**: Technician profiles linked to user accounts
- **Service Categories**: Categories of services (Plumbing, Electrical, etc.)
- **Technician Services**: Services offered by technicians
- **Bookings**: Service booking requests
- **Payments**: Payment transactions
- **Ratings**: User reviews and ratings
- **Messages**: Direct messaging between users and technicians
- **Notifications**: System notifications

## 🔐 Authentication

The platform uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login**: Users receive an access token and refresh token
2. **Access Token**: Short-lived token (24 hours) for API requests
3. **Refresh Token**: Long-lived token (7 days) for obtaining new access tokens
4. **Authorization Header**: `Authorization: Bearer <access_token>`

### API Endpoints

#### Public Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/public/categories` - List service categories
- `GET /api/public/health` - Health check

#### Protected Endpoints
- `GET /api/users/{id}` - Get user profile
- `GET /api/technicians/available` - List available technicians
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{id}` - Get booking details

## 🎨 Design System

The platform uses a Nigerian-inspired color scheme:

- **Primary (Green)**: `#1B8B4D` - Representing growth and trust
- **Accent (Orange)**: `#FF8C42` - Representing energy and warmth
- **Typography**: 
  - Headings: Poppins
  - Body: Inter

## 📱 Service Categories

1. **Plumbing** - Pipe repairs, installations, drainage
2. **Electrical** - Wiring, repairs, installations
3. **Carpentry** - Furniture, woodwork, repairs
4. **Auto Mechanic** - Vehicle repairs and maintenance
5. **HVAC** - Air conditioning and ventilation
6. **Painting** - Interior and exterior painting
7. **Welding** - Metal fabrication and repairs
8. **Cleaning** - Home and office cleaning
9. **Appliance Repair** - Home appliance servicing
10. **Generator Repair** - Generator maintenance and repair

## 🔧 Development

### Backend Development

```bash
# Run tests
mvn test

# Build for production
mvn clean package -DskipTests

# Run with production profile
java -jar target/techiefinder-backend-1.0.0.jar --spring.profiles.active=prod
```

### Frontend Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linting
pnpm lint
```

## 🚢 Deployment

### Backend Deployment (AWS EC2)

1. Launch EC2 instance (Ubuntu 22.04)
2. Install Java 17 and MySQL
3. Configure security groups (ports 8080, 3306)
4. Upload JAR file
5. Run with systemd service

### Frontend Deployment

The web frontend can be deployed to:
- **Vercel** (Recommended)
- **Netlify**
- **AWS S3 + CloudFront**
- **Any static hosting service**

## 📊 Future Enhancements

- [ ] React Native mobile applications (iOS & Android)
- [ ] Real-time notifications via WebSocket
- [ ] Advanced analytics dashboard
- [ ] Payment wallet system
- [ ] Multi-language support (English, Yoruba, Hausa, Igbo)
- [ ] Video call support for consultations
- [ ] Subscription plans for technicians
- [ ] Referral program
- [ ] In-app chat with file sharing

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Spring Boot community
- React and shadcn/ui teams
- Nigerian tech ecosystem
- All contributors and testers

## 📞 Support

For support, email support@techiefinder.com or join our Slack channel.

## 🔗 Links

- [API Documentation](http://localhost:8080/swagger-ui.html)
- [Web Application](http://localhost:3000)
- [Project Board](https://github.com/yourusername/TechieFinder/projects)
- [Issue Tracker](https://github.com/yourusername/TechieFinder/issues)

---

**Built with ❤️ for Nigeria** 🇳🇬
