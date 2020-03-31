# This Dockerfile must be built from the root folder to give access to the yarn.lock file:
# in the egapro/ folder:
# $ docker build -f packages/import-export/Dockerfile .

FROM debian:stable-slim

WORKDIR /app

COPY \
  ./yarn.lock \
  ./packages/import-export/dump_records.py \
  ./packages/import-export/frozen-requirements.txt \
  ./packages/import-export/import-export.sh \
  ./packages/import-export/index_elasticsearch.js \
  ./packages/import-export/json-schema.json \
  ./packages/import-export/json_to_xlsx.py \
  ./packages/import-export/package.json \
  ./packages/import-export/prepare-xlsx-1000.js \
  ./packages/import-export/solen.py \
  /app/

RUN set -ex \
  # apt dependencies
  && apt-get update \
  && apt-get install -y \
    curl \
    postgresql-client \
    python3 \
    python3-venv \
  \
  # node and yarn
  && curl -sL https://deb.nodesource.com/setup_13.x | bash - && apt-get install -y nodejs \
  && curl -o- -L https://yarnpkg.com/install.sh | bash \
  \
  # azure cli
  && curl -sL https://aka.ms/InstallAzureCLIDeb | bash \
  \
  # cleanup
  && apt-get remove --purge curl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/app/import-export.sh"]
