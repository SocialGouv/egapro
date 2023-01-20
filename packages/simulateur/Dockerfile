ARG NODE_VERSION=16-alpine
FROM node:$NODE_VERSION as node

WORKDIR /app

# BUILD ENVIRONMENTS
FROM node as builder

COPY packages/simulateur/package.json yarn.lock ./

RUN yarn --frozen-lockfile

COPY packages/simulateur/public ./public
COPY packages/simulateur/tsconfig.json ./
COPY packages/simulateur/.eslintrc.js ./
COPY packages/simulateur/src ./src

ARG REACT_APP_EGAPRO_API_URL=https://egapro-preprod.dev.fabrique.social.gouv.fr/api
ENV REACT_APP_EGAPRO_API_URL=$REACT_APP_EGAPRO_API_URL

ARG REACT_APP_DECLARATION_URL="/index-egapro/declaration/"
ENV REACT_APP_DECLARATION_URL=$REACT_APP_DECLARATION_URL

ARG REACT_APP_SENTRY_DSN=https://b2f84ee9dc6044abbeb0f417f4335a26@sentry.fabrique.social.gouv.fr/48
ENV REACT_APP_SENTRY_DSN=${REACT_APP_SENTRY_DSN}

ARG REACT_APP_GITHUB_SHA
ENV REACT_APP_GITHUB_SHA=${REACT_APP_GITHUB_SHA}

ARG PUBLIC_URL
ENV PUBLIC_URL=${PUBLIC_URL}

ENV NODE_ENV=production
RUN yarn build && yarn --frozen-lockfile --production

# SERVER
FROM ghcr.io/socialgouv/docker/nginx4spa:7.1.0

COPY --from=builder --chown=nginx:nginx /app/build /usr/share/nginx/html
