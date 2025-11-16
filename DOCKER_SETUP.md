# Docker Setup Guide

## Overview

This project uses Docker Compose to run the full stack locally with all services:
- **MSSQL** - SQL Server database
- **Backend** - Express API server
- **Frontend** - React development server

## Prerequisites

- Docker and Docker Compose installed
- 4GB+ available disk space
- Ports 3001, 5173, and 1433 available

## Quick Start

### 1. Build and Start All Services

```bash
docker-compose up --build
```

This will:
1. Start MSSQL database (with 30s initialization)
2. Build and start backend (depends on database health)
3. Build and start frontend (depends on backend health)

### 2. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **MSSQL**: localhost:1433

### 3. Stop Services

```bash
docker-compose down
```

## Environment Setup

### Backend Environment Variables

Set in `docker-compose.yml`:
- `DB_USER=sa` - MSSQL SA account
- `DB_PASSWORD=Password123!` - SA password
- `DB_SERVER=mssql` - Database host (service name in Docker)
- `DB_NAME=ai_toolbox_db` - Database name
- `PORT=3001` - Backend port

### Frontend Environment Variables

Configured in `frontend/.env` (if needed):
- `VITE_API_URL=http://localhost:3001` - Backend URL

## Volumes and Persistence

### Data Persistence

- **MSSQL Data**: `mssql-data` named volume persists database data
- **Node Modules**: `node_modules` mounted separately to avoid conflicts

### Live Reload

- Backend: Changes to `backend/src/` trigger rebuild via Nodemon
- Frontend: Changes to `frontend/src/` trigger hot reload via Vite

## Troubleshooting

### Backend won't start

**Issue**: "Cannot find package 'winston'"
**Solution**: 
```bash
docker-compose down --volumes
docker-compose up --build
```

### Database connection failed

**Issue**: Backend can't connect to MSSQL
**Solution**: Wait for MSSQL to be ready (check `docker-compose ps`)
- MSSQL has 30s start period
- Backend waits for MSSQL health check

### Port already in use

**Solution**: Kill process using port or change in docker-compose.yml:
```bash
# Change port mapping
lsof -i :3001  # Find process on port 3001
kill -9 <PID>
```

### Clear all data

```bash
docker-compose down --volumes
docker-compose up --build
```

## Development Workflow

### Running Tests in Docker

Backend tests:
```bash
docker-compose exec backend npm test
```

Frontend tests:
```bash
docker-compose exec frontend npm test
```

E2E tests:
```bash
docker-compose exec frontend npm run e2e
```

### Running Linting in Docker

Backend linting:
```bash
docker-compose exec backend npm run lint
```

Frontend linting:
```bash
docker-compose exec frontend npm run lint
```

### Viewing Logs

All services:
```bash
docker-compose logs
```

Specific service:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mssql
```

Follow logs:
```bash
docker-compose logs -f backend
```

## Database Management

### Access MSSQL in Container

```bash
docker-compose exec mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Password123!" -C
```

### Reset Database

```bash
docker-compose down --volumes
docker-compose up
```

## Performance Tips

1. **Use named volume for node_modules**: Prevents npm install on every mount
2. **Multi-stage builds**: Consider for production images
3. **Cache layers**: Docker builds cache layer by layer
4. **Prune unused images**: `docker image prune`

## Production Considerations

For production deployment:
1. Remove `volumes` mounts for source code
2. Use `npm run build` instead of dev mode
3. Add reverse proxy (nginx)
4. Use environment-specific configs
5. Add CI/CD integration

## Reference Commands

```bash
# View all containers
docker-compose ps

# Rebuild specific service
docker-compose up --build backend

# Execute command in service
docker-compose exec backend npm run lint

# View service logs with timestamp
docker-compose logs --timestamps backend

# Remove all containers and volumes
docker-compose down -v

# Remove dangling images
docker image prune -a --force
```
