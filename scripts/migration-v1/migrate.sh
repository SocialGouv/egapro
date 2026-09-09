#!/usr/bin/env bash

set -Eeuo pipefail

umask 077

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly POSTGRES_IMAGE="${MIGRATION_V1_POSTGRES_IMAGE:-postgres:14.17}"
readonly SNAPSHOT_VERSION="2"
readonly LEGACY_SNAPSHOT_VERSION="1"
readonly SNAPSHOT_FILES=(manifest.txt representations.csv referents.csv SHA256SUMS)
readonly REPRESENTATIONS_HEADER="siren,year,declared_at,modified_at,data"
readonly REFERENTS_HEADER="id,county,name,principal,region,type,value,substitute_name,substitute_email"

TEMP_DIR=""
CONTAINER_NAME=""
EXPORT_WORK_DIR=""

usage() {
  cat <<'EOF'
Usage:
  migrate.sh export --dump PATH --format custom|plain --out DIR
                    [--dataset all|repeq|referents]
                    [--declared-at-gte TIMESTAMPTZ] [--declared-at-lt TIMESTAMPTZ]
  migrate.sh verify --snapshot DIR
  migrate.sh dry-run --snapshot DIR --service NAME [--dataset all|repeq|referents]
                     [--pgpass PATH]
  migrate.sh apply --snapshot DIR --service NAME [--dataset all|repeq|referents]
                   [--pgpass PATH] [--allow-referent-deletions]
EOF
}

die() {
  printf 'Erreur : %s\n' "$*" >&2
  exit 1
}

cleanup() {
  local exit_code=$?

  if [[ -n "$CONTAINER_NAME" ]]; then
    docker rm --force "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
  if [[ -n "$EXPORT_WORK_DIR" && -d "$EXPORT_WORK_DIR" &&
        "$(basename "$EXPORT_WORK_DIR")" == .*".partial."?????? ]]; then
    rm -rf -- "$EXPORT_WORK_DIR"
  fi
  if [[ -n "$TEMP_DIR" && "$TEMP_DIR" == /tmp/egapro-v1-migration.* ]]; then
    rm -rf -- "$TEMP_DIR"
  fi

  exit "$exit_code"
}
trap cleanup EXIT HUP INT TERM

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "la commande '$1' est requise"
}

sha256_file() {
  local file=$1
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
  else
    die "sha256sum ou shasum est requis"
  fi
}

validate_dataset() {
  case "$1" in
    all|repeq|referents) ;;
    *) die "jeu de données attendu : all, repeq ou referents" ;;
  esac
}

dataset_includes() {
  local available=$1
  local requested=$2

  [[ "$available" == "all" || "$available" == "$requested" ]]
}

write_header_only_csv() {
  local path=$1
  local header=$2
  printf '%s\n' "$header" >"$path"
}

assert_header_only_csv() {
  local path=$1
  local header=$2
  cmp -s "$path" <(printf '%s\n' "$header") ||
    die "le fichier omis doit contenir uniquement son en-tête : $(basename "$path")"
}

absolute_existing_file() {
  local path=$1
  [[ -f "$path" && ! -L "$path" ]] || die "fichier introuvable ou lien symbolique refusé : $path"
  (cd "$(dirname "$path")" && printf '%s/%s\n' "$PWD" "$(basename "$path")")
}

absolute_path() {
  local path=$1
  local parent
  parent=$(dirname "$path")
  [[ -d "$parent" ]] || die "le répertoire parent n'existe pas : $parent"
  (cd "$parent" && printf '%s/%s\n' "$PWD" "$(basename "$path")")
}

assert_private_file() {
  local path=$1
  local mode

  [[ -f "$path" && ! -L "$path" ]] || die "fichier pgpass introuvable ou lien symbolique refusé"
  if mode=$(stat -c '%a' "$path" 2>/dev/null); then
    :
  elif mode=$(stat -f '%Lp' "$path" 2>/dev/null); then
    :
  else
    die "impossible de contrôler les permissions du fichier pgpass"
  fi
  (( (8#$mode & 077) == 0 )) || die "le fichier pgpass doit être accessible uniquement par son propriétaire (mode 600)"
}

manifest_value() {
  local manifest=$1
  local wanted=$2
  local key value found=""

  while IFS='=' read -r key value; do
    [[ "$key" == "$wanted" ]] || continue
    [[ -z "$found" ]] || die "clé dupliquée dans le manifeste : $wanted"
    found=$value
  done <"$manifest"
  [[ -n "$found" || "$wanted" == "declared_at_gte" || "$wanted" == "declared_at_lt" ]] ||
    die "clé absente du manifeste : $wanted"
  printf '%s\n' "$found"
}

verify_snapshot() {
  local snapshot=$1
  local entry file expected actual csv_count key value format_version expected_key_count dataset
  local representation_count referent_count

  [[ -d "$snapshot" && ! -L "$snapshot" ]] || die "instantané introuvable ou lien symbolique refusé : $snapshot"
  snapshot=$(cd "$snapshot" && pwd)

  while IFS= read -r entry; do
    file=$(basename "$entry")
    case "$file" in
      manifest.txt|representations.csv|referents.csv|SHA256SUMS) ;;
      *) die "fichier inattendu dans l'instantané : $file" ;;
    esac
    [[ -f "$entry" && ! -L "$entry" ]] || die "tous les éléments de l'instantané doivent être des fichiers ordinaires"
  done < <(find "$snapshot" -mindepth 1 -maxdepth 1 -print)

  for file in "${SNAPSHOT_FILES[@]}"; do
    [[ -f "$snapshot/$file" && ! -L "$snapshot/$file" ]] || die "fichier d'instantané absent : $file"
  done

  format_version=$(manifest_value "$snapshot/manifest.txt" format_version)
  case "$format_version" in
    "$LEGACY_SNAPSHOT_VERSION")
      expected_key_count=9
      dataset="all"
      ;;
    "$SNAPSHOT_VERSION")
      expected_key_count=10
      dataset=$(manifest_value "$snapshot/manifest.txt" dataset)
      validate_dataset "$dataset"
      ;;
    *) die "version d'instantané non prise en charge" ;;
  esac

  while IFS='=' read -r key value; do
    case "$format_version:$key" in
      "$LEGACY_SNAPSHOT_VERSION":format_version|"$LEGACY_SNAPSHOT_VERSION":kit_revision|"$LEGACY_SNAPSHOT_VERSION":exported_at|"$LEGACY_SNAPSHOT_VERSION":source_postgresql_version|"$LEGACY_SNAPSHOT_VERSION":declared_at_gte|"$LEGACY_SNAPSHOT_VERSION":declared_at_lt|"$LEGACY_SNAPSHOT_VERSION":representations_count|"$LEGACY_SNAPSHOT_VERSION":referents_count|"$LEGACY_SNAPSHOT_VERSION":dump_sha256) ;;
      "$SNAPSHOT_VERSION":format_version|"$SNAPSHOT_VERSION":kit_revision|"$SNAPSHOT_VERSION":dataset|"$SNAPSHOT_VERSION":exported_at|"$SNAPSHOT_VERSION":source_postgresql_version|"$SNAPSHOT_VERSION":declared_at_gte|"$SNAPSHOT_VERSION":declared_at_lt|"$SNAPSHOT_VERSION":representations_count|"$SNAPSHOT_VERSION":referents_count|"$SNAPSHOT_VERSION":dump_sha256) ;;
      *) die "clé inattendue dans le manifeste : $key" ;;
    esac
    [[ $(awk -F= -v wanted="$key" '$1 == wanted { count++ } END { print count + 0 }' "$snapshot/manifest.txt") -eq 1 ]] ||
      die "clé dupliquée dans le manifeste : $key"
  done <"$snapshot/manifest.txt"

  [[ $(wc -l <"$snapshot/manifest.txt") -eq "$expected_key_count" ]] ||
    die "nombre de clés incorrect dans le manifeste"
  [[ "$(manifest_value "$snapshot/manifest.txt" kit_revision)" == "$format_version" ]] ||
    die "révision de kit non prise en charge"
  [[ "$(manifest_value "$snapshot/manifest.txt" exported_at)" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] ||
    die "date d'export invalide dans le manifeste"
  representation_count=$(manifest_value "$snapshot/manifest.txt" representations_count)
  referent_count=$(manifest_value "$snapshot/manifest.txt" referents_count)
  [[ "$representation_count" =~ ^[0-9]+$ ]] ||
    die "compteur de représentations invalide"
  [[ "$referent_count" =~ ^[0-9]+$ ]] || die "compteur de référents invalide"
  case "$dataset" in
    all)
      [[ "$referent_count" =~ ^[1-9][0-9]*$ ]] || die "l'instantané des référents est vide ou invalide"
      ;;
    repeq)
      [[ "$referent_count" == "0" ]] || die "un instantané repeq ne doit pas contenir de référents"
      ;;
    referents)
      [[ "$representation_count" == "0" ]] || die "un instantané referents ne doit pas contenir de représentations"
      [[ "$referent_count" =~ ^[1-9][0-9]*$ ]] || die "l'instantané des référents est vide ou invalide"
      ;;
  esac
  [[ "$(manifest_value "$snapshot/manifest.txt" dump_sha256)" =~ ^[0-9a-f]{64}$ ]] ||
    die "somme SHA-256 du dump invalide dans le manifeste"
  [[ "$(head -n 1 "$snapshot/representations.csv" | tr -d '\r')" == "$REPRESENTATIONS_HEADER" ]] ||
    die "en-tête de representations.csv invalide"
  [[ "$(head -n 1 "$snapshot/referents.csv" | tr -d '\r')" == "$REFERENTS_HEADER" ]] ||
    die "en-tête de referents.csv invalide"

  [[ $(wc -l <"$snapshot/SHA256SUMS") -eq 3 ]] || die "fichier SHA256SUMS invalide"
  awk 'NF != 2 || ($2 != "manifest.txt" && $2 != "representations.csv" && $2 != "referents.csv") { exit 1 }' \
    "$snapshot/SHA256SUMS" || die "entrée inattendue dans SHA256SUMS"
  for file in manifest.txt representations.csv referents.csv; do
    expected=$(awk -v name="$file" '$2 == name { print $1 }' "$snapshot/SHA256SUMS")
    [[ "$expected" =~ ^[0-9a-f]{64}$ ]] || die "somme SHA-256 absente ou invalide pour $file"
    [[ $(awk -v name="$file" '$2 == name { count++ } END { print count + 0 }' "$snapshot/SHA256SUMS") -eq 1 ]] ||
      die "entrée SHA-256 dupliquée pour $file"
    actual=$(sha256_file "$snapshot/$file")
    [[ "$actual" == "$expected" ]] || die "somme SHA-256 incorrecte pour $file"
  done

  if [[ "$dataset" == "referents" ]]; then
    assert_header_only_csv "$snapshot/representations.csv" "$REPRESENTATIONS_HEADER"
  else
    csv_count=$(awk 'END { print (NR > 0 ? NR - 1 : 0) }' "$snapshot/representations.csv")
    # CSV fields may contain line breaks; PostgreSQL checks the authoritative
    # row count again after loading the file.
    (( csv_count >= representation_count )) || die "fichier representations.csv tronqué"
  fi

  if [[ "$dataset" == "repeq" ]]; then
    assert_header_only_csv "$snapshot/referents.csv" "$REFERENTS_HEADER"
  else
    csv_count=$(awk 'END { print (NR > 0 ? NR - 1 : 0) }' "$snapshot/referents.csv")
    (( csv_count >= referent_count )) || die "fichier referents.csv tronqué"
  fi

  printf '%s\n' "$snapshot"
}

snapshot_dataset() {
  local manifest=$1
  local format_version

  format_version=$(manifest_value "$manifest" format_version)
  if [[ "$format_version" == "$LEGACY_SNAPSHOT_VERSION" ]]; then
    printf 'all\n'
  else
    manifest_value "$manifest" dataset
  fi
}

wait_for_postgres() {
  local attempt
  for attempt in {1..60}; do
    if docker exec "$CONTAINER_NAME" psql --host 127.0.0.1 \
      --username postgres --dbname legacy \
      --no-psqlrc --tuples-only --command 'SELECT 1' >/dev/null 2>&1; then
      return
    fi
    sleep 1
  done
  die "PostgreSQL temporaire n'est pas prêt après 60 secondes"
}

sanitize_plain_dump() {
  local dump=$1
  local sanitized=$2
  local dataset=$3

  LC_ALL=C awk -v dataset="$dataset" '
    BEGIN {
      representation_header = "COPY public.representation_equilibree (siren, year, modified_at, declared_at, data, ft) FROM stdin;"
      referent_header = "COPY public.referent (id, county, name, principal, region, type, value, substitute_name, substitute_email) FROM stdin;"
      in_copy = 0
      emit = 0
      invalid = 0
    }

    function reject(message) {
      print "dump plain refusé à la ligne " NR " : " message > "/dev/stderr"
      invalid = 1
      exit 1
    }

    {
      line = $0
      sub(/\r$/, "", line)

      if (in_copy) {
        if (emit) print line
        if (line == "\\.") {
          in_copy = 0
          emit = 0
        }
        next
      }

      if (line == representation_header) {
        if (seen_representation) reject("bloc representation_equilibree dupliqué")
        seen_representation = 1
        in_copy = 1
        emit = dataset == "all" || dataset == "repeq"
        if (emit) print line
        next
      }
      if (line == referent_header) {
        if (seen_referent) reject("bloc referent dupliqué")
        seen_referent = 1
        in_copy = 1
        emit = dataset == "all" || dataset == "referents"
        if (emit) print line
        next
      }

      if (line == "" || line ~ /^--/) next
      if (line ~ /^SET (statement_timeout|lock_timeout|idle_in_transaction_session_timeout) = 0;$/) next
      if (line == "SET client_encoding = '\''UTF8'\'';") next
      if (line == "SET standard_conforming_strings = on;") next
      if (line == "SELECT pg_catalog.set_config('\''search_path'\'', '\'''\'', false);") next
      if (line == "SET check_function_bodies = false;") next
      if (line == "SET xmloption = content;") next
      if (line == "SET client_min_messages = warning;") next
      if (line == "SET row_security = off;") next

      reject("instruction hors liste blanche")
    }

    END {
      if (invalid) exit 1
      if (in_copy) {
        print "dump plain refusé : bloc COPY tronqué" > "/dev/stderr"
        exit 1
      }
      if ((dataset == "all" || dataset == "repeq") && !seen_representation) {
        print "dump plain refusé : table representation_equilibree absente" > "/dev/stderr"
        exit 1
      }
      if ((dataset == "all" || dataset == "referents") && !seen_referent) {
        print "dump plain refusé : table referent absente" > "/dev/stderr"
        exit 1
      }
    }
  ' "$dump" >"$sanitized" ||
    die "le format plain doit être un pg_dump --data-only COPY strictement limité aux tables de reprise"
}

export_snapshot() {
  local dump=$1
  local dump_format=$2
  local output=$3
  local lower_bound=$4
  local upper_bound=$5
  local dataset=$6
  local output_parent output_name work log plain_restore source_version exported_at dump_hash representation_count referent_count
  local migration_repeq migration_referents
  local -a restore_tables

  validate_dataset "$dataset"
  if [[ "$dataset" == "referents" && ( -n "$lower_bound" || -n "$upper_bound" ) ]]; then
    die "les bornes de déclaration ne s'appliquent pas au jeu de données referents"
  fi
  require_command docker
  dump=$(absolute_existing_file "$dump")
  output=$(absolute_path "$output")
  [[ ! -e "$output" ]] || die "le chemin de sortie existe déjà : $output"
  [[ "$dump_format" == "custom" || "$dump_format" == "plain" ]] || die "format attendu : custom ou plain"
  local bound
  for bound in "$lower_bound" "$upper_bound"; do
    [[ -z "$bound" || "$bound" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{2}:[0-9]{2})$ ]] ||
      die "les bornes doivent être des instants ISO 8601 avec fuseau horaire"
  done

  migration_repeq=0
  migration_referents=0
  restore_tables=()
  case "$dataset" in
    all)
      migration_repeq=1
      migration_referents=1
      restore_tables=(--table representation_equilibree --table referent)
      ;;
    repeq)
      migration_repeq=1
      restore_tables=(--table representation_equilibree)
      ;;
    referents)
      migration_referents=1
      restore_tables=(--table referent)
      ;;
  esac

  output_parent=$(dirname "$output")
  output_name=$(basename "$output")
  work=$(mktemp -d "$output_parent/.${output_name}.partial.XXXXXX")
  EXPORT_WORK_DIR=$work
  chmod 700 "$work"
  log="$work/export.log"
  : >"$log"
  chmod 600 "$log"

  plain_restore=""
  if [[ "$dump_format" == "plain" ]]; then
    plain_restore="$work/plain-data.sql"
    sanitize_plain_dump "$dump" "$plain_restore" "$dataset"
    chmod 600 "$plain_restore"
  fi

  CONTAINER_NAME="egapro-v1-migration-${RANDOM}-$$"
  local -a docker_args
  docker_args=(--detach --name "$CONTAINER_NAME" --network none
    --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_DB=legacy)
  if [[ "$dump_format" == "custom" ]]; then
    docker_args+=(--mount "type=bind,src=$dump,dst=/input/source.dump,readonly")
  fi
  docker run "${docker_args[@]}" "$POSTGRES_IMAGE" >>"$log" 2>&1 ||
    die "impossible de démarrer PostgreSQL temporaire"
  wait_for_postgres

  docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
    --no-psqlrc --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/sql/source-schema.sql" >>"$log" 2>&1 ||
    die "impossible de préparer le schéma V1 temporaire"

  if [[ "$dump_format" == "custom" ]]; then
    docker exec "$CONTAINER_NAME" pg_restore --dbname legacy --username postgres \
      --data-only --no-owner --no-privileges --exit-on-error --strict-names \
      "${restore_tables[@]}" \
      /input/source.dump >>"$log" 2>&1 ||
      die "restauration sélective du dump custom impossible"
  else
    docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
      --no-psqlrc --set ON_ERROR_STOP=1 --single-transaction \
      >>"$log" 2>&1 <"$plain_restore" ||
      die "restauration du dump plain filtré impossible"
    rm -f -- "$plain_restore"
    plain_restore=""
  fi

  docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
    --no-psqlrc --set ON_ERROR_STOP=1 \
    --set "migration_repeq=$migration_repeq" --set "migration_referents=$migration_referents" \
    --set "declared_at_gte=$lower_bound" --set "declared_at_lt=$upper_bound" \
    <"$SCRIPT_DIR/sql/validate-source.sql" >>"$log" 2>&1 ||
    die "validation des données V1 impossible"

  if (( migration_repeq )); then
    docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
      --no-psqlrc --set ON_ERROR_STOP=1 --quiet \
      --set "declared_at_gte=$lower_bound" --set "declared_at_lt=$upper_bound" \
      <"$SCRIPT_DIR/sql/export-representations.sql" >"$work/representations.csv" 2>>"$log" ||
      die "export des représentations impossible"
  else
    write_header_only_csv "$work/representations.csv" "$REPRESENTATIONS_HEADER"
  fi
  if (( migration_referents )); then
    docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
      --no-psqlrc --set ON_ERROR_STOP=1 --quiet \
      <"$SCRIPT_DIR/sql/export-referents.sql" >"$work/referents.csv" 2>>"$log" ||
      die "export des référents impossible"
  else
    write_header_only_csv "$work/referents.csv" "$REFERENTS_HEADER"
  fi

  source_version=$(docker exec "$CONTAINER_NAME" psql --username postgres --dbname legacy --no-psqlrc --tuples-only --no-align --command 'SHOW server_version' 2>>"$log" | tr -d '\r\n')
  if (( migration_repeq )); then
    representation_count=$(docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy --no-psqlrc --tuples-only --no-align \
      --set "declared_at_gte=$lower_bound" --set "declared_at_lt=$upper_bound" \
      2>>"$log" <"$SCRIPT_DIR/sql/count-representations.sql" | tr -d '[:space:]')
  else
    representation_count=0
  fi
  if (( migration_referents )); then
    referent_count=$(docker exec "$CONTAINER_NAME" psql --username postgres --dbname legacy --no-psqlrc --tuples-only --no-align \
      --command 'SELECT count(*) FROM public.referent' 2>>"$log" | tr -d '[:space:]')
  else
    referent_count=0
  fi
  [[ "$representation_count" =~ ^[0-9]+$ && "$referent_count" =~ ^[0-9]+$ ]] ||
    die "compteurs V1 invalides"
  if (( migration_referents )) && [[ ! "$referent_count" =~ ^[1-9][0-9]*$ ]]; then
    die "l'instantané sélectionné des référents est vide"
  fi

  exported_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  dump_hash=$(sha256_file "$dump")
  {
    printf 'format_version=%s\n' "$SNAPSHOT_VERSION"
    printf 'kit_revision=%s\n' "$SNAPSHOT_VERSION"
    printf 'dataset=%s\n' "$dataset"
    printf 'exported_at=%s\n' "$exported_at"
    printf 'source_postgresql_version=%s\n' "$source_version"
    printf 'declared_at_gte=%s\n' "$lower_bound"
    printf 'declared_at_lt=%s\n' "$upper_bound"
    printf 'representations_count=%s\n' "$representation_count"
    printf 'referents_count=%s\n' "$referent_count"
    printf 'dump_sha256=%s\n' "$dump_hash"
  } >"$work/manifest.txt"

  : >"$work/SHA256SUMS"
  local file
  for file in manifest.txt representations.csv referents.csv; do
    printf '%s  %s\n' "$(sha256_file "$work/$file")" "$file" >>"$work/SHA256SUMS"
  done
  rm -f -- "$log"
  chmod 400 "$work"/*
  verify_snapshot "$work" >/dev/null
  mv -- "$work" "$output"
  EXPORT_WORK_DIR=""

  docker rm --force "$CONTAINER_NAME" >/dev/null 2>&1 || true
  CONTAINER_NAME=""
  printf 'Instantané créé : %s\n' "$output"
  printf 'Jeu de données : %s\n' "$dataset"
  printf 'Représentations : %s\nRéférents : %s\n' "$representation_count" "$referent_count"
}

run_target() {
  local mode=$1
  local snapshot=$2
  local service=$3
  local pgpass=$4
  local requested_dataset=$5
  local allow_referent_deletions=$6
  local verified work log output expected_representations expected_referents failure_log psql_version
  local available_dataset effective_dataset migration_repeq migration_referents

  [[ "$service" =~ ^[A-Za-z0-9_.-]+$ ]] || die "nom de service libpq invalide"
  if [[ -n "$pgpass" ]]; then
    pgpass=$(absolute_existing_file "$pgpass")
    assert_private_file "$pgpass"
  fi

  verified=$(verify_snapshot "$snapshot")
  available_dataset=$(snapshot_dataset "$verified/manifest.txt")
  effective_dataset=${requested_dataset:-$available_dataset}
  validate_dataset "$effective_dataset"
  dataset_includes "$available_dataset" "$effective_dataset" ||
    die "l'instantané '$available_dataset' ne contient pas le jeu de données '$effective_dataset'"

  migration_repeq=0
  migration_referents=0
  case "$effective_dataset" in
    all) migration_repeq=1; migration_referents=1 ;;
    repeq) migration_repeq=1 ;;
    referents) migration_referents=1 ;;
  esac

  require_command psql
  psql_version=$(psql --version | sed -E 's/.* ([0-9]+)(\..*)?$/\1/')
  [[ "$psql_version" =~ ^[0-9]+$ && "$psql_version" -ge 14 ]] || die "psql 14 ou plus récent est requis"
  expected_representations=$(manifest_value "$verified/manifest.txt" representations_count)
  expected_referents=$(manifest_value "$verified/manifest.txt" referents_count)
  TEMP_DIR=$(mktemp -d /tmp/egapro-v1-migration.XXXXXX)
  chmod 700 "$TEMP_DIR"
  work="$TEMP_DIR/work"
  mkdir -m 700 "$work"
  local file
  for file in "${SNAPSHOT_FILES[@]}"; do
    cp -- "$verified/$file" "$work/$file"
  done
  verify_snapshot "$work" >/dev/null
  cp -- "$SCRIPT_DIR/reference/regions.csv" "$work/regions.csv"
  cp -- "$SCRIPT_DIR/reference/departments.csv" "$work/departments.csv"

  log="$TEMP_DIR/psql.log"
  output="$TEMP_DIR/report.txt"
  : >"$log"
  chmod 600 "$log"

  if ! (
    cd "$work"
    export PGSERVICE="$service"
    if [[ -n "$pgpass" ]]; then
      export PGPASSFILE="$pgpass"
    fi
    psql --no-psqlrc --set ON_ERROR_STOP=1 --quiet --tuples-only --no-align \
      --set "migration_mode=$mode" \
      --set "migration_dataset=$effective_dataset" \
      --set "migration_repeq=$migration_repeq" \
      --set "migration_referents=$migration_referents" \
      --set "allow_referent_deletions=$allow_referent_deletions" \
      --set "expected_representations=$expected_representations" \
      --set "expected_referents=$expected_referents" \
      --file "$SCRIPT_DIR/sql/migrate.sql"
  ) >"$output" 2>"$log"; then
    failure_log="$(dirname "$verified")/migration-v1-${mode}-failure-$(date -u '+%Y%m%dT%H%M%SZ').log"
    cp -- "$log" "$failure_log"
    chmod 600 "$failure_log"
    die "${mode} échoué ; diagnostic protégé : $failure_log"
  fi

  cat "$output"
}

command=${1:-}
[[ -n "$command" ]] || { usage; exit 1; }
shift

case "$command" in
  export)
    dump=""
    dump_format=""
    output=""
    dataset="all"
    lower_bound=""
    upper_bound=""
    while (($#)); do
      case "$1" in
        --dump) [[ $# -ge 2 ]] || die "valeur absente après --dump"; dump=$2; shift 2 ;;
        --format) [[ $# -ge 2 ]] || die "valeur absente après --format"; dump_format=$2; shift 2 ;;
        --out) [[ $# -ge 2 ]] || die "valeur absente après --out"; output=$2; shift 2 ;;
        --dataset) [[ $# -ge 2 ]] || die "valeur absente après --dataset"; dataset=$2; shift 2 ;;
        --declared-at-gte) [[ $# -ge 2 ]] || die "valeur absente après --declared-at-gte"; lower_bound=$2; shift 2 ;;
        --declared-at-lt) [[ $# -ge 2 ]] || die "valeur absente après --declared-at-lt"; upper_bound=$2; shift 2 ;;
        *) die "option inconnue pour export : $1" ;;
      esac
    done
    [[ -n "$dump" && -n "$dump_format" && -n "$output" ]] || die "--dump, --format et --out sont requis"
    validate_dataset "$dataset"
    export_snapshot "$dump" "$dump_format" "$output" "$lower_bound" "$upper_bound" "$dataset"
    ;;
  verify)
    snapshot=""
    while (($#)); do
      case "$1" in
        --snapshot) [[ $# -ge 2 ]] || die "valeur absente après --snapshot"; snapshot=$2; shift 2 ;;
        *) die "option inconnue pour verify : $1" ;;
      esac
    done
    [[ -n "$snapshot" ]] || die "--snapshot est requis"
    verified=$(verify_snapshot "$snapshot")
    printf 'Instantané valide : %s\n' "$verified"
    ;;
  dry-run|apply)
    snapshot=""
    service=""
    pgpass=""
    dataset=""
    allow_referent_deletions=0
    while (($#)); do
      case "$1" in
        --snapshot) [[ $# -ge 2 ]] || die "valeur absente après --snapshot"; snapshot=$2; shift 2 ;;
        --service) [[ $# -ge 2 ]] || die "valeur absente après --service"; service=$2; shift 2 ;;
        --pgpass) [[ $# -ge 2 ]] || die "valeur absente après --pgpass"; pgpass=$2; shift 2 ;;
        --dataset) [[ $# -ge 2 ]] || die "valeur absente après --dataset"; dataset=$2; shift 2 ;;
        --allow-referent-deletions) allow_referent_deletions=1; shift ;;
        *) die "option inconnue pour $command : $1" ;;
      esac
    done
    [[ -n "$snapshot" && -n "$service" ]] || die "--snapshot et --service sont requis"
    [[ -z "$dataset" ]] || validate_dataset "$dataset"
    if [[ "$command" == "dry-run" && "$allow_referent_deletions" == "1" ]]; then
      die "--allow-referent-deletions ne s'applique qu'à apply"
    fi
    run_target "$command" "$snapshot" "$service" "$pgpass" "$dataset" "$allow_referent_deletions"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    usage >&2
    die "commande inconnue : $command"
    ;;
esac
