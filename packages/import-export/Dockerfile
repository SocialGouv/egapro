FROM debian:stable-slim

ARG POSTGRESQL_SERVER
ENV POSTGRESQL_SERVER=${POSTGRESQL_SERVER}

COPY . /app
WORKDIR /app

RUN ["chmod", "+x", "./init_pod.sh"]
ENTRYPOINT ["./init_pod.sh"]
