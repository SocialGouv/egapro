FROM dpage/pgadmin4:6.20

ENV PGHOST=host.docker.internal
ENV PGDATABASE=egapro
ENV PGPORT=5437
ENV PGUSER=postgres
ENV PGPASSWORD=postgres
ENV PGSSLMODE=prefer

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
