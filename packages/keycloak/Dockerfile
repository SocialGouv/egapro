FROM quay.io/keycloak/keycloak:21.1.1 AS builder
COPY packages/keycloak/realm-export.json /opt/keycloak/data/import/realm-export.json
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:21.1.1
COPY --from=builder /opt/keycloak/ /opt/keycloak/

USER root
COPY packages/keycloak/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod 0755 /docker-entrypoint.sh

USER 1000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["start-dev", "--import-realm"]
