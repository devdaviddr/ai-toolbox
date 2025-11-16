# AI Toolbox Fullstack Application

A modular fullstack web application built with React TypeScript, Vite, Tailwind CSS, Express TypeScript, and MSSQL.

## Features

- Modular architecture allowing dynamic loading of application modules
- AI RAG Search module for document retrieval and generation
- Modern frontend with React and Tailwind styling
- Robust backend API with Express and TypeScript
- MSSQL database integration

## Project Structure

```
ai-toolbox/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/           # Express TypeScript backend
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose

### Option 1: Run with Docker Compose (Recommended for Development)

1. Start all services:
   ```bash
   docker-compose up --build
   ```

   Or run in background:
   ```bash
   docker-compose up -d --build
   ```

   - MSSQL: `http://localhost:1433`
   - Backend API: `http://localhost:3001`
   - Frontend: `http://localhost:5173`

   **Note**: This setup includes live reloading for both frontend (Vite HMR) and backend (nodemon). Changes to source code will automatically reload the services.

2. Stop services:
   ```bash
   docker-compose down
   ```

### Option 2: Local Development

#### Database Setup (MSSQL)

1. Start MSSQL database using Docker Compose:
   ```bash
   docker-compose up -d mssql
   ```

   This will start MSSQL on port 1433 with SA password `Password123!`.

#### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Development

- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:5173` (Vite default)

## Modules

The application supports modular features. Currently planned:
- AI RAG Search: Document search with retrieval-augmented generation

## Database

MSSQL database is containerized using Docker Compose. The backend connects using service name `mssql` in the Docker network. For local development, update `backend/.env` to point to `localhost`.

## Contributing

1. Plan features using the todo system
2. Implement in respective frontend/backend directories
3. Test thoroughly before committing