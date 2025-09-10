# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20

# Base image with common system deps
FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Dependencies stage (use npm + package-lock)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build stage: build Next + generate Prisma client
FROM deps AS build
WORKDIR /app
COPY prisma ./prisma
COPY next.config.* tsconfig.json ./
# Ensure PostCSS/Tailwind configs are available during build
COPY postcss.config.* tailwind.config.* ./
COPY src ./src
COPY public ./public
# Generate Prisma client
RUN npx prisma generate
# Build Next.js (standalone)
RUN npm run build

# Runtime image
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
# Ensure curl for healthcheck and minimal runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
# Run as non-root
USER node

# Copy standalone output and required assets
# Next.js standalone places server code in .next/standalone with minimal node_modules
COPY --chown=node:node --from=build /app/.next/standalone ./
COPY --chown=node:node --from=build /app/public ./public
# Next server expects .next/static in the root
COPY --chown=node:node --from=build /app/.next/static ./.next/static
# Prisma schema for runtime migrations (optional, but useful)
COPY --chown=node:node --from=build /app/prisma ./prisma

# Expose port 3000
EXPOSE 3000

# Healthcheck hitting a Next API route you implement: /api/health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1

# Start command. We can run prisma migrate deploy on container start (safe for idempotent deploys)
CMD ["bash", "-lc", "set -euo pipefail; if [ -f prisma/schema.prisma ]; then npx prisma migrate deploy || true; fi; node server.js"]