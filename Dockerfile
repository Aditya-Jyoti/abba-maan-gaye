# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# All dependencies, for building.
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Production dependencies only, for the migration runner.
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# One-shot container that applies database migrations. Also used to run the
# seed and create-user scripts.
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
COPY drizzle ./drizzle
COPY scripts/migrate.mjs scripts/seed.mjs scripts/seed-data.json scripts/create-user.mjs ./scripts/
COPY src/lib/auth/password.mjs ./src/lib/auth/password.mjs
USER node
CMD ["node", "scripts/migrate.mjs"]

# The web app, from Next.js standalone output.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
