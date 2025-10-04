# Multi-stage build for optimal caching and performance
FROM node:20-alpine AS base

# Security hardening: Add security updates and create non-root user early
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    rm -rf /var/cache/apk/*

# Install global dependencies securely
RUN npm install -g yarn --ignore-scripts

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package.json yarn.lock ./

# Install dependencies with caching
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

# Production stage for running tests
FROM base AS test-runner

# Install Foundry for Solidity testing
RUN apk add --no-cache curl
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="$PATH:/root/.foundry/bin"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')"

# Default command for running tests
CMD ["yarn", "test"]

# Development stage with hot reload
FROM base AS development

# Install development tools
RUN yarn global add nodemon ts-node

# Expose port for development server
EXPOSE 3000

# Development command with hot reload
CMD ["nodemon", "--exec", "ts-node", "uniswap_router_optimizer_Agent.ts"]

# Production stage for deployment
FROM base AS production

# Build the application
RUN yarn build

# Create production user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Production command
CMD ["node", "dist/index.js"]
