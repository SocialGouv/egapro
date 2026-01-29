FROM quay.io/keycloak/keycloak:21.1.1

ENV KC_HTTP_PORT=3000

COPY keycloak/realm-export.json /opt/keycloak/data/import/realm-export.json

CMD ["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm"]