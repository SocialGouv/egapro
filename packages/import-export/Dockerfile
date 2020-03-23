FROM debian:stable-slim

ARG POSTGRESQL_SERVER
ENV POSTGRESQL_SERVER=${POSTGRESQL_SERVER}

RUN apt-get update && apt-get install -y \
    curl \
    git \
    httpie \
    postgresql-client \
    python3 \
    python3-pip \
    vim \
    wget

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash - && apt-get install -y nodejs
# Install azure cli
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
RUN pip3 install pipenv

COPY ./import-export.sh /import-export.sh

RUN ["chmod", "+x", "./import-export.sh"]
ENTRYPOINT ["./import-export.sh"]
