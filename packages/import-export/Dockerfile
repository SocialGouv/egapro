FROM debian:stable-slim

ARG POSTGRESQL_SERVER
ENV POSTGRESQL_SERVER=${POSTGRESQL_SERVER}

ARG BRANCH_NAME
ENV BRANCH_NAME=${BRANCH_NAME}

RUN apt-get update && apt-get install -y \
    curl \
    git \
    postgresql-client \
    python3 \
    python3-pip

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash - && apt-get install -y nodejs
# Install azure cli
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
# Install pipenv
RUN pip3 install pipenv


# Clone egapro, then checkout the proper branch to run the script
ENTRYPOINT git clone https://github.com/SocialGouv/egapro && \
    cd egapro && \
    git checkout ${BRANCH_NAME} && \
    git pull && \
    chmod +x packages/import-export/import-export.sh && \
    packages/import-export/import-export.sh