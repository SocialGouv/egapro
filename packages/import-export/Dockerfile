FROM mcr.microsoft.com/azure-cli:2.3.0

WORKDIR /app

COPY ./import-export.sh /app/import-export.sh
COPY ./frozen-requirements.txt /app/frozen-requirements.txt
COPY ./solen.py /app/solen.py
COPY ./json-schema.json /app/json-schema.json
COPY ./dump_records.py /app/dump_records.py
COPY ./json_to_xlsx.py /app/json_to_xlsx.py
COPY ./package.json /app/package.json
COPY ./index_elasticsearch.js /app/index_elasticsearch.js
COPY ./prepare-xlsx-1000.js /app/prepare-xlsx-1000.js

RUN set -ex \
  \
  && apk add --no-cache postgresql-client=~12 \
  \
  && apk add --no-cache nodejs=~12 npm=~12

ENTRYPOINT ["/app/import-export.sh"]
