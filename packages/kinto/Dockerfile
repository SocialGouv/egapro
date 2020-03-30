FROM node:10.15.3-alpine

WORKDIR /app

ENV KINTO_SERVER=kinto-server
ENV KINTO_ADMIN_LOGIN=admin
ENV KINTO_ADMIN_PASSWORD=passw0rd

COPY ./packages/kinto/package.json yarn.lock /app/

RUN yarn --production --frozen-lockfile --cache-folder /dev/shm/yarn

COPY ./packages/kinto/src /app/src
COPY ./packages/kinto/scripts /app/scripts

USER node

ENV NODE_ENV=production

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
