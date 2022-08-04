.ONESHELL:

develop:
	pip install -e .[dev,test]

serve:
	gunicorn egapro.views:app -b 0.0.0.0:2626 --access-logfile=- --log-file=- --timeout 600 --worker-class roll.worker.Worker

init: SHELL := python3
init:
	import asyncio
	from egapro.views import init
	asyncio.run(init())
.PHONY: init

migrate-legacy: SHELL := python3
migrate-legacy:
	import asyncio
	from egapro.bin import migrate_from_legacy
	asyncio.run(migrate_from_legacy())
.PHONY: migrate-legacy

test:
	py.test -vv --cov
.PHONY: test

download-data:
	scp egapro.prod:/srv/egapro/data/dgt.xlsx tmp/

download-db:
	ssh egapro.dev "set -o allexport; source /srv/egapro/env; set +o allexport; PGPASSWORD=\$$EGAPRO_DBPASS pg_dump  --host \$$EGAPRO_DBHOST --user \$$EGAPRO_DBUSER \$$EGAPRO_DBNAME --file /tmp/dump.sql"

restore-db:
	pg_restore -d egapro -S postgres --clean --table declaration --table simulation --table archive --table ownership tmp/dump.psql
	psql -d egapro -c "ALTER TABLE simulation ADD PRIMARY KEY (id)"
	psql -d egapro -c "ALTER TABLE declaration ADD PRIMARY KEY (siren, year)"

deploy-docs:
	mkdocs gh-deploy
