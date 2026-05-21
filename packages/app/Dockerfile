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
COPY packages/notifications/package.json ./packages/notifications/

# Install both the app (Next.js build) and the notifications worker
# subtree. Both packages are leaves of the workspace graph; listing them
# explicitly is enough.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --filter app --filter notifications --frozen-lockfile --store-dir=/pnpm/store

# Copy source code (after install to maximize cache hits)
COPY packages/app/ ./packages/app/
COPY packages/notifications/ ./packages/notifications/

# Build-time env handling
ENV HUSKY=0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Avoid failing the image build because runtime env vars are not provided at build time.
ENV SKIP_ENV_VALIDATION=1

# Build-time args for NEXT_PUBLIC_* variables (inlined by Next.js at build time)
ARG NEXT_PUBLIC_EGAPRO_ENV
ENV NEXT_PUBLIC_EGAPRO_ENV=$NEXT_PUBLIC_EGAPRO_ENV
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_MATOMO_URL
ENV NEXT_PUBLIC_MATOMO_URL=$NEXT_PUBLIC_MATOMO_URL
ARG NEXT_PUBLIC_MATOMO_SITE_ID
ENV NEXT_PUBLIC_MATOMO_SITE_ID=$NEXT_PUBLIC_MATOMO_SITE_ID

# Compile the notifications worker / publisher TypeScript sources to dist/
# BEFORE the Next.js build. The app's runtime dynamic import
# `await import("notifications/publisher")` resolves to ./dist/publisher.js
# via package.json exports, so the dist must exist when Next.js starts.
RUN pnpm --filter notifications build

# Produce a self-contained runtime tree for the notifications worker. The
# output bundles its own `node_modules/.pnpm` store, so the symlinks
# resolve at runtime without depending on the workspace `.pnpm` store we
# do NOT ship to the runner. `--legacy` is required since pnpm v10 (we
# don't use injected workspace packages).
RUN pnpm --filter notifications deploy --prod --legacy /deploy/notifications

# Build with Next.js cache persisted across builds
# Sentry auth token and release are mounted as BuildKit secrets to avoid leaking in image layers
# and to preserve build cache (ARG would invalidate cache on every new release)
RUN --mount=type=cache,id=next-cache,target=/app/packages/app/.next/cache \
    --mount=type=secret,id=sentry_auth_token \
    --mount=type=secret,id=sentry_release \
    SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_auth_token 2>/dev/null) \
    NEXT_PUBLIC_SENTRY_RELEASE=$(cat /run/secrets/sentry_release 2>/dev/null | tr '/' '-') \
    pnpm --filter app build


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
# Standalone script invoked by the audit-cleanup CronJob (issue #3268 — direct
# DB access replaces the former curl → /api/audit/cleanup HTTP trigger).
COPY --from=builder --chown=1000:1000 /app/packages/app/scripts/audit-cleanup.mjs ./packages/app/scripts/audit-cleanup.mjs

# Notifications worker — independent workspace, runs as its own K8s
# Deployment (notifications-deployment.yaml). Source = `pnpm deploy` output
# from the builder stage: a flat tree with the compiled `dist/`, the
# package.json, and a real (non-symlinked) node_modules with pg-boss,
# nodemailer, postgres, html-to-text resolved inline.
COPY --from=builder --chown=1000:1000 /deploy/notifications/dist ./packages/notifications/dist
COPY --from=builder --chown=1000:1000 /deploy/notifications/package.json ./packages/notifications/package.json
COPY --from=builder --chown=1000:1000 /deploy/notifications/node_modules ./packages/notifications/node_modules

USER 1000

CMD ["sh", "packages/app/scripts/entrypoint.sh"]
