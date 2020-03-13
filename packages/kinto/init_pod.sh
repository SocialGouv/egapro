#!/bin/sh
# Requires an "/root/env" file with the following environment variables to be set (from the rancher secrets)
# - AZURE_STORAGE_ACCOUNT_NAME the azure file storage account name
# - AZURE_STORAGE_ACCOUNT_KEY the azure file storage account key
# - AZURE_STORAGE_ACCOUNT_NAME_EXPORT the azure file storage account name to upload the final exported file
# - AZURE_STORAGE_ACCOUNT_KEY_EXPORT the azure file storage account key to upload the final exported file
# - AZURE_STORAGE_ACCOUNT_NAME_EXPORT_BLOB the azure blob storage account name to upload the .csv and .xlsx exports of the declarations from the companies with 1000+ employees
# - AZURE_STORAGE_ACCOUNT_KEY_EXPORT_BLOB the azure blob storage account key to upload the .csv and .xlsx exports of the declarations from the companies with 1000+ employees
# - PGPASSWORD the preprod posgresql password
# - PG_PROD_PASSWORD the prod posgresql password
# - KINTO_ADMIN_PASSWORD the kinto password for the "admin" user
# - ES_ID the ID of the elasticsearch cloud ID
# - ES_USERNAME the elasticsearch username
# - ES_PASSWORD the elasticsearch password
#
# It also requires the solen export files to be in the "exports" azure file share ...
# - DNUM - EXPORT SOLEN 2019.xlsx
# - DNUM - EXPORT SOLEN 2020.xlsx
#
# ... and the latest kinto prod backups in the "egapro-backup-restore" azure file share
# - LATEST (contains the filename off the latest dump)
# - the latest dump itself
#
# The script will then upload the final exports to the "exports" azure file share
# - dump_declarations_records.json
# - dump_declarations_records.xlsx
#
# For convenience, this script maybe be run at regular intervals using a cronjob:
# $ apt install cron vim procps
# $ /etc/init.d/cron start
# $ crontab -e
#       0 */2 * * * /root/init_pod.sh > /tmp/init_pod.sh.log 2>&1

echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo ">>> RUNNING SCRIPT" `date`

set -e

# export the env variables listed at the top of this file
. ./env

echo ">>> APT UPDATE"
apt update
apt install -y vim python3 python3-pip wget curl httpie git postgresql-client

# Install nodejs
curl -sL https://deb.nodesource.com/setup_13.x | bash -
apt-get install -y nodejs

# Install azure cli
if [ ! -f "/usr/bin/az" ]; then
    curl -sL https://aka.ms/InstallAzureCLIDeb | bash
fi

if [ ! -f "/usr/local/bin/pipenv" ]; then
    pip3 install pipenv
fi

echo ">>> GIT CLONE EGAPRO"
if [ ! -d "/root/egapro" ]; then
    git clone https://github.com/SocialGouv/egapro
fi

if [ -d "/root/egapro" ]; then
    cd egapro
    git checkout script-init_pod-preprod-consolidation-donnees
    git pull
    cd ..
fi


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
psql -h egapro-preprod-pg-postgresql -U postgres -c "ALTER USER postgres WITH PASSWORD '$PG_PROD_PASSWORD'"
# Cleanup some stuff that will prevent the restore
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -c "DROP DATABASE egapro"
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -c "ALTER DATABASE template1 OWNER TO postgres"
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -c "ALTER DATABASE postgres OWNER TO postgres"
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -c "DROP OWNED BY egapro"
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -c "DROP ROLE egapro"
set -e
# Restore the prod DB
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -f /tmp/latest_dump.sql
# Change the password back
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -c "ALTER USER postgres WITH PASSWORD '$PGPASSWORD'"

echo ">>> RESTORE THE ORIGINAL KINTO ADMIN PASSWORD"
echo '{"data": {"password": "'$KINTO_ADMIN_PASSWORD'"}}' | http PUT http://kinto:8888/v1/accounts/admin --verbose --auth 'admin:passw0rd'


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


cd egapro/packages/kinto/

echo ">>> INSTALLING PYTHON DEPENDENCIES"
/usr/local/bin/pipenv install

for solen_export in /tmp/solen_export_*.xlsx; do
    echo ">>> IMPORTING XLSX EXPORT FROM SOLEN: $solen_export"
    KINTO_SERVER=http://kinto:8888/v1 KINTO_COLLECTION=indicators_datas /usr/local/bin/pipenv run python solen.py $solen_export --progress
done

echo ">>> DUMPING DECLARATIONS TO /tmp/dump_declarations_records.json"
KINTO_SERVER=http://kinto:8888/v1 /usr/local/bin/pipenv run python dump_records.py /tmp/dump_declarations_records.json

echo ">>> CONVERTING /tmp/dump_declarations_records.json TO /tmp/dump_declarations_records.xlsx"
/usr/local/bin/pipenv run python json_to_xlsx.py /tmp/dump_declarations_records.json /tmp/dump_declarations_records.xlsx


echo ">>> UPLOADING /tmp/dump_declarations_records.json"
az storage file upload \
        --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
        --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT \
        --share-name "exports" \
        --source "/tmp/dump_declarations_records.json"

echo ">>> UPLOADING /tmp/dump_declarations_records.xlsx"
az storage file upload \
        --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
        --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT \
        --share-name "exports" \
        --source "/tmp/dump_declarations_records.xlsx"

echo ">>> INSTALLING NODE DEPENDENCIES"
/usr/bin/npm install

echo ">>> INDEXING /tmp/dump_declarations_records.json in ElasticSearch"
JSON_DUMP_FILENAME=/tmp/dump_declarations_records.json node index_elasticsearch.js

echo ">>> EXPORTING THE DECLARATIONS FROM THE COMPANIES WITH 1000+ EMPLOYEES IN /tmp/dump_declarations_records_1000.(xlsx|csvc)"
JSON_DUMP_FILENAME=/tmp/dump_declarations_records.json node prepare-xlsx-1000.js

echo ">>> UPLOADING /tmp/dump_declarations_records_1000.xlsx"
az storage blob upload \
        --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT_BLOB \
        --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT_BLOB \
        --container-name public \
        --name "index-egalite-hf.xlsx" \
        --file "/tmp/dump_declarations_records_1000.xlsx"

echo ">>> UPLOADING /tmp/dump_declarations_records_1000.csv"
az storage blob upload \
        --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT_BLOB \
        --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT_BLOB \
        --container-name public \
        --name "index-egalite-hf.csv" \
        --file "/tmp/dump_declarations_records_1000.csv"

echo ">>> DONE!"
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo
echo
echo
echo
