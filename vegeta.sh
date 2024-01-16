#!/usr/bin/env bash

cat requests.http | exec vegeta attack -format http -max-connections 100 -duration 5s | tee results.bin | vegeta report
#echo "GET http://egapro-preprod.dev.fabrique.social.gouv.fr" | exec vegeta attack -max-connections 100 -duration 5s
