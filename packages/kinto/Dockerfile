FROM node:10.15.3-alpine

WORKDIR /app

ENV KINTO_SERVER=kinto-server
ENV KINTO_ADMIN_LOGIN=admin
ENV KINTO_ADMIN_PASSWORD=passw0rd

COPY package.json yarn.lock /app/

RUN yarn --production --frozen-lockfile --cache-folder /dev/shm/yarn

COPY ./src /app/src

USER node

ENV NODE_ENV=production

ENTRYPOINT ["./scripts/entrypoint.sh"]
