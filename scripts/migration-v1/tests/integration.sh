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
  PGSERVICEFILE="$WORK/pg_service.conf" PGSERVICE=target \
    psql --no-psqlrc --set ON_ERROR_STOP=1 --tuples-only --no-align "$@"
}

WORK=$(mktemp -d /tmp/egapro-v1-migration-test.XXXXXX)
TARGET_CONTAINER="egapro-v1-migration-test-${RANDOM}-$$"

docker run --detach --name "$TARGET_CONTAINER" \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --publish 127.0.0.1::5432 "$POSTGRES_IMAGE" >/dev/null
wait_for_target

docker exec "$TARGET_CONTAINER" createdb --username postgres legacy
docker exec "$TARGET_CONTAINER" createdb --username postgres target
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname legacy \
  --set ON_ERROR_STOP=1 <"$KIT_DIR/sql/source-schema.sql" >/dev/null
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname legacy \
  --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/fixtures/source.sql" >/dev/null
docker exec --interactive "$TARGET_CONTAINER" psql --username postgres --dbname target \
  --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/fixtures/target.sql" >/dev/null

target_port=$(docker port "$TARGET_CONTAINER" 5432/tcp | sed 's/.*://')
cat >"$WORK/pg_service.conf" <<EOF
[target]
host=127.0.0.1
port=$target_port
dbname=target
user=postgres
sslmode=disable
EOF

docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format custom --no-owner --no-privileges >"$WORK/v1 full.dump"
docker exec "$TARGET_CONTAINER" pg_dump --username postgres --dbname legacy \
  --format plain --data-only --no-owner --no-privileges \
  --table public.representation_equilibree --table public.referent >"$WORK/v1-data.sql"

"$MIGRATE" export --dump "$WORK/v1 full.dump" --format custom \
  --out "$WORK/full snapshot" >/dev/null
"$MIGRATE" verify --snapshot "$WORK/full snapshot" >/dev/null
assert_equal "custom export keeps every representation" "3" \
  "$(awk -F= '$1 == "representations_count" { print $2 }' "$WORK/full snapshot/manifest.txt")"
assert_equal "custom export keeps the full referent snapshot" "2" \
  "$(awk -F= '$1 == "referents_count" { print $2 }' "$WORK/full snapshot/manifest.txt")"

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

cp -R "$WORK/full snapshot" "$WORK/tampered snapshot"
chmod 600 "$WORK/tampered snapshot/representations.csv"
printf '\n' >>"$WORK/tampered snapshot/representations.csv"
if "$MIGRATE" verify --snapshot "$WORK/tampered snapshot" >/dev/null 2>&1; then
  fail "checksum tampering should be rejected"
fi
printf 'ok - checksum tampering is rejected\n'

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
assert_equal "dry-run leaves target data unchanged" "$before_state" "$after_state"

target_sql --command "ALTER TABLE app_referent ADD CONSTRAINT reject_source_referent CHECK (name <> 'Cellule égalité professionnelle') NOT VALID" >/dev/null
if PGSERVICEFILE="$WORK/pg_service.conf" "$MIGRATE" apply \
  --snapshot "$WORK/full snapshot" --service target >/dev/null 2>&1; then
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
  --snapshot "$WORK/full snapshot" --service target)
assert_equal "apply inserts the missing representation" "representations.insert=1" "$(grep '^representations.insert=' <<<"$apply_output")"
assert_equal "apply updates the older imported representation" "representations.update=1" "$(grep '^representations.update=' <<<"$apply_output")"
assert_equal "apply replaces the referent directory" "referents.replace=true" "$(grep '^referents.replace=' <<<"$apply_output")"

assert_equal "an imported declaration receives every mapped percentage" "45.00:55.00:40.00:60.00" \
  "$(target_sql --command "SELECT executive_women_percent || ':' || executive_men_percent || ':' || member_women_percent || ':' || member_men_percent FROM app_representation_declaration WHERE siren = '800000001'")"
assert_equal "an existing company is never overwritten" "Existing company" \
  "$(target_sql --command "SELECT name FROM app_company WHERE siren = '800000001'")"
assert_equal "a native V2 declaration is never overwritten" "10.00:draft" \
  "$(target_sql --command "SELECT executive_women_percent || ':' || status FROM app_representation_declaration WHERE siren = '800000002'")"
assert_equal "the JS leap-day period calculation is preserved" "2023-03-02:2024-02-29" \
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
