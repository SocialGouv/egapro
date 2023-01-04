ARG NODE_VERSION=16-alpine

# Builder
FROM node:$NODE_VERSION AS builder

ARG NEXT_PUBLIC_APP_VERSION_COMMIT
ENV NEXT_PUBLIC_APP_VERSION_COMMIT $NEXT_PUBLIC_APP_VERSION_COMMIT
ARG NEXT_PUBLIC_IS_PRODUCTION_DEPLOYMENT
ENV NEXT_PUBLIC_IS_PRODUCTION_DEPLOYMENT $NEXT_PUBLIC_IS_PRODUCTION_DEPLOYMENT
ARG NEXT_PUBLIC_HOST
ENV NEXT_PUBLIC_HOST $NEXT_PUBLIC_HOST
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_V2_URL
ENV NEXT_PUBLIC_API_V2_URL $NEXT_PUBLIC_API_V2_URL

WORKDIR /app/packages/app

COPY packages/app/package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY packages/app/ ./

ENV NODE_OPTIONS="--max-old-space-size=8192"

RUN yarn build && \
  yarn install --production && \
  if [ -z "$NEXT_PUBLIC_IS_PRODUCTION_DEPLOYMENT" ]; then \
    echo "Copy staging values"; \
    cp .env.development .env.production; \
  fi

# Runner
FROM node:$NODE_VERSION AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/packages/app/next.config.js .
COPY --from=builder /app/packages/app/package.json .
COPY --from=builder /app/packages/app/.env.production .
COPY --from=builder /app/packages/app/.env.development .
COPY --from=builder /app/packages/app/public ./public
COPY --from=builder /app/packages/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages/app/.next ./.next

USER 1001

CMD ["node_modules/.bin/next", "start"]
