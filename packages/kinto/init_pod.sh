# Requires the following environment variables to be set (from the rancher secrets)
# - $AZURE_STORAGE_ACCOUNT_NAME the azure file storage account name
# - $AZURE_STORAGE_ACCOUNT_KEY the azure file storage account key
# - $AZURE_STORAGE_ACCOUNT_NAME_EXPORT the azure file storage account name to upload the final exported file
# - $AZURE_STORAGE_ACCOUNT_KEY_EXPORT the azure file storage account key to upload the final exported file
# - $PGPASSWORD the preprod posgresql password
# - $PG_PROD_PASSWORD the prod posgresql password
# - $KINTO_ADMIN_PASSWORD the kinto password for the "admin" user

# It also requires the following files:
# - latest SOLEN export files in /tmp/solen_export_*.xlsx

set -e

echo ">>> APT UPDATE"
apt update
apt install -y vim python3 python3-pip wget curl httpie git postgresql-client

if [ ! -f "/usr/bin/az" ]; then
    curl -sL https://aka.ms/InstallAzureCLIDeb | bash
fi

if [ ! -f "/usr/local/bin/pipenv" ]; then
    pip3 install pipenv
fi

echo ">>> GIT CLONE EGAPRO"
if [ -d "/root/egapro" ]; then
    cd egapro
    git checkout 523-amelioration-import-solen
    git pull
    cd ..
fi

if [ ! -d "/root/egapro" ]; then
    git clone https://github.com/SocialGouv/egapro
fi

echo ">>> DOWNLOAD 'LATEST' FILE CONTAINING LATEST DUMP NAME"
az storage file download \
    --account-name $AZURE_STORAGE_ACCOUNT_NAME \
    --account-key $AZURE_STORAGE_ACCOUNT_KEY \
    --share-name "egapro-backup-restore" \
    -p LATEST \
    --dest /tmp/

export DUMP_NAME=$(cat /tmp/LATEST)

echo ">>> DOWNLOADING LATEST BACKUP: $DUMP_NAME"
if [ ! -f "/tmp/$DUMP_NAME" ]; then
    az storage file download \
        --account-name $AZURE_STORAGE_ACCOUNT_NAME \
        --account-key $AZURE_STORAGE_ACCOUNT_KEY \
        --share-name "egapro-backup-restore" \
        -p $DUMP_NAME \
        --dest /tmp/
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
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -f /tmp/$DUMP_NAME
# Change the password back
PGPASSWORD=$PG_PROD_PASSWORD psql -h egapro-preprod-pg-postgresql -U postgres -c "ALTER USER postgres WITH PASSWORD '$PGPASSWORD'"

echo ">>> RESTORE THE ORIGINAL KINTO ADMIN PASSWORD"
echo '{"data": {"password": "'$KINTO_ADMIN_PASSWORD'"}}' | http PUT http://kinto:8888/v1/accounts/admin --verbose --auth 'admin:passw0rd'


for solen_export in /tmp/solen_export_*.xlsx; do
    echo ">>> IMPORTING XLSX EXPORT FROM SOLEN: $solen_export"
    cd egapro/packages/kinto/
    pipenv install
    KINTO_SERVER=http://kinto:8888/v1 KINTO_COLLECTION=indicators_datas pipenv run python solen.py $solen_export --progress
done

echo ">>> DUMPING DECLARATIONS TO /tmp/dump_declarations_records.json"
KINTO_SERVER=http://kinto:8888/v1 pipenv run python dump_records.py /tmp/dump_declarations_records.json

echo ">>> CONVERTING /tmp/dump_declarations_records.json TO /tmp/dump_declarations_records.xlsx"
KINTO_SERVER=http://kinto:8888/v1 pipenv run python json_to_xlsx.py /tmp/dump_declarations_records.json /tmp/dump_declarations_records.xlsx


echo ">>> UPLOADING /tmp/dump_declarations_records.json"
az storage file upload \
        --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
        --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT== \
        --share-name "exports" \
        --source /tmp/dump_declarations_records.json

echo ">>> UPLOADING /tmp/dump_declarations_records.xlsx"
az storage file upload \
        --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
        --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT== \
        --share-name "exports" \
        --source /tmp/dump_declarations_records.xlsx