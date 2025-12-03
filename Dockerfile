# Build stage # Currently node:alpine is node-25
FROM node:alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm install --production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create storage directory for file uploads
RUN mkdir -p storage && chown -R node:node storage

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
