# StoreHub Merchant Onboarding Platform

A cloud-first merchant onboarding platform built with modern technologies for scalable, secure, and efficient merchant management.

## 🏗️ Architecture Overview

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with 30-day expiring tokens
- **API Documentation**: Swagger/OpenAPI
- **Health Checks**: Built-in health monitoring endpoints

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS (mobile-first responsive design)
- **State Management**: Context API with custom hooks
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6

### Cloud Infrastructure
- **Hosting**: Render (both backend and frontend)
- **Database**: PostgreSQL on Render
- **Deployment**: GitHub auto-deploy
- **Environment**: Cloud-first (no localhost dependency)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- Git
- A Render account
- A PostgreSQL database (or use Render's database service)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd storehub-merchant-onboarding
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run start:dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URL
   npm start
   ```

## 🌐 Cloud Deployment

### 1. Backend Deployment on Render

1. **Database Setup**
   - Create a PostgreSQL database on Render
   - Note the connection details

2. **Backend Service**
   - Connect your GitHub repository
   - Create a new Web Service
   - Use the `render.yaml` configuration in the `backend` folder
   - Set environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-secret-key
     DB_HOST=your-db-host
     DB_PORT=5432
     DB_USERNAME=your-db-user
     DB_PASSWORD=your-db-password
     DB_NAME=your-db-name
     ```

3. **Health Check**
   - Render will automatically use `/api/health` endpoint
   - Monitor service health through Render dashboard

### 2. Frontend Deployment on Render

1. **Static Site Setup**
   - Create a new Static Site
   - Use the `render.yaml` configuration in the `frontend` folder
   - Set environment variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.onrender.com/api
     ```

2. **Custom Domain (Optional)**
   - Add your custom domain in Render dashboard
   - Configure DNS records as instructed

## 🔐 Authentication & Security

### JWT Authentication
- **Token Expiry**: 30 days
- **Storage**: Secure localStorage (client-side)
- **Refresh**: Automatic token refresh on API calls
- **Logout**: Complete token cleanup

### User Types
1. **Merchants**: Register, complete profile, track status
2. **Onboarding Managers**: Review applications, approve/reject merchants

### Security Features
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Security headers
- Environment-based configuration

## 📧 Email Configuration

### Subdomain Setup
- **Onboarding Manager Access**: `email.storehub.com`
- Configure DNS CNAME record pointing to your Render app

### Email Service
- SMTP configuration for notifications
- Email verification for merchants
- Password reset functionality

## 📊 API Documentation

### Swagger Documentation
- **URL**: `https://your-backend-url.onrender.com/api/docs`
- **Authentication**: Bearer token required for protected endpoints

### Key Endpoints
- `POST /api/auth/merchant/login` - Merchant login
- `POST /api/auth/merchant/register` - Merchant registration
- `POST /api/auth/onboarding-manager/login` - Manager login
- `GET /api/merchants/profile` - Get merchant profile
- `PUT /api/merchants/profile` - Update merchant profile
- `GET /api/health` - Health check

## 🏗️ Project Structure

```
storehub-merchant-onboarding/
├── backend/
│   ├── src/
│   │   ├── auth/                 # Authentication module
│   │   ├── merchant/             # Merchant management
│   │   ├── onboarding-manager/   # Manager functionality
│   │   ├── health/               # Health checks
│   │   └── config/               # Configuration files
│   ├── render.yaml               # Render deployment config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   ├── hooks/                # Custom hooks
│   │   └── utils/                # Utility functions
│   ├── render.yaml               # Render deployment config
│   └── package.json
└── README.md
```

## 🚀 Features

### Merchant Features
- ✅ Email-based registration and login
- ✅ Complete business profile management
- ✅ Application status tracking
- ✅ Mobile-first responsive design
- ✅ Secure JWT authentication

### Onboarding Manager Features
- ✅ Dashboard with merchant overview
- ✅ Application review and approval
- ✅ Status management (approve/reject/suspend)
- ✅ Email-based login via subdomain
- ✅ Real-time merchant statistics

### Technical Features
- ✅ Cloud-first architecture
- ✅ PostgreSQL with TypeORM
- ✅ Comprehensive health checks
- ✅ Auto-deployment with GitHub
- ✅ Environment-based configuration
- ✅ API documentation with Swagger

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run start:dev     # Development mode with hot reload
npm run build         # Production build
npm run test          # Run tests
npm run lint          # Code linting
```

### Frontend Development
```bash
cd frontend
npm start             # Development server
npm run build         # Production build
npm test              # Run tests
```

## 📈 Monitoring & Logging

### Health Checks
- **Backend**: `/api/health` endpoint
- **Database**: Connection verification
- **Frontend**: Build and deployment status

### Logging
- Application logs available in Render dashboard
- Error tracking and monitoring
- Performance metrics

## 🔄 CI/CD Pipeline

### GitHub Integration
- **Auto-deploy**: Push to main branch triggers deployment
- **Preview deployments**: Pull request previews
- **Rollback**: Easy rollback to previous versions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/api/docs`
- Review the health status at `/api/health`

---

**Built with ❤️ for StoreHub** 