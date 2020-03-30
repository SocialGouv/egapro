FROM debian:stable-slim

ARG POSTGRESQL_SERVER
ENV POSTGRESQL_SERVER=${POSTGRESQL_SERVER}

ARG BRANCH_NAME
ENV BRANCH_NAME=${BRANCH_NAME}

WORKDIR /app

RUN set -ex \
    && apt-get update \
    && apt-get install -y \
        curl \
        git \
        postgresql-client \
        python3 \
        python3-venv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*  \
    \
    # Install pip and pipenv
    && python3 -m venv /app/venv \
    && /app/venv/bin/pip install pipenv \
    \
    # Install nodejs
    && curl -sL https://deb.nodesource.com/setup_13.x | bash - && apt-get install -y nodejs \
    \
    # Install azure cli
    && curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Clone egapro, then checkout the proper branch to run the script
ENTRYPOINT git clone https://github.com/SocialGouv/egapro && \
    cd egapro && \
    git fetch && \
    git checkout --track origin/${BRANCH_NAME} && \
    git pull && \
    chmod +x packages/import-export/import-export.sh && \
    packages/import-export/import-export.sh