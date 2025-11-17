# AI Toolbox

A full-stack application with Express.js backend, React frontend, and comprehensive testing infrastructure.

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Running Tests](#running-tests)
- [Project Architecture](#project-architecture)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## 📁 Project Structure

```
ai-toolbox/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config.ts       # Environment configuration & validation
│   │   ├── logger.ts       # Winston logging setup
│   │   ├── server.ts       # Express app initialization
│   │   ├── routes/         # API route handlers
│   │   └── database/       # Database initialization
│   ├── tests/              # Jest test suite
│   │   ├── unit/           # Unit tests
│   │   ├── integration/    # Integration tests
│   │   └── setup.js        # Global test configuration
│   ├── jest.config.cjs     # Jest configuration
│   ├── package.json        # Backend dependencies
│   └── TESTING.md          # Testing documentation
│
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── router/         # Route configuration
│   │   └── test/           # Test setup
│   ├── tests/              # Unit and integration tests
│   ├── e2e/                # End-to-end tests (Playwright)
│   ├── vitest.config.ts    # Vitest configuration
│   ├── playwright.config.ts # Playwright configuration
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite build configuration
│
└── docker-compose.yml      # Database and services setup

```

## 🔧 Prerequisites

Before you start, ensure you have installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Docker & Docker Compose** (optional, for local database) - [Download](https://www.docker.com/)

Verify installation:
```bash
node --version    # Should be v18.x or higher
npm --version     # Should be 9.x or higher
docker --version  # Only if using Docker
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ai-toolbox

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Environment Setup

Create a `.env` file in the project root directory:

```bash
# Create root .env file for Docker Compose
cat > .env << EOF
# Database Configuration
DB_USER=sa
DB_PASSWORD=Password123!
DB_SERVER=localhost
DB_NAME=ai_toolbox_db

# Azure AD Configuration (replace with your actual values)
AZURE_CLIENT_ID=your-azure-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_AUDIENCE=api://your-azure-client-id
AZURE_AUDIENCE_WITH_SCOPE=api://your-api-client-id/access_as_user
AZURE_ISSUER=https://login.microsoftonline.com/your-tenant-id/v2.0

# Frontend Azure AD Configuration
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_API_SCOPE=api://your-api-client-id/access_as_user
EOF
```

**Security Note**: Never commit `.env` files to version control. The project includes `.env` files in `.gitignore`.

### 3. Azure AD Setup (Production)

For production deployment, you need to configure Azure Active Directory authentication:

#### Step 1: Create Azure AD Application Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: `ai-toolbox-api` (or your preferred name)
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Leave blank for now
5. Click **Register**

#### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `User.Read` (Sign in and read user profile)
   - `openid` (Sign users in)
   - `profile` (View users' basic profile)
   - `email` (View users' email address)

#### Step 3: Expose API (for frontend access)

1. Go to **Expose an API** in your app registration
2. Set **Application ID URI**: `api://<your-client-id>`
3. Add a scope:
   - **Scope name**: `access_as_user`
   - **Who can consent**: Admins and users
   - **Admin consent display name**: Access ai-toolbox as user
   - **Admin consent description**: Allows the app to access ai-toolbox on behalf of the signed-in user
   - **User consent display name**: Access ai-toolbox
   - **User consent description**: Allows the app to access ai-toolbox on your behalf

#### Step 4: Create Frontend App Registration

1. Create a second app registration for the frontend:
   - **Name**: `ai-toolbox-frontend`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: `http://localhost:5173` (for development) and your production URL

2. Configure permissions to access the API:
   - Go to **API permissions**
   - Click **Add a permission** > **My APIs**
   - Select your `ai-toolbox-api` app
   - Add the `access_as_user` scope

#### Step 5: Configure Environment Variables

Update your production environment files:

**Backend (.env.production):**
```bash
# Replace with your actual values from Azure AD
AZURE_CLIENT_ID=your-api-app-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_AUDIENCE=api://your-api-app-client-id
AZURE_AUDIENCE_WITH_SCOPE=api://your-api-app-client-id/access_as_user
AZURE_ISSUER=https://login.microsoftonline.com/your-tenant-id/v2.0

# Database and other settings...
DB_USER=sa
DB_PASSWORD=your-secure-password
DB_SERVER=your-db-server
DB_NAME=ai_toolbox_db
```

**Frontend (.env.production):**
```bash
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_CLIENT_ID=your-frontend-app-client-id
VITE_API_BASE_URL=https://your-api-domain.com
VITE_API_SCOPE=api://your-api-app-client-id/access_as_user
```

#### Step 6: Production Deployment

Use the production docker-compose file:

```bash
# Set environment variables (recommended approach)
export AZURE_CLIENT_ID=your-api-app-client-id
export AZURE_TENANT_ID=your-tenant-id
export DB_PASSWORD=your-secure-password
# ... set all required variables

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d

# Or use environment files
cp .env .env.production
# Edit .env.production with production values
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d
```

#### Current Working Configuration

The application currently uses these Azure AD settings (replace with your values):

```bash
# Backend Azure AD Configuration
AZURE_CLIENT_ID=eea281fe-41da-4ebb-8182-4b4070c221aa
AZURE_TENANT_ID=680ffb06-000e-46a1-a455-ab68252c398d
AZURE_AUDIENCE=api://eea281fe-41da-4ebb-8182-4b4070c221aa
AZURE_AUDIENCE_WITH_SCOPE=api://9214d544-1123-47ec-a6d3-97b271dc347a/access_as_user
AZURE_ISSUER=https://login.microsoftonline.com/680ffb06-000e-46a1-a455-ab68252c398d/v2.0

# Frontend Azure AD Configuration
VITE_AZURE_TENANT_ID=680ffb06-000e-46a1-a455-ab68252c398d
VITE_AZURE_CLIENT_ID=eea281fe-41da-4ebb-8182-4b4070c221aa
VITE_API_SCOPE=api://9214d544-1123-47ec-a6d3-97b271dc347a/access_as_user
```

**Note**: The `AZURE_AUDIENCE_WITH_SCOPE` and `VITE_API_SCOPE` use a different client ID (`9214d544-1123-47ec-a6d3-97b271dc347a`) which should be your API app registration's client ID for the scope definition.

### 4. Start Local Services (with Docker)

```bash
# Start all services with environment variables from .env file
docker-compose up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

**Environment Variables**: Docker Compose automatically loads variables from the root `.env` file. Sensitive values like database passwords and Azure AD credentials are now properly externalized and not hardcoded in the compose file.

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## 💻 Local Development

### Without Docker (Development Only)

#### Terminal 1: Backend

```bash
cd backend
npm install
npm run dev
```

The backend will start on http://localhost:3001

#### Terminal 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173

### With Docker (Full Stack)

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Available Scripts

#### Backend

```bash
# Development server (auto-reload with nodemon)
npm run dev

# Build TypeScript
npm run build

# Start production build
npm start

# Run tests (see "Running Tests" section below)
npm test
npm run test:watch
npm run test:coverage
```

#### Frontend

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run unit tests
npm test

# Run tests in UI mode
npm test:ui

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run e2e

# Run linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

---

## 🧪 Running Tests

### Backend Tests

Backend tests use **mocked database** - no Docker or database setup required.

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- config.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Config"
```

**Test Results:**
- **31 tests passing** ✅
- **83.72% coverage**
- **0.3 seconds execution time**

**What's tested:**
- ✅ Configuration validation & environment variables
- ✅ Database initialization & error handling
- ✅ API endpoints & middleware
- ✅ Error handling scenarios
- ✅ HTTP method support

**Example output:**
```
PASS tests/unit/config.test.ts
PASS tests/unit/database.test.ts
PASS tests/integration/health.test.ts

Test Suites: 3 passed, 3 total
Tests:       31 passed, 31 total
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run in UI mode (interactive)
npm test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test ErrorBoundary.test.tsx

# Run e2e tests (requires backend running)
npm run e2e

# Run e2e in UI mode
npm run e2e:ui
```

**Test Results:**
- **26 tests passing** ✅ (Frontend: 24, Backend: 2)
- Error boundary component tests
- Custom hooks tests
- Settings tabs functionality tests
- System status and user account component tests

### Running All Tests at Once

```bash
# Run all backend tests
cd backend && npm test && cd ..

# Run all frontend tests
cd frontend && npm test && cd ..

# Or use a script (if you create one in root package.json)
npm run test:all
```

---

## 🏗️ Project Architecture

### Backend Architecture

**Stack:** Express.js, TypeScript, Winston (logging), Zod (validation)

**Key Components:**

1. **Config Module** (`src/config.ts`)
   - Environment variable validation with Zod
   - Type-safe configuration access
   - Error handling for missing variables

2. **Logger Module** (`src/logger.ts`)
   - Structured JSON logging with Winston
   - File and console output
   - Disabled in test environment

3. **Database Module** (`src/database/init.ts`)
   - MSSQL connection pooling
   - Automatic database creation
   - Error handling and logging

4. **Health Route** (`src/routes/health.ts`)
   - Database connectivity check
   - System health status
   - Response with timestamp

### Frontend Architecture

**Stack:** React 19, Vite, React Router, TanStack Query

**Key Components:**

1. **ErrorBoundary** (`src/components/ErrorBoundary.tsx`)
   - Catches React errors
   - Displays error UI with recovery option
   - Dev/prod specific error details

2. **Layout Components**
   - Header, Footer, Sidebar
   - Navigation structure
   - Responsive design

3. **Custom Hooks** (`src/hooks/`)
   - `useHealth`: Fetches backend health status
   - `useNetworkStatus`: Detects offline/online state

4. **Pages**
   - Dashboard, Login, Modules, Settings
   - Module Detail view
   - **Settings Page**: Tabbed interface with System Status and User Account sections
     - System Status: Real-time health monitoring, metrics, and system information
     - User Account: Authentication details, roles, permissions, and token information
     - Features: Keyboard navigation, touch gestures, lazy loading, accessibility support

### Testing Architecture

**Backend:** Jest with mocked MSSQL database
**Frontend:** Vitest with React Testing Library
**E2E:** Playwright (integration tests)

See [TESTING_ARCHITECTURE.md](./TESTING_ARCHITECTURE.md) for detailed testing documentation.

---

## 📡 API Reference

### Health Check Endpoint

```
GET /health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "testResult": { "test": 1 }
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "error": "Connection timeout"
}
```

---

## 🔍 Troubleshooting

### Backend Issues

**Issue:** "Cannot find module 'mssql'"

```bash
# Solution: Install dependencies
cd backend
npm install
```

**Issue:** "Database connection failed" in production

```bash
# Check environment variables
echo $DB_SERVER
echo $DB_USER

# Verify docker-compose is running
docker-compose ps

# Check logs
docker-compose logs mssql
```

**Issue:** Tests show database errors

```bash
# This is expected in tests - database is mocked
# If you see "Database initialization failed", this is normal
# All tests should still pass

# To verify:
npm test
# Should show: Tests: 31 passed, 31 total
```

### Frontend Issues

**Issue:** "Port 5173 already in use"

```bash
# Kill process on port 5173
# macOS/Linux:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Issue:** Module not found errors

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Issue:** Vite dev server not reloading

```bash
# Restart dev server
npm run dev

# Or check if port is correct
# Should be http://localhost:5173
```

### Docker Issues

**Issue:** "docker-compose command not found"

```bash
# Install Docker Desktop from https://www.docker.com/
# Or use: docker compose (without hyphen) if you have Docker v2+
docker compose up
```

**Issue:** "Cannot connect to Docker daemon"

```bash
# Start Docker Desktop
# On macOS/Windows: Open Docker application
# On Linux: sudo systemctl start docker
```

**Issue:** "Port 1433 already in use"

```bash
# Another MSSQL instance is running
docker-compose down
# Or specify different port in docker-compose.yml
```

---

## 📚 Additional Resources

- [Backend Testing Guide](./backend/TESTING.md)
- [Testing Architecture](./TESTING_ARCHITECTURE.md)
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test` (backend) and `npm test` (frontend)
4. Commit: `git commit -m "Add my feature"`
5. Push and create a pull request

## 🎯 Next Steps

- [x] **Azure AD User Management**: Complete authentication system with automatic database sync
- [x] **Container Environment**: Full-stack Docker deployment with health checks
- [x] **Database Schema**: MSSQL users table with proper indexing and constraints
- [x] **API Endpoints**: User sync, profile management, and audit logging
- [x] **Frontend Integration**: MSAL authentication with user profile display
- [x] **Production Configuration**: Environment files and deployment templates
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add performance monitoring and alerting
- [ ] Implement comprehensive E2E test suite
- [ ] Add API rate limiting and security headers
- [ ] Set up log aggregation and monitoring dashboard

---

**Happy coding!** 🚀

For questions or issues, refer to the troubleshooting section or check the test documentation.
