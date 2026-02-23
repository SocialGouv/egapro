# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24-alpine
ARG PNPM_VERSION=10.8.1

# Builder stage: install deps + build Next.js (standalone)
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Enable pnpm via corepack (no global npm install)
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy minimal files first for better layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/app/package.json ./packages/app/

# Install only the workspace subtree needed to build the app
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --filter app --frozen-lockfile --store-dir=/pnpm/store

# Copy source code (after install to maximize cache hits)
COPY packages/app/ ./packages/app/

# Build-time env handling
ENV HUSKY=0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Avoid failing the image build because runtime env vars are not provided at build time.
ENV SKIP_ENV_VALIDATION=1

# Optional build args (kept for CI parity)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_V2_URL
ENV NEXT_PUBLIC_API_V2_URL=$NEXT_PUBLIC_API_V2_URL
ARG NEXT_PUBLIC_GITHUB_SHA
ENV NEXT_PUBLIC_GITHUB_SHA=$NEXT_PUBLIC_GITHUB_SHA
ARG NEXT_PUBLIC_EGAPRO_ENV
ENV NEXT_PUBLIC_EGAPRO_ENV=$NEXT_PUBLIC_EGAPRO_ENV
ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

# Build with Next.js cache persisted across builds
RUN --mount=type=cache,id=next-cache,target=/app/packages/app/.next/cache \
    pnpm --filter app build

# Generate Drizzle migration SQL files from the schema (no DB connection needed)
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter app db:generate


# Runner stage: minimal Node runtime, no pnpm/corepack
FROM node:${NODE_VERSION} AS runner

RUN apk --update --no-cache add ca-certificates && apk upgrade

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

# Copy standalone server (traced node_modules included, monorepo structure preserved)
COPY --from=builder --chown=1000:1000 /app/packages/app/.next/standalone ./
# Copy static assets and public files (not included in standalone output)
COPY --from=builder --chown=1000:1000 /app/packages/app/.next/static ./packages/app/.next/static
COPY --from=builder --chown=1000:1000 /app/packages/app/public ./packages/app/public

# Copy Drizzle migrations, runtime deps, and entrypoint for automatic migration at startup
COPY --from=builder --chown=1000:1000 /app/packages/app/drizzle ./packages/app/drizzle
COPY --from=builder --chown=1000:1000 /app/packages/app/node_modules/drizzle-orm ./packages/app/node_modules/drizzle-orm
COPY --from=builder --chown=1000:1000 /app/packages/app/node_modules/postgres ./packages/app/node_modules/postgres
COPY --from=builder --chown=1000:1000 /app/packages/app/scripts/entrypoint.sh ./packages/app/scripts/entrypoint.sh
COPY --from=builder --chown=1000:1000 /app/packages/app/scripts/migrate.mjs ./packages/app/scripts/migrate.mjs

USER 1000

CMD ["sh", "packages/app/scripts/entrypoint.sh"]
