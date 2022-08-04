FROM jekyll/jekyll:4 as builder

WORKDIR /home/jekyll

COPY . .
RUN chown 1000:1000 -R .

ENV GEM_HOME=/home/jekyll/gems


ARG EGAPRO_API_URL
ENV EGAPRO_API_URL=${EGAPRO_API_URL}
RUN echo "EGAPRO_API_URL: ${EGAPRO_API_URL}" >> _config.yml

ARG EGAPRO_SENTRY_DSN
ENV EGAPRO_SENTRY_DSN=${EGAPRO_SENTRY_DSN}
RUN echo "sentry-dsn: '$SENTRY_DSN'" >> _config.yml

RUN echo "version: `date +"%Y.%m.%d"`" >> _config.yml

ARG BASE_URL
ENV BASE_URL=${BASE_URL}
RUN if [ -z "$BASE_URL" ]; then jekyll build; else jekyll build --baseurl $BASE_URL; fi

FROM ghcr.io/socialgouv/docker/nginx:7.1.0

COPY --from=builder --chown=nginx:nginx /home/jekyll/_site /usr/share/nginx/html
