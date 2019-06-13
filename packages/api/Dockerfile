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

CMD ["node", "dist/server.js"]
