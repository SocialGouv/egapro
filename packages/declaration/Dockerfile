ARG UBUNTU_VERSION=22.04
FROM ubuntu:$UBUNTU_VERSION as builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ruby-full \
    && rm -rf /var/lib/apt/lists/*

RUN gem install jekyll bundler

ENV GEM_HOME=/home/jekyll/gems

WORKDIR /home/jekyll

COPY . .

ARG EGAPRO_API_URL
ENV EGAPRO_API_URL=${EGAPRO_API_URL}
RUN echo "EGAPRO_API_URL: ${EGAPRO_API_URL}" >> _config.yml

ARG EGAPRO_SIMU_URL
ENV EGAPRO_SIMU_URL=${EGAPRO_SIMU_URL}
RUN echo "EGAPRO_SIMU_URL: ${EGAPRO_SIMU_URL}" >> _config.yml

ARG GITHUB_SHA
ENV GITHUB_SHA=${GITHUB_SHA}
RUN echo "GITHUB_SHA: ${GITHUB_SHA}" >> _config.yml

ARG EGAPRO_SENTRY_DSN
ENV EGAPRO_SENTRY_DSN=${EGAPRO_SENTRY_DSN}
RUN echo "sentry-dsn: '$EGAPRO_SENTRY_DSN'" >> _config.yml

RUN echo "version: `date +"%Y.%m.%d"`" >> _config.yml

ARG BASE_URL
ENV BASE_URL=${BASE_URL}
RUN if [ -z "$BASE_URL" ]; then jekyll build; else jekyll build --baseurl $BASE_URL; fi

FROM ghcr.io/socialgouv/docker/nginx:7.1.0

COPY --from=builder --chown=nginx:nginx /home/jekyll/_site /usr/share/nginx/html
