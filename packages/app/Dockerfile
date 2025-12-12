ARG NODE_VERSION=20-alpine

# Builder
FROM node:$NODE_VERSION AS builder


WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY packages/app/ ./packages/app/

ENV NODE_OPTIONS="--max-old-space-size=8192"

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_V2_URL
ENV NEXT_PUBLIC_API_V2_URL $NEXT_PUBLIC_API_V2_URL
ARG NEXT_PUBLIC_GITHUB_SHA
ENV NEXT_PUBLIC_GITHUB_SHA $NEXT_PUBLIC_GITHUB_SHA
ARG NEXT_PUBLIC_EGAPRO_ENV
ENV NEXT_PUBLIC_EGAPRO_ENV $NEXT_PUBLIC_EGAPRO_ENV
ARG NEXTAUTH_URL
ENV NEXTAUTH_URL $NEXTAUTH_URL

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

# Enable source map generation during build
ENV GENERATE_SOURCEMAP=true \
    NODE_ENV=production

# Clean output directory and build with source maps
RUN --mount=type=secret,id=sentry_auth_token export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_auth_token); \
    export NODE_OPTIONS="--max-old-space-size=8192"; \
    export GENERATE_SOURCEMAP=true; \
    export SENTRY_ALLOW_FAILURE=true; \
    pnpm --filter app build

RUN pnpm --filter app --prod deploy ./prod && pnpm store prune


# Runner
FROM node:$NODE_VERSION AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/prod/next.config.js .
COPY --from=builder /app/prod/package.json .
COPY --from=builder /app/prod/.env.production .
COPY --from=builder /app/prod/.env.development .
COPY --from=builder /app/prod/public ./public
COPY --from=builder /app/prod/node_modules ./node_modules
COPY --from=builder /app/prod/sentry.*.ts .
COPY --from=builder --chown=node:node /app/prod/.next ./.next

USER 1000

CMD ["node_modules/.bin/next", "start"]

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
