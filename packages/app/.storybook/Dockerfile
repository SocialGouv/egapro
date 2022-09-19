ARG NODE_VERSION=16-alpine
FROM node:$NODE_VERSION as node

WORKDIR /app

# BUILD ENVIRONMENTS
FROM node as builder

COPY packages/app/package.json yarn.lock ./

RUN yarn --frozen-lockfile

COPY packages/app  ./

RUN yarn build-storybook

RUN chown 1000:1000 -R .

# SERVER
FROM ghcr.io/socialgouv/docker/nginx4spa:7.1.0

RUN sed -i 's/add_header X-Frame-Options "deny";/add_header X-Frame-Options "allow";/' /etc/nginx/nginx.conf

COPY --from=builder --chown=nginx:nginx /app/storybook-static /usr/share/nginx/html

