FROM debian:stable-slim

ARG POSTGRESQL_SERVER
ENV POSTGRESQL_SERVER=${POSTGRESQL_SERVER}

ARG BRANCH_NAME
ENV BRANCH_NAME=${BRANCH_NAME}

RUN set -ex \
    && apt-get update \
    && apt-get install -y \
        curl \
        git \
        postgresql-client \
        python3 \
        python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*  \
    \
    # Install nodejs
    && curl -sL https://deb.nodesource.com/setup_13.x | bash - && apt-get install -y nodejs \
    \
    # Install azure cli
    && curl -sL https://aka.ms/InstallAzureCLIDeb | bash \
    \
    # Install pipenv
    && pip3 install pipenv


# Clone egapro, then checkout the proper branch to run the script
ENTRYPOINT git clone https://github.com/SocialGouv/egapro && \
    cd egapro && \
    git checkout ${BRANCH_NAME} && \
    git pull && \
    chmod +x packages/import-export/import-export.sh && \
    packages/import-export/import-export.sh