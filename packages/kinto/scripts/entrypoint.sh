#!/usr/bin/env sh

export KINTO_URL=http://$KINTO_SERVER:8888/v1

# Wait for kinto-server to be up
while ! nc -z $KINTO_SERVER 8888;
        do
          echo sleeping;
          sleep 1;
        done;
        echo Connected!;

# init kinto with admin account
node ./src/index.js
