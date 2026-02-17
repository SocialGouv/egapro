# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=24-alpine

# Builder stage: install dependencies and build
FROM node:$NODE_VERSION AS builder

WORKDIR /app

# Enable pnpm via corepack (no global npm install needed)
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

# Copy lockfile and config first for better layer caching (pnpm fetch only needs these)
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Fetch all dependencies into the store (cached unless lockfile changes)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --frozen-lockfile --store-dir=/pnpm/store

# Copy package.json files (needed for workspace resolution)
COPY package.json ./
COPY packages/app/package.json ./packages/app/

# Install from local store (offline = no network calls, fast)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --filter app --frozen-lockfile --offline --store-dir=/pnpm/store

# Copy source code (after install to maximize cache efficiency)
COPY packages/app/ ./packages/app/

ENV HUSKY=0
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV GENERATE_SOURCEMAP=true
ENV NODE_ENV=production

# App build args
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

# Sentry build args
ARG SENTRY_URL
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_URL=$SENTRY_URL
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Build with Next.js cache persisted across builds
RUN --mount=type=cache,id=next-cache,target=/app/packages/app/.next/cache \
    --mount=type=secret,id=sentry \
    sh -ce ' \
    if [ -f /run/secrets/sentry ]; then \
      export SENTRY_AUTH_TOKEN="$(grep "^SENTRY_AUTH_TOKEN=" /run/secrets/sentry | cut -d= -f2)"; \
    fi; \
    export SENTRY_ALLOW_FAILURE=true; \
    pnpm --filter app build \
    '

# Deploy: creates a standalone production bundle (no dev dependencies, no symlinks)
RUN pnpm --filter app --prod deploy /app/deploy && \
    cp -r /app/packages/app/.next /app/deploy/.next && \
    cp -r /app/packages/app/public/* /app/deploy/public/


# Runner stage: minimal Node runtime, no pnpm/corepack
FROM node:$NODE_VERSION AS runner

RUN apk --update --no-cache add ca-certificates && apk upgrade

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Sentry runtime env vars
ARG SENTRY_URL
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_URL=$SENTRY_URL
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Copy deployed standalone files (real node_modules, not symlinks)
COPY --from=builder --chown=1000:1000 /app/deploy /app

# Make the tree read-only, then re-enable write only where Next.js runtime needs it
RUN chmod -R a-w /app && \
    mkdir -p /app/.next/cache/images && \
    chown -R 1000:1000 /app/.next/cache && \
    chmod -R u+rwX,go+rX /app/.next/cache

USER 1000

CMD ["node", "node_modules/next/dist/bin/next", "start"]
