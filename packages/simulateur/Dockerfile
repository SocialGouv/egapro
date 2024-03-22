ARG NODE_VERSION=16-alpine
FROM node:$NODE_VERSION as node

WORKDIR /app

# BUILD ENVIRONMENTS
FROM node as builder

COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn fetch workspaces focus simulateur

COPY packages/simulateur/public ./packages/simulateur/public
COPY packages/simulateur/tsconfig.json ./packages/simulateur/
COPY packages/simulateur/.eslintrc.js ./packages/simulateur/
COPY packages/simulateur/src ./packages/simulateur/src

ARG REACT_APP_EGAPRO_API_URL=https://egapro-preprod.ovh.fabrique.social.gouv.fr/api
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
RUN yarn workspace simulateur build

# SERVER
FROM ghcr.io/socialgouv/docker/nginx4spa:7.1.0

COPY --from=builder --chown=nginx:nginx /app/packages/simulateur/build /usr/share/nginx/html
