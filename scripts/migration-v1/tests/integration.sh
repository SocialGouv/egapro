#!/usr/bin/env bash

set -Eeuo pipefail

umask 077

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly KIT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly MIGRATE="$KIT_DIR/migrate.sh"
readonly POSTGRES_IMAGE="${MIGRATION_V1_POSTGRES_IMAGE:-postgres:14.17}"

WORK=""
TARGET_CONTAINER=""

cleanup() {
  local exit_code=$?
  if [[ -n "$TARGET_CONTAINER" ]]; then
    docker rm --force "$TARGET_CONTAINER" >/dev/null 2>&1 || true
  fi
  if [[ "${MIGRATION_V1_KEEP_TEST_WORK:-0}" != "1" && -n "$WORK" && "$WORK" == /tmp/egapro-v1-migration-test.* ]]; then
    rm -rf -- "$WORK"
  elif [[ -n "$WORK" ]]; then
    printf 'Test work directory kept at %s\n' "$WORK" >&2
  fi
  exit "$exit_code"
}
trap cleanup EXIT HUP INT TERM

fail() {
  printf 'not ok - %s\n' "$*" >&2
  exit 1
}

assert_equal() {
  local description=$1
  local expected=$2
  local actual=$3
  [[ "$actual" == "$expected" ]] || fail "$description (expected '$expected', got '$actual')"
  printf 'ok - %s\n' "$description"
}

wait_for_target() {
  local attempt
  for attempt in {1..60}; do
    if docker exec "$TARGET_CONTAINER" pg_isready --quiet --username postgres; then
      return
    fi
    sleep 1
  done
  fail "target PostgreSQL did not become ready"
}

target_sql() {
  target_sql_for target "$@"
}

target_sql_for() {
  local service=$1
  shift
  PGSERVICEFILE="$WORK/pg_service.conf" PGSERVICE="$service" \
    psql --no-psqlrc --set ON_ERROR_STOP=1 --tuples-only --no-align "$@"
}

refresh_checksums() {
  local snapshot=$1
  chmod 600 "$snapshot/SHA256SUMS"
  {
    printf '%s  manifest.txt\n' "$(sha256sum "$snapshot/manifest.txt" | awk '{print $1}')"
    printf '%s  representations.csv\n' "$(sha256sum "$snapshot/representations.csv" | awk '{print $1}')"
    printf '%s  referents.csv\n' "$(sha256sum "$snapshot/referents.csv" | awk '{print $1}')"
  } >"$snapshot/SHA256SUMS"
}

assert_header_only() {
  local description=$1
  local expected=$2
  local file=$3
  if cmp -s "$file" <(printf '%s\n' "$expected"); then
    printf 'ok - %s\n' "$description"
  else
    fail "$description"
  fi
}

WORK=$(mktemp -d /tmp/egapro-v1-migration-test.XXXXXX)
TARGET_CONTAINER="egapro-v1-migration-test-${RANDOM}-$$"

docker run --detach --name "$TARGET_CONTAINER" \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --publish 127.0.0.1::5432 "$POSTGRES_IMAGE" >/dev/null
wait_for_target

docker exec "$TARGET_CONTAINER" createdb --username postgres legacy
docker exec "$TARGET_CONTAINER" createdb --username postgres target
docker exec "$TARGET_CONTAINER" createdb --username postgres target_split
docker exec "$TARGET_CONTAINER" createdb --username postgres target_repeq_only
docker exec "$TARGET_CONTAINER" createdb --username postgres target_referents_only
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname legacy \
  --set ON_ERROR_STOP=1 <"$KIT_DIR/sql/source-schema.sql" >/dev/null
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname legacy \
  --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/fixtures/source.sql" >/dev/null
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname target \
  --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/fixtures/target.sql" >/dev/null
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname target_split \
  --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/fixtures/target.sql" >/dev/null
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname target_repeq_only \
  --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/fixtures/target.sql" >/dev/null
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname target_referents_only \
  --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/fixtures/target.sql" >/dev/null
docker exec "$TARGET_CONTAINER" psql --username postgres --dbname target_repeq_only \
  --set ON_ERROR_STOP=1 --command 'DROP TABLE app_referent' >/dev/null
docker exec "$TARGET_CONTAINER" psql --username postgres --dbname target_repeq_only \
  --set ON_ERROR_STOP=1 --command \
  "DELETE FROM app_representation_declaration WHERE siren = '800000001'; DELETE FROM app_company WHERE siren = '800000001'" >/dev/null
docker exec "$TARGET_CONTAINER" psql --username postgres --dbname target_referents_only \
  --set ON_ERROR_STOP=1 --command 'DROP TABLE app_representation_declaration; DROP TABLE app_company' >/dev/null

target_port=$(docker port "$TARGET_CONTAINER" 5432/tcp | sed 's/.*://')
cat >"$WORK/pg_service.conf" <<EOF
[target]
host=127.0.0.1
port=$target_port
dbname=target
user=postgres
sslmode=disable

[target-split]
host=127.0.0.1
port=$target_port
dbname=target_split
user=postgres
sslmode=disable

[target-repeq-only]
host=127.0.0.1
port=$target_port
dbname=target_repeq_only
user=postgres
sslmode=disable

[target-referents-only]
host=127.0.0.1
port=$target_port
dbname=target_referents_only
user=postgres
sslmode=disable
EOF

docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format custom --no-owner --no-privileges >"$WORK/v1 full.dump"
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format custom --no-owner --no-privileges \
  --table public.representation_equilibree >"$WORK/v1-repeq.dump"
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format custom --no-owner --no-privileges \
  --table public.referent >"$WORK/v1-referents.dump"
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format plain --data-only --no-owner --no-privileges \
  --table public.representation_equilibree --table public.referent >"$WORK/v1-data.sql"
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format plain --data-only --no-owner --no-privileges \
  --table public.representation_equilibree >"$WORK/v1-repeq.sql"
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format plain --data-only --no-owner --no-privileges \
  --table public.referent >"$WORK/v1-referents.sql"

"$MIGRATE" export --dump "$WORK/v1 full.dump" --format custom \
  --out "$WORK/full snapshot" >/dev/null
"$MIGRATE" verify --snapshot "$WORK/full snapshot" >/dev/null
assert_equal "custom export keeps every representation" "3" \
  "$(awk -F= '$1 == "representations_count" { print $2 }' "$WORK/full snapshot/manifest.txt")"
assert_equal "custom export keeps the full referent snapshot" "2" \
  "$(awk -F= '$1 == "referents_count" { print $2 }' "$WORK/full snapshot/manifest.txt")"
assert_equal "combined export is the default" "all" \
  "$(awk -F= '$1 == "dataset" { print $2 }' "$WORK/full snapshot/manifest.txt")"

"$MIGRATE" export --dump "$WORK/v1-repeq.dump" --format custom \
  --dataset repeq --out "$WORK/repeq snapshot" >/dev/null
"$MIGRATE" verify --snapshot "$WORK/repeq snapshot" >/dev/null
assert_equal "repeq export records its dataset" "repeq" \
  "$(awk -F= '$1 == "dataset" { print $2 }' "$WORK/repeq snapshot/manifest.txt")"
assert_equal "repeq export omits referents" "0" \
  "$(awk -F= '$1 == "referents_count" { print $2 }' "$WORK/repeq snapshot/manifest.txt")"
assert_header_only "repeq export writes a canonical empty referent CSV" \
  "id,county,name,principal,region,type,value,substitute_name,substitute_email" \
  "$WORK/repeq snapshot/referents.csv"

"$MIGRATE" export --dump "$WORK/v1-referents.dump" --format custom \
  --dataset referents --out "$WORK/referents snapshot" >/dev/null
"$MIGRATE" verify --snapshot "$WORK/referents snapshot" >/dev/null
assert_equal "referent export records its dataset" "referents" \
  "$(awk -F= '$1 == "dataset" { print $2 }' "$WORK/referents snapshot/manifest.txt")"
assert_equal "referent export omits representations" "0" \
  "$(awk -F= '$1 == "representations_count" { print $2 }' "$WORK/referents snapshot/manifest.txt")"
assert_header_only "referent export writes a canonical empty representation CSV" \
  "siren,year,declared_at,modified_at,data" \
  "$WORK/referents snapshot/representations.csv"

if "$MIGRATE" export --dump "$WORK/v1-referents.dump" --format custom \
  --dataset repeq --out "$WORK/missing repeq snapshot" >/dev/null 2>&1; then
  fail "custom export should reject a dump missing the selected table"
fi
printf 'ok - custom export requires the selected table\n'

"$MIGRATE" export --dump "$WORK/v1 full.dump" --format custom \
  --out "$WORK/filtered snapshot" \
  --declared-at-gte '2024-03-01T00:00:00Z' \
  --declared-at-lt '2024-04-01T00:00:00Z' >/dev/null
assert_equal "the half-open range only filters representations" "1" \
  "$(awk -F= '$1 == "representations_count" { print $2 }' "$WORK/filtered snapshot/manifest.txt")"
assert_equal "the range never filters referents" "2" \
  "$(awk -F= '$1 == "referents_count" { print $2 }' "$WORK/filtered snapshot/manifest.txt")"

"$MIGRATE" export --dump "$WORK/v1-data.sql" --format plain \
  --out "$WORK/plain snapshot" >/dev/null
"$MIGRATE" verify --snapshot "$WORK/plain snapshot" >/dev/null
printf 'ok - a portable plain data dump is supported\n'

"$MIGRATE" export --dump "$WORK/v1-repeq.sql" --format plain \
  --dataset repeq --out "$WORK/plain repeq snapshot" >/dev/null
"$MIGRATE" export --dump "$WORK/v1-referents.sql" --format plain \
  --dataset referents --out "$WORK/plain referents snapshot" >/dev/null
printf 'ok - single-dataset portable plain dumps are supported\n'

cp "$WORK/v1-data.sql" "$WORK/v1-data-with-sql.sql"
printf '\nSELECT current_user;\n' >>"$WORK/v1-data-with-sql.sql"
if "$MIGRATE" export --dump "$WORK/v1-data-with-sql.sql" --format plain \
  --out "$WORK/unsafe plain snapshot" >/dev/null 2>&1; then
  fail "plain exports should reject SQL outside approved COPY blocks"
fi
if find "$WORK" -maxdepth 1 -type d -name '.unsafe plain snapshot.partial.*' | grep -q .; then
  fail "failed exports should remove their private partial directory"
fi
printf 'ok - plain exports reject SQL and clean failed partial directories\n'

cp "$WORK/v1-repeq.sql" "$WORK/v1-data-truncated.sql"
sed -i '/^\\\.$/d' "$WORK/v1-data-truncated.sql"
if "$MIGRATE" export --dump "$WORK/v1-data-truncated.sql" --format plain \
  --dataset repeq --out "$WORK/truncated plain snapshot" >/dev/null 2>&1; then
  fail "plain exports should reject truncated COPY blocks"
fi
printf 'ok - plain exports reject truncated COPY blocks\n'

if awk -F, 'NR == 1 { next } NF != 2 || $1 == "" || $2 == "" { exit 1 }' \
  "$KIT_DIR/reference/regions.csv" "$KIT_DIR/reference/departments.csv"; then
  printf 'ok - reference CSV labels satisfy the two-column no-comma invariant\n'
else
  fail "reference CSV labels should remain unquoted and comma-free"
fi

cp "$WORK/v1-repeq.sql" "$WORK/v1-repeq-unauthorized-copy.sql"
printf '\nCOPY public.unrelated_private_table (secret) FROM stdin;\nsecret\n\\.\n' \
  >>"$WORK/v1-repeq-unauthorized-copy.sql"
if "$MIGRATE" export --dump "$WORK/v1-repeq-unauthorized-copy.sql" --format plain \
  --dataset repeq --out "$WORK/unauthorized copy snapshot" >/dev/null 2>&1; then
  fail "plain exports should reject unauthorized COPY tables"
fi
printf 'ok - plain exports reject unauthorized COPY tables\n'

docker exec "$TARGET_CONTAINER" psql --username postgres --dbname legacy \
  --set ON_ERROR_STOP=1 --command \
  "UPDATE representation_equilibree SET data = data #- '{indicateurs,représentation_équilibrée,pourcentage_hommes_membres}' WHERE siren = '800000001'" >/dev/null
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format custom --no-owner --no-privileges \
  --table public.representation_equilibree >"$WORK/v1-missing-percentage.dump"
"$MIGRATE" export --dump "$WORK/v1-missing-percentage.dump" --format custom \
  --dataset repeq --out "$WORK/missing percentage snapshot" >/dev/null
if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" dry-run \
  --snapshot "$WORK/missing percentage snapshot" --service target >/dev/null 2>&1; then
  fail "submitted representations should require both percentages or a reason"
fi
printf 'ok - submitted representations require complete percentage pairs\n'

docker exec "$TARGET_CONTAINER" psql --username postgres --dbname legacy \
  --set ON_ERROR_STOP=1 --command \
  "UPDATE representation_equilibree SET data = jsonb_set(jsonb_set(data, '{indicateurs,représentation_équilibrée,pourcentage_hommes_membres}', '60'), '{déclaration,année_indicateurs}', '2022') WHERE siren = '800000001'" >/dev/null
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format custom --no-owner --no-privileges \
  --table public.representation_equilibree >"$WORK/v1-wrong-year.dump"
"$MIGRATE" export --dump "$WORK/v1-wrong-year.dump" --format custom \
  --dataset repeq --out "$WORK/wrong year snapshot" >/dev/null
if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" dry-run \
  --snapshot "$WORK/wrong year snapshot" --service target >/dev/null 2>&1; then
  fail "representation row and payload years should agree"
fi
printf 'ok - representation row and payload years must agree\n'

cp -R "$WORK/full snapshot" "$WORK/legacy snapshot"
chmod 600 "$WORK/legacy snapshot/manifest.txt"
sed -i \
  -e 's/^format_version=2$/format_version=1/' \
  -e 's/^kit_revision=2$/kit_revision=1/' \
  -e '/^dataset=/d' \
  "$WORK/legacy snapshot/manifest.txt"
refresh_checksums "$WORK/legacy snapshot"
"$MIGRATE" verify --snapshot "$WORK/legacy snapshot" >/dev/null
printf 'ok - legacy version 1 snapshots remain valid as combined snapshots\n'

cp -R "$WORK/full snapshot" "$WORK/invalid dataset snapshot"
chmod 600 "$WORK/invalid dataset snapshot/manifest.txt"
sed -i 's/^dataset=all$/dataset=invalid/' "$WORK/invalid dataset snapshot/manifest.txt"
refresh_checksums "$WORK/invalid dataset snapshot"
if "$MIGRATE" verify --snapshot "$WORK/invalid dataset snapshot" >/dev/null 2>&1; then
  fail "snapshots should reject invalid dataset metadata"
fi
printf 'ok - snapshots reject invalid dataset metadata\n'

cp -R "$WORK/repeq snapshot" "$WORK/repeq with hidden referents"
chmod 600 "$WORK/repeq with hidden referents/referents.csv"
printf 'unexpected,data\n' >>"$WORK/repeq with hidden referents/referents.csv"
refresh_checksums "$WORK/repeq with hidden referents"
if "$MIGRATE" verify --snapshot "$WORK/repeq with hidden referents" >/dev/null 2>&1; then
  fail "repeq snapshots should reject hidden referent rows"
fi
printf 'ok - repeq snapshots reject hidden referent rows\n'

cp -R "$WORK/referents snapshot" "$WORK/referents with hidden repeq"
chmod 600 "$WORK/referents with hidden repeq/representations.csv"
printf 'unexpected,data\n' >>"$WORK/referents with hidden repeq/representations.csv"
refresh_checksums "$WORK/referents with hidden repeq"
if "$MIGRATE" verify --snapshot "$WORK/referents with hidden repeq" >/dev/null 2>&1; then
  fail "referent snapshots should reject hidden representation rows"
fi
printf 'ok - referent snapshots reject hidden representation rows\n'

cp -R "$WORK/full snapshot" "$WORK/tampered snapshot"
chmod 600 "$WORK/tampered snapshot/representations.csv"
printf '\n' >>"$WORK/tampered snapshot/representations.csv"
if "$MIGRATE" verify --snapshot "$WORK/tampered snapshot" >/dev/null 2>&1; then
  fail "checksum tampering should be rejected"
fi
printf 'ok - checksum tampering is rejected\n'

cp -R "$WORK/full snapshot" "$WORK/wrong count snapshot"
chmod 600 "$WORK/wrong count snapshot/manifest.txt"
sed -i 's/^representations_count=3$/representations_count=4/' \
  "$WORK/wrong count snapshot/manifest.txt"
refresh_checksums "$WORK/wrong count snapshot"
if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" dry-run \
  --snapshot "$WORK/wrong count snapshot" --service target --dataset repeq >/dev/null 2>&1; then
  fail "target loading should reject a selected dataset count mismatch"
fi
printf 'ok - target loading rejects selected dataset count mismatches\n'

if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" dry-run \
  --snapshot "$WORK/repeq snapshot" --service target --dataset referents >/dev/null 2>&1; then
  fail "a single-dataset snapshot should reject an incompatible selection"
fi
printf 'ok - single-dataset snapshots reject incompatible selections\n'

split_referents_before=$(target_sql_for target-split --command \
  "SELECT md5(string_agg(app_referent::text, '|' ORDER BY id)) FROM app_referent")
split_repeq_output=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/full snapshot" --service target-split --dataset repeq)
assert_equal "a combined snapshot can apply repeq only" "dataset=repeq" \
  "$(grep '^dataset=' <<<"$split_repeq_output")"
assert_equal "repeq-only apply leaves referents untouched" "$split_referents_before" \
  "$(target_sql_for target-split --command "SELECT md5(string_agg(app_referent::text, '|' ORDER BY id)) FROM app_referent")"
if grep -q '^referents\.' <<<"$split_repeq_output"; then
  fail "repeq-only reports should omit referent metrics"
fi
printf 'ok - repeq-only reports omit referent metrics\n'

split_representations_before=$(target_sql_for target-split --command \
  "SELECT md5(string_agg(app_representation_declaration::text, '|' ORDER BY id)) FROM app_representation_declaration")
split_referents_output=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/full snapshot" --service target-split --dataset referents \
  --allow-referent-deletions)
assert_equal "a combined snapshot can apply referents only" "dataset=referents" \
  "$(grep '^dataset=' <<<"$split_referents_output")"
assert_equal "referent-only apply leaves representations untouched" "$split_representations_before" \
  "$(target_sql_for target-split --command "SELECT md5(string_agg(app_representation_declaration::text, '|' ORDER BY id)) FROM app_representation_declaration")"
if grep -q '^representations\.' <<<"$split_referents_output"; then
  fail "referent-only reports should omit representation metrics"
fi
printf 'ok - referent-only reports omit representation metrics\n'

repeq_only_output=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/repeq snapshot" --service target-repeq-only)
assert_equal "repeq snapshot defaults to repeq" "dataset=repeq" \
  "$(grep '^dataset=' <<<"$repeq_only_output")"
assert_equal "repeq migration works without the target referent table" "1" \
  "$(target_sql_for target-repeq-only --command "SELECT count(*) FROM app_representation_declaration WHERE siren = '800000003'")"
repeq_only_rerun=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/repeq snapshot" --service target-repeq-only --dataset repeq)
assert_equal "repeq-only rerun is idempotent" "representations.skip_unchanged=2" \
  "$(grep '^representations.skip_unchanged=' <<<"$repeq_only_rerun")"

referents_only_output=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/referents snapshot" --service target-referents-only \
  --allow-referent-deletions)
assert_equal "referent snapshot defaults to referents" "dataset=referents" \
  "$(grep '^dataset=' <<<"$referents_only_output")"
assert_equal "referent migration works without target repeq tables" "2" \
  "$(target_sql_for target-referents-only --command "SELECT count(*) FROM app_referent")"
referents_only_rerun=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/referents snapshot" --service target-referents-only --dataset referents)
assert_equal "referent-only rerun is idempotent" "referents.replace=false" \
  "$(grep '^referents.replace=' <<<"$referents_only_rerun")"

cp -R "$WORK/full snapshot" "$WORK/invalid snapshot"
chmod 600 "$WORK/invalid snapshot/referents.csv" "$WORK/invalid snapshot/SHA256SUMS"
sed -i 's/,11,email,/,99,email,/' "$WORK/invalid snapshot/referents.csv"
{
  printf '%s  manifest.txt\n' "$(sha256sum "$WORK/invalid snapshot/manifest.txt" | awk '{print $1}')"
  printf '%s  representations.csv\n' "$(sha256sum "$WORK/invalid snapshot/representations.csv" | awk '{print $1}')"
  printf '%s  referents.csv\n' "$(sha256sum "$WORK/invalid snapshot/referents.csv" | awk '{print $1}')"
} >"$WORK/invalid snapshot/SHA256SUMS"
before_state=$(target_sql --command "SELECT count(*) || ':' || (SELECT count(*) FROM app_company) || ':' || (SELECT count(*) FROM app_referent) FROM app_representation_declaration")
if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/invalid snapshot" --service target >/dev/null 2>&1; then
  fail "an invalid referent region should abort apply"
fi
after_state=$(target_sql --command "SELECT count(*) || ':' || (SELECT count(*) FROM app_company) || ':' || (SELECT count(*) FROM app_referent) FROM app_representation_declaration")
assert_equal "invalid source rows cause zero persistent writes" "$before_state" "$after_state"

before_state=$(target_sql --command "SELECT count(*) || ':' || (SELECT count(*) FROM app_company) || ':' || (SELECT count(*) FROM app_referent) FROM app_representation_declaration")
dry_run_output=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" dry-run \
  --snapshot "$WORK/full snapshot" --service target)
after_state=$(target_sql --command "SELECT count(*) || ':' || (SELECT count(*) FROM app_company) || ':' || (SELECT count(*) FROM app_referent) FROM app_representation_declaration")
assert_equal "dry-run reports one insert" "representations.insert=1" "$(grep '^representations.insert=' <<<"$dry_run_output")"
assert_equal "dry-run reports one update" "representations.update=1" "$(grep '^representations.update=' <<<"$dry_run_output")"
assert_equal "dry-run reports the native skip" "representations.skip_native=1" "$(grep '^representations.skip_native=' <<<"$dry_run_output")"
assert_equal "dry-run reports unresolved regions" "representations.unresolved_region=1" "$(grep '^representations.unresolved_region=' <<<"$dry_run_output")"
assert_equal "dry-run reports unresolved departments" "representations.unresolved_department=1" "$(grep '^representations.unresolved_department=' <<<"$dry_run_output")"
assert_equal "dry-run reports V2 referents absent from V1" "referents.delete_without_source=1" "$(grep '^referents.delete_without_source=' <<<"$dry_run_output")"
assert_equal "combined snapshot defaults to all" "dataset=all" "$(grep '^dataset=' <<<"$dry_run_output")"
assert_equal "dry-run leaves target data unchanged" "$before_state" "$after_state"

if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/full snapshot" --service target >/dev/null 2>&1; then
  fail "referent replacement should require explicit acknowledgement of deletions"
fi
assert_equal "the deletion guard rolls back the combined representation import" "0" \
  "$(target_sql --command "SELECT count(*) FROM app_representation_declaration WHERE siren = '800000003'")"
assert_equal "the deletion guard preserves V2-native referents" "1" \
  "$(target_sql --command "SELECT count(*) FROM app_referent WHERE name = 'Stale referent'")"
printf 'ok - referent replacement requires an explicit deletion acknowledgement\n'

target_sql --command "ALTER TABLE app_referent ADD CONSTRAINT reject_source_referent CHECK (name <> 'Cellule égalité professionnelle') NOT VALID" >/dev/null
if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/full snapshot" --service target \
  --allow-referent-deletions >/dev/null 2>&1; then
  fail "late target failure should abort apply"
fi
assert_equal "late failure rolls back the new declaration" "0" \
  "$(target_sql --command "SELECT count(*) FROM app_representation_declaration WHERE siren = '800000003'")"
assert_equal "late failure rolls back the new company" "0" \
  "$(target_sql --command "SELECT count(*) FROM app_company WHERE siren = '800000003'")"
assert_equal "late failure preserves the old referent" "1" \
  "$(target_sql --command "SELECT count(*) FROM app_referent WHERE name = 'Stale referent'")"
printf 'ok - a late insertion failure rolls back both datasets\n'
target_sql --command "ALTER TABLE app_referent DROP CONSTRAINT reject_source_referent" >/dev/null

apply_output=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/full snapshot" --service target --allow-referent-deletions)
assert_equal "apply inserts the missing representation" "representations.insert=1" "$(grep '^representations.insert=' <<<"$apply_output")"
assert_equal "apply updates the older imported representation" "representations.update=1" "$(grep '^representations.update=' <<<"$apply_output")"
assert_equal "apply replaces the referent directory" "referents.replace=true" "$(grep '^referents.replace=' <<<"$apply_output")"

assert_equal "an imported declaration receives every mapped percentage" "45.00:55.00:40.00:60.00" \
  "$(target_sql --command "SELECT executive_women_percent || ':' || executive_men_percent || ':' || member_women_percent || ':' || member_men_percent FROM app_representation_declaration WHERE siren = '800000001'")"
assert_equal "an existing company is never overwritten" "Existing company" \
  "$(target_sql --command "SELECT name FROM app_company WHERE siren = '800000001'")"
assert_equal "a native V2 declaration is never overwritten" "10.00:draft" \
  "$(target_sql --command "SELECT executive_women_percent || ':' || status FROM app_representation_declaration WHERE siren = '800000002'")"
assert_equal "a leap-day period remains valid in V2" "2023-03-01:2024-02-29" \
  "$(target_sql --command "SELECT reference_period_start || ':' || reference_period_end FROM app_representation_declaration WHERE siren = '800000003'")"
assert_equal "not-computable values clear their percentages" "un_seul_cadre_dirigeant:true:aucune_instance_dirigeante:true" \
  "$(target_sql --command "SELECT not_computable_reason_executives || ':' || (executive_women_percent IS NULL) || ':' || not_computable_reason_members || ':' || (member_women_percent IS NULL) FROM app_representation_declaration WHERE siren = '800000003'")"
assert_equal "unknown geography stays lenient like the Node mapper" ":999:" \
  "$(target_sql --command "SELECT coalesce(region, '') || ':' || department_code || ':' || coalesce(department_label, '') FROM app_company WHERE siren = '800000003'")"
assert_equal "the non-diffusible NAF sentinel becomes null" "t" \
  "$(target_sql --command "SELECT naf_code IS NULL FROM app_company WHERE siren = '800000003'")"
assert_equal "CSV newlines and SQL-looking text remain data" "t" \
  "$(target_sql --command "SELECT position(E'\\nSELECT * FROM app_user;' IN publish_modalities) > 0 FROM app_representation_declaration WHERE siren = '800000003'")"
assert_equal "referent UUIDs and all snapshot rows are preserved" "2" \
  "$(target_sql --command "SELECT count(*) FROM app_referent WHERE id IN ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')")"
assert_equal "empty V1 referent counties become null" "t" \
  "$(target_sql --command "SELECT county IS NULL FROM app_referent WHERE id = '22222222-2222-4222-8222-222222222222'")"
assert_equal "new companies persist their validated region code" "11" \
  "$(target_sql_for target-repeq-only --command "SELECT region_code FROM app_company WHERE siren = '800000001'")"

referent_timestamp=$(target_sql --command "SELECT min(created_at)::text FROM app_referent")
rerun_output=$(PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/full snapshot" --service target)
assert_equal "an identical rerun does not replace referents" "referents.replace=false" "$(grep '^referents.replace=' <<<"$rerun_output")"
assert_equal "an identical rerun does not churn referent timestamps" "$referent_timestamp" \
  "$(target_sql --command "SELECT min(created_at)::text FROM app_referent")"
assert_equal "an identical rerun only keeps the native representation skip" "representations.skip_native=1" \
  "$(grep '^representations.skip_native=' <<<"$rerun_output")"
assert_equal "an identical rerun skips the two imported representations" "representations.skip_unchanged=2" \
  "$(grep '^representations.skip_unchanged=' <<<"$rerun_output")"

printf 'Migration V1 integration tests passed.\n'
