ARG NODE_VERSION=20-alpine

# Builder
FROM node:$NODE_VERSION AS builder

WORKDIR /app

COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn fetch workspaces focus app

COPY packages/app packages/app

ENV NODE_OPTIONS="--max-old-space-size=8192"

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

# RUN yarn workspaces foreach -At run postinstall # if you have postinstall scripts in your package.json file(s)
RUN yarn workspace app build
RUN yarn workspaces focus app --production

RUN mkdir -p packages/app/node_modules

# Runner
FROM node:$NODE_VERSION AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/packages/app/node_modules ./packages/app/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/app/next.config.js ./packages/app
COPY --from=builder /app/packages/app/package.json ./packages/app
COPY --from=builder /app/packages/app/.env.production ./packages/app
COPY --from=builder /app/packages/app/.env.development ./packages/app
COPY --from=builder /app/packages/app/public ./packages/app/public
COPY --from=builder /app/packages/app/.next ./packages/app/.next
COPY --from=builder /app/.yarn .yarn
COPY --from=builder /app/.yarnrc.yml .
COPY --from=builder /app/yarn.lock .

USER 1001

CMD ["yarn", "workspace", "app", "start"]
