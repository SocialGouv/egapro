# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=24-alpine

# Builder stage: install dependencies and build
FROM node:$NODE_VERSION AS builder

WORKDIR /app

# Enable pnpm via corepack (no global npm install needed)
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

# Copy workspace config + lockfile + package.jsons for install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/app/package.json ./packages/app/

# Install only app's dependencies (not the entire lockfile like pnpm fetch does)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --filter app --frozen-lockfile --store-dir=/pnpm/store

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
# output: 'standalone' traces imports and produces a minimal server.js + node_modules
RUN --mount=type=cache,id=next-cache,target=/app/packages/app/.next/cache \
    --mount=type=secret,id=sentry \
    sh -ce ' \
    if [ -f /run/secrets/sentry ]; then \
      export SENTRY_AUTH_TOKEN="$(grep "^SENTRY_AUTH_TOKEN=" /run/secrets/sentry | cut -d= -f2)"; \
    fi; \
    export SENTRY_ALLOW_FAILURE=true; \
    pnpm --filter app build \
    '


# Runner stage: minimal Node runtime, no pnpm/corepack
FROM node:$NODE_VERSION AS runner

RUN apk --update --no-cache add ca-certificates && apk upgrade

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

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

WORKDIR /app

# Copy standalone server (traced node_modules included, monorepo structure preserved)
COPY --from=builder --chown=1000:1000 /app/packages/app/.next/standalone ./
# Copy static assets and public files (not included in standalone output)
COPY --from=builder --chown=1000:1000 /app/packages/app/.next/static ./packages/app/.next/static
COPY --from=builder --chown=1000:1000 /app/packages/app/public ./packages/app/public

USER 1000

CMD ["node", "packages/app/server.js"]
