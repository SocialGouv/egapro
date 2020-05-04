FROM debian:stable-slim

WORKDIR /app

COPY \
  ./yarn.lock \
  ./dump_records.py \
  ./frozen-requirements.txt \
  ./import.sh \
  ./export.sh \
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
  # pip and python dependencies
  && python3 -m venv /app/venv \
  && /app/venv/bin/pip install -r frozen-requirements.txt \

  \
  # node and yarn and dependencies
  && curl -sL https://deb.nodesource.com/setup_13.x | bash - && apt-get install -y nodejs \
  && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt update && apt install yarn \
  && yarn --frozen-lockfile \
  \
  # azure cli
  && curl -sL https://aka.ms/InstallAzureCLIDeb | bash \
  \
  # cleanup
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENTRYPOINT "echo 'overload this entrypoint to run either import.sh or export.sh'"
