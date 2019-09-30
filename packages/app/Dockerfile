ARG NODE_VERSION=10.15.3

FROM node:${NODE_VERSION} as builder

ENV REACT_APP_API_URL=http://egapro-api:4000

WORKDIR /app

COPY packages/app .
COPY yarn.lock ./yarn.lock

RUN yarn
RUN yarn build

FROM node:${NODE_VERSION}
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js

CMD ["node", "server.js"]
