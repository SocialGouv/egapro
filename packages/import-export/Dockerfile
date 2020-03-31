FROM mcr.microsoft.com/azure-cli:2.3.0

WORKDIR /app

COPY ./import-export.sh /app/import-export.sh

RUN set -ex \
  \
  && apk add --no-cache postgresql-client=~12 \
  \
  && pip install pipenv \
  \
  && apk add --no-cache nodejs=~12

ENTRYPOINT ["/app/import-export.sh"]
