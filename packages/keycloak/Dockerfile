FROM quay.io/keycloak/keycloak:21.1.1

ENV KC_HTTP_PORT=8080

COPY keycloak/realm-export.json /opt/keycloak/data/import/realm-export.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]