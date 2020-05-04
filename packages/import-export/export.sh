#!/bin/sh

# This script goes hand in hand with import.sh

# Requires the following environment variables to be set (from the rancher secrets)
# - KINTO_ADMIN_PASSWORD the kinto password for the "admin" user
# - AZURE_STORAGE_ACCOUNT_NAME_EXPORT_BLOB the azure blob storage account name to upload the .csv and .xlsx exports of the declarations from the companies with 1000+ employees
# - AZURE_STORAGE_ACCOUNT_KEY_EXPORT_BLOB the azure blob storage account key to upload the .csv and .xlsx exports of the declarations from the companies with 1000+ employees
# - ES_ID the ID of the elasticsearch cloud ID
# - ES_USERNAME the elasticsearch username
# - ES_PASSWORD the elasticsearch password
# - ENV_SUFFIX which is either empty (on prod and preprod) or the BRANCH_HASH

# The script will upload the final exports to the "exports" azure file share
# - dump_declarations_records.json
# - dump_declarations_records.xlsx


echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo ">>> RUNNING EXPORT SCRIPT" `date`

set -e


echo ">>> DUMPING DECLARATIONS TO /tmp/dump_declarations_records.json"
KINTO_SERVER=http://kinto:8888/v1 /app/venv/bin/python dump_records.py /tmp/dump_declarations_records.json

echo ">>> CONVERTING /tmp/dump_declarations_records.json TO /tmp/dump_declarations_records.xlsx"
/app/venv/bin/python json_to_xlsx.py /tmp/dump_declarations_records.json /tmp/dump_declarations_records.xlsx


echo ">>> UPLOADING /tmp/dump_declarations_records.json as dump_declarations_records$ENV_SUFFIX.json"
az storage file upload \
  --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
  --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT \
  --share-name "exports" \
  --source "/tmp/dump_declarations_records.json" \
  --path "dump_declarations_records$ENV_SUFFIX.json"

echo ">>> UPLOADING /tmp/dump_declarations_records.xlsx as dump_declarations_records$ENV_SUFFIX.xlsx"
az storage file upload \
  --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT \
  --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT \
  --share-name "exports" \
  --source "/tmp/dump_declarations_records.xlsx" \
  --path "dump_declarations_records$ENV_SUFFIX.xlsx"

echo ">>> INDEXING /tmp/dump_declarations_records.json in ElasticSearch"
JSON_DUMP_FILENAME=/tmp/dump_declarations_records.json node index_elasticsearch.js

echo ">>> EXPORTING THE DECLARATIONS FROM THE COMPANIES WITH 1000+ EMPLOYEES IN /tmp/dump_declarations_records_1000.(xlsx|csvc)"
JSON_DUMP_FILENAME=/tmp/dump_declarations_records.json node prepare-xlsx-1000.js

echo ">>> UPLOADING /tmp/dump_declarations_records_1000.xlsx as index-egalite-hf$ENV_SUFFIX.xlsx"
az storage blob upload \
  --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT_BLOB \
  --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT_BLOB \
  --container-name public \
  --name "index-egalite-hf$ENV_SUFFIX.xlsx" \
  --file "/tmp/dump_declarations_records_1000.xlsx"

echo ">>> UPLOADING /tmp/dump_declarations_records_1000.csv as index-egalite-hf$ENV_SUFFIX.csv"
az storage blob upload \
  --account-name $AZURE_STORAGE_ACCOUNT_NAME_EXPORT_BLOB \
  --account-key $AZURE_STORAGE_ACCOUNT_KEY_EXPORT_BLOB \
  --container-name public \
  --name "index-egalite-hf$ENV_SUFFIX.csv" \
  --file "/tmp/dump_declarations_records_1000.csv"

echo ">>> DONE EXPORTING!"
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo
echo
echo
echo
