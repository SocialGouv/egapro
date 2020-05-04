#!/bin/sh

# This script goes hand in hand with export.sh

# Requires the following environment variables to be set (from the rancher secrets)
# - AZURE_STORAGE_ACCOUNT_NAME the azure file storage account name
# - AZURE_STORAGE_ACCOUNT_KEY the azure file storage account key
# - AZURE_STORAGE_ACCOUNT_NAME_EXPORT the azure file storage account name to upload the final exported file
# - AZURE_STORAGE_ACCOUNT_KEY_EXPORT the azure file storage account key to upload the final exported file
# - PGPASSWORD the preprod posgresql password
# - PG_PROD_PASSWORD the prod posgresql password
# - KINTO_ADMIN_PASSWORD the kinto password for the "admin" user
# - KINTO_PROD_ADMIN_PASSWORD the kinto password for the "admin" user on production
# And the following environments variables that aren't secrets
# - POSTGRESQL_SERVER the adress of the "local" postgresql server to use
#
# It also requires the solen export files to be in the "exports" azure file share ...
# - DNUM - EXPORT SOLEN 2019.xlsx
# - DNUM - EXPORT SOLEN 2020.xlsx
#
# ... and the latest kinto prod backups in the "egapro-backup-restore" azure file share
# - LATEST (contains the filename off the latest dump)
# - the latest dump itself


echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo ">>> RUNNING IMPORT SCRIPT" `date`

set -e

echo ">>> DOWNLOAD 'LATEST' FILE CONTAINING LATEST DUMP NAME"
az storage file download \
  --account-name $AZURE_STORAGE_ACCOUNT_NAME \
  --account-key $AZURE_STORAGE_ACCOUNT_KEY \
  --share-name "egapro-backup-restore" \
  -p "LATEST" \
  --dest "/tmp/"

export DUMP_NAME=$(cat /tmp/LATEST)

echo ">>> DOWNLOADING LATEST BACKUP: $DUMP_NAME"
if [ ! -f "/tmp/$DUMP_NAME" ]; then
  az storage file download \
    --account-name $AZURE_STORAGE_ACCOUNT_NAME \
    --account-key $AZURE_STORAGE_ACCOUNT_KEY \
    --share-name "egapro-backup-restore" \
    -p "$DUMP_NAME" \
    --dest "/tmp/latest_dump.sql"
fi


echo ">>> RESTORING LATEST BACKUP: $DUMP_NAME"
# Change the preprod postgres user's password to be the prod's one (needed for the restore)
set +e
psql -h $POSTGRESQL_SERVER -U postgres -c "ALTER USER postgres WITH PASSWORD '$PG_PROD_PASSWORD'"
# Cleanup some stuff that will prevent the restore
PGPASSWORD=$PG_PROD_PASSWORD psql -h $POSTGRESQL_SERVER -U postgres -c "DROP DATABASE egapro"
PGPASSWORD=$PG_PROD_PASSWORD psql -h $POSTGRESQL_SERVER -U postgres -c "ALTER DATABASE template1 OWNER TO postgres"
PGPASSWORD=$PG_PROD_PASSWORD psql -h $POSTGRESQL_SERVER -U postgres -c "ALTER DATABASE postgres OWNER TO postgres"
PGPASSWORD=$PG_PROD_PASSWORD psql -h $POSTGRESQL_SERVER -U postgres -c "DROP OWNED BY egapro"
PGPASSWORD=$PG_PROD_PASSWORD psql -h $POSTGRESQL_SERVER -U postgres -c "DROP ROLE egapro"
set -e
# Restore the prod DB
PGPASSWORD=$PG_PROD_PASSWORD psql -h $POSTGRESQL_SERVER -U postgres -f /tmp/latest_dump.sql
# Change the password back
PGPASSWORD=$PG_PROD_PASSWORD psql -h $POSTGRESQL_SERVER -U postgres -c "ALTER USER postgres WITH PASSWORD '$PGPASSWORD'"

echo ">>> RESTORE THE ORIGINAL KINTO ADMIN PASSWORD"
STATUSCODE=$(curl --silent --write-out "%{http_code}" --fail --output /dev/null -X PUT -H "Content-Type: application/json" -d "{\"data\": {\"password\": \"$KINTO_ADMIN_PASSWORD\"}}" --user admin:$KINTO_PROD_ADMIN_PASSWORD http://kinto:8888/v1/accounts/admin)
if test $STATUSCODE -ne 200; then
  echo "Failure while restoring the original kinto admin password:" $STATUSCODE
  exit 1
fi


echo ">>> DOWNLOADING 'DNUM - EXPORT SOLEN 2019.xlsx'"
az storage file download \
  --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
  --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT \
  --share-name "exports" \
  -p "DNUM - EXPORT SOLEN 2019.xlsx" \
  --dest "/tmp/solen_export_2019.xlsx"

echo ">>> DOWNLOADING 'DNUM - EXPORT SOLEN 2020.xlsx'"
az storage file download \
  --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
  --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT \
  --share-name "exports" \
  -p "DNUM - EXPORT SOLEN 2020.xlsx" \
  --dest "/tmp/solen_export_2020.xlsx"

echo ">>> IMPORTING XLSX EXPORT FROM SOLEN: /tmp/solen_export_2019.xlsx"
KINTO_SERVER=http://kinto:8888/v1 KINTO_COLLECTION=indicators_datas /app/venv/bin/python solen.py /tmp/solen_export_2019.xlsx 2019 --progress

echo ">>> IMPORTING XLSX EXPORT FROM SOLEN: /tmp/solen_export_2020.xlsx"
KINTO_SERVER=http://kinto:8888/v1 KINTO_COLLECTION=indicators_datas /app/venv/bin/python solen.py /tmp/solen_export_2020.xlsx 2020 --progress

echo ">>> DONE IMPORTING!"
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo
echo
echo
echo
