FROM debian:stable-slim

WORKDIR /app

COPY \
  ./yarn.lock \
  ./dump_records.py \
  ./frozen-requirements.txt \
  ./import-export.sh \
  ./index_elasticsearch.js \
  ./json-schema.json \
  ./json_to_xlsx.py \
  ./package.json \
  ./prepare-xlsx-1000.js \
  ./solen.py \
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
  # pip
  && python3 -m venv /app/venv \
  \
  # node and yarn
  && curl -sL https://deb.nodesource.com/setup_13.x | bash - && apt-get install -y nodejs \
  && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt update && apt install yarn \
  \
  # azure cli
  && curl -sL https://aka.ms/InstallAzureCLIDeb | bash \
  \
  # cleanup
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/app/import-export.sh"]
