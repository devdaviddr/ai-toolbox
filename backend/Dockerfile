FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy config files
COPY eslint.config.js ./
COPY .prettierrc.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source
COPY src/ ./src/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

# Start in dev mode with live reloading
CMD ["npm", "run", "dev"]
