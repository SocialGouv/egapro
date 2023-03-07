FROM dpage/pgadmin4:6.20

ARG PGHOST=host.docker.internal
ARG PGDATABASE=egapro
ARG PGPORT=5437
ARG PGUSER=postgres
ARG PGPASSWORD=postgres
ARG PGSSLMODE=prefer

ENV PGHOST=${PGHOST}
ENV PGDATABASE=${PGDATABASE}
ENV PGPORT=${PGPORT}
ENV PGUSER=${PGUSER}
ENV PGPASSWORD=${PGPASSWORD}
ENV PGSSLMODE=${PGSSLMODE}

ENV PGADMIN_DEFAULT_EMAIL=pgadmin@pgadmin.org
ENV PGADMIN_DEFAULT_PASSWORD=admin
ENV PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED=False
ENV PGADMIN_CONFIG_SERVER_MODE=False

USER root

COPY entrypoint.sh /entrypoint_override.sh
RUN chmod +x /entrypoint_override.sh && \
    touch /pgadmin4/servers.json && \
    chown pgadmin:root /pgadmin4/servers.json

USER pgadmin

ENTRYPOINT /entrypoint_override.sh
