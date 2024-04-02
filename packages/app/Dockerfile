ARG NODE_VERSION=20-alpine

# Builder
FROM node:$NODE_VERSION AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_V2_URL
ENV NEXT_PUBLIC_API_V2_URL $NEXT_PUBLIC_API_V2_URL
ARG NEXT_PUBLIC_GITHUB_SHA
ENV NEXT_PUBLIC_GITHUB_SHA $NEXT_PUBLIC_GITHUB_SHA
ARG EGAPRO_ENV
ENV EGAPRO_ENV $EGAPRO_ENV
ARG NEXTAUTH_URL
ENV NEXTAUTH_URL $NEXTAUTH_URL

WORKDIR /app

COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn fetch workspaces focus app

COPY packages/app/ ./packages/app/

ENV NODE_OPTIONS="--max-old-space-size=8192"

RUN yarn workspace app build
RUN yarn workspaces focus app --production && yarn cache clean
RUN mkdir -p ./packages/app/node_modules

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
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/app/node_modules ./packages/app/node_modules
COPY --from=builder --chown=node:node /app/packages/app/.next ./.next

USER 1000

CMD ["node_modules/.bin/next", "start"]
