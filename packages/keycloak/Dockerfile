FROM quay.io/keycloak/keycloak:21.1.1 AS builder

ENV KC_HTTP_PORT=8080

COPY keycloak/realm-export.json /opt/keycloak/data/import/realm-export.json

# Build Keycloak
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:21.1.1

COPY --from=builder /opt/keycloak/ /opt/keycloak/

ENV KC_HTTP_PORT=8080

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]