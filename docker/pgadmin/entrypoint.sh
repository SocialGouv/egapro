#!/usr/bin/env sh

set -e

echo "$PGHOST:$PGPORT:$POSTGRES_DB:$PGUSER:$PGPASSWORD" | tee "/var/lib/pgadmin/pgpass" >/dev/null

tee /pgadmin4/servers.json >/dev/null <<EOF
{
    "Servers": {
        "1": {
            "Name": "$PGHOST",
            "Group": "Servers",
            "Host": "$PGHOST",
            "Port": $PGPORT,
            "MaintenanceDB": "postgres",
            "Username": "$PGUSER",
            "SSLMode": "$PGSSLMODE",
            "PassFile": "/var/lib/pgadmin/pgpass"
        }
    }
}
EOF

chmod 600 /var/lib/pgadmin/pgpass
chown pgadmin:root /var/lib/pgadmin/pgpass
chown pgadmin:root /pgadmin4/servers.json

exec /entrypoint.sh "$@"
