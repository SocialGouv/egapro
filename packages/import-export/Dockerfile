FROM mcr.microsoft.com/azure-cli:2.3.0

WORKDIR /app

COPY \
  ./dump_records.py \
  ./frozen-requirements.txt \
  ./import-export.sh \
  ./index_elasticsearch.js \
  ./json_to_xlsx.py \
  ./json-schema.json \
  ./package.json \
  ./prepare-xlsx-1000.js \
  ./solen.py \
  /app/

RUN set -ex \
  \
  && apk add --no-cache postgresql-client=~12 \
  \
  && apk add --no-cache nodejs=~12 npm=~12

ENTRYPOINT ["/app/import-export.sh"]
