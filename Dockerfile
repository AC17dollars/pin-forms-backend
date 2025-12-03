# Build stage # Currently node:alpine is node-25
FROM node:alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml tsconfig.json prettier.config.ts vitest.config.ts eslint.config.ts ./
COPY .env.docker .env

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY .env.docker .env

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create storage directory for file uploads
RUN mkdir -p storage && chown -R node:node storage

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Start the application
CMD ["pnpm", "start"]
