#!/bin/sh
set -eu

SRC_REALM="/opt/keycloak/data/import/realm-export.json"
RUNTIME_REALM="/tmp/realm-export.runtime.json"

: "${EGAPRO_ORIGIN:?EGAPRO_ORIGIN must be set (e.g. https://egapro-xxx.ovh.fabrique.social.gouv.fr)}"

E2E_USERNAME="${E2E_USERNAME:-testuser}"
E2E_PASSWORD="${E2E_PASSWORD:-password}"

cp "$SRC_REALM" "$RUNTIME_REALM"

ESCAPED=$(printf '%s' "$EGAPRO_ORIGIN" | sed 's/[&]/\\&/g')
sed -i "s|__EGAPRO_ORIGIN__|$ESCAPED|g" "$RUNTIME_REALM"
sed -i "s|__E2E_USERNAME__|$E2E_USERNAME|g" "$RUNTIME_REALM"
sed -i "s|__E2E_PASSWORD__|$E2E_PASSWORD|g" "$RUNTIME_REALM"

 /opt/keycloak/bin/kc.sh import --file "$RUNTIME_REALM" --override true

exec /opt/keycloak/bin/kc.sh start-dev
