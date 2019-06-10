ARG NODE_VERSION=10-alpine

FROM node:${NODE_VERSION}

ENV KINTO_BASE_URL=localhost
ENV KINTO_ADMIN_LOGIN=admin
ENV KINTO_ADMIN_PASSWORD=passw0rd

COPY . /app
WORKDIR /app
RUN yarn

RUN ["chmod", "+x", "./scripts/entrypoint.sh"]
ENTRYPOINT ["./scripts/entrypoint.sh"]
