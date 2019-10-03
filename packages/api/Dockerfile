ARG NODE_VERSION=10.15.3

FROM node:${NODE_VERSION} as builder
WORKDIR /app

COPY packages/api .
COPY yarn.lock ./yarn.lock

RUN yarn
RUN yarn build

FROM node:${NODE_VERSION}

WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Display all the logs in the console AND pipe them to pino-sentry which is the
# sentry transport for the pino logger.
CMD ["bash", "-c", "node dist/server.js | tee >(yarn run pino-sentry --dsn=$API_SENTRY_DSN)"]
