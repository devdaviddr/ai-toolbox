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

Create `.env` file in the backend directory (optional - defaults are provided):

```bash
cd backend
cat > .env << EOF
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
DB_USER=sa
DB_PASSWORD=Password123!
DB_SERVER=localhost
DB_NAME=ai_toolbox_db
EOF
```

### 3. Start Local Services (Optional - with Docker)

```bash
# Start database and backend services
docker-compose up

# In a new terminal, start frontend
cd frontend
npm run dev
```

**Note**: You don't need Docker to run tests - they use mocked database.

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
- **8 tests passing** ✅
- Error boundary component tests
- Custom hooks tests

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

- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add authentication endpoints
- [ ] Implement E2E tests with docker-compose
- [ ] Add performance monitoring
- [ ] Set up code coverage reporting

---

**Happy coding!** 🚀

For questions or issues, refer to the troubleshooting section or check the test documentation.
