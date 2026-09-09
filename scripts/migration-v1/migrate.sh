#!/usr/bin/env bash

set -Eeuo pipefail

umask 077

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly POSTGRES_IMAGE="${MIGRATION_V1_POSTGRES_IMAGE:-postgres:14.17}"
readonly SNAPSHOT_VERSION="1"
readonly SNAPSHOT_FILES=(manifest.txt representations.csv referents.csv SHA256SUMS)

TEMP_DIR=""
CONTAINER_NAME=""

usage() {
  cat <<'EOF'
Usage:
  migrate.sh export --dump PATH --format custom|plain --out DIR
                    [--declared-at-gte TIMESTAMPTZ] [--declared-at-lt TIMESTAMPTZ]
  migrate.sh verify --snapshot DIR
  migrate.sh dry-run --snapshot DIR --service NAME [--pgpass PATH]
  migrate.sh apply --snapshot DIR --service NAME [--pgpass PATH]
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
  local entry file expected actual manifest_count csv_count key value

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

  while IFS='=' read -r key value; do
    case "$key" in
      format_version|kit_revision|exported_at|source_postgresql_version|declared_at_gte|declared_at_lt|representations_count|referents_count|dump_sha256) ;;
      *) die "clé inattendue dans le manifeste : $key" ;;
    esac
    [[ $(awk -F= -v wanted="$key" '$1 == wanted { count++ } END { print count + 0 }' "$snapshot/manifest.txt") -eq 1 ]] ||
      die "clé dupliquée dans le manifeste : $key"
  done <"$snapshot/manifest.txt"

  [[ $(wc -l <"$snapshot/manifest.txt") -eq 9 ]] || die "nombre de clés incorrect dans le manifeste"

  [[ "$(manifest_value "$snapshot/manifest.txt" format_version)" == "$SNAPSHOT_VERSION" ]] ||
    die "version d'instantané non prise en charge"
  [[ "$(manifest_value "$snapshot/manifest.txt" kit_revision)" == "$SNAPSHOT_VERSION" ]] ||
    die "révision de kit non prise en charge"
  [[ "$(manifest_value "$snapshot/manifest.txt" exported_at)" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] ||
    die "date d'export invalide dans le manifeste"
  [[ "$(manifest_value "$snapshot/manifest.txt" representations_count)" =~ ^[0-9]+$ ]] ||
    die "compteur de représentations invalide"
  [[ "$(manifest_value "$snapshot/manifest.txt" referents_count)" =~ ^[1-9][0-9]*$ ]] ||
    die "l'instantané des référents est vide ou invalide"
  [[ "$(manifest_value "$snapshot/manifest.txt" dump_sha256)" =~ ^[0-9a-f]{64}$ ]] ||
    die "somme SHA-256 du dump invalide dans le manifeste"
  [[ "$(head -n 1 "$snapshot/representations.csv" | tr -d '\r')" == "siren,year,declared_at,modified_at,data" ]] ||
    die "en-tête de representations.csv invalide"
  [[ "$(head -n 1 "$snapshot/referents.csv" | tr -d '\r')" == "id,county,name,principal,region,type,value,substitute_name,substitute_email" ]] ||
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

  manifest_count=$(manifest_value "$snapshot/manifest.txt" representations_count)
  csv_count=$(awk 'END { print (NR > 0 ? NR - 1 : 0) }' "$snapshot/representations.csv")
  # CSV fields may contain line breaks; the authoritative row count is checked
  # again after PostgreSQL loads the file. This quick check is valid only as a
  # lower bound and catches truncated empty files.
  (( csv_count >= manifest_count )) || die "fichier representations.csv tronqué"

  manifest_count=$(manifest_value "$snapshot/manifest.txt" referents_count)
  csv_count=$(awk 'END { print (NR > 0 ? NR - 1 : 0) }' "$snapshot/referents.csv")
  (( csv_count >= manifest_count )) || die "fichier referents.csv tronqué"

  printf '%s\n' "$snapshot"
}

wait_for_postgres() {
  local attempt
  for attempt in {1..60}; do
    if docker exec "$CONTAINER_NAME" psql --username postgres --dbname legacy \
      --no-psqlrc --tuples-only --command 'SELECT 1' >/dev/null 2>&1; then
      return
    fi
    sleep 1
  done
  die "PostgreSQL temporaire n'est pas prêt après 60 secondes"
}

reject_unsafe_plain_dump() {
  local dump=$1
  if LC_ALL=C grep -Ein '^[[:space:]]*(CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT|DO|INSERT|UPDATE|DELETE|TRUNCATE)[[:space:]]|^[[:space:]]*\\(connect|!|i|ir)[[:space:]]' "$dump" >/dev/null; then
    die "le format plain doit être un export pg_dump --data-only limité aux deux tables"
  fi
}

export_snapshot() {
  local dump=$1
  local dump_format=$2
  local output=$3
  local lower_bound=$4
  local upper_bound=$5
  local output_parent output_name work log source_version exported_at dump_hash representation_count referent_count

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

  output_parent=$(dirname "$output")
  output_name=$(basename "$output")
  work=$(mktemp -d "$output_parent/.${output_name}.partial.XXXXXX")
  chmod 700 "$work"
  log="$work/export.log"
  : >"$log"
  chmod 600 "$log"

  CONTAINER_NAME="egapro-v1-migration-${RANDOM}-$$"
  docker run --detach --name "$CONTAINER_NAME" --network none \
    --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_DB=legacy \
    --mount "type=bind,src=$dump,dst=/input/source.dump,readonly" \
    "$POSTGRES_IMAGE" >>"$log" 2>&1 || die "impossible de démarrer PostgreSQL temporaire ; voir $log"
  wait_for_postgres

  docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
    --no-psqlrc --set ON_ERROR_STOP=1 <"$SCRIPT_DIR/sql/source-schema.sql" >>"$log" 2>&1 ||
    die "impossible de préparer le schéma V1 temporaire ; voir $log"

  if [[ "$dump_format" == "custom" ]]; then
    docker exec "$CONTAINER_NAME" pg_restore --dbname legacy --username postgres \
      --data-only --no-owner --no-privileges --exit-on-error \
      --table representation_equilibree --table referent \
      /input/source.dump >>"$log" 2>&1 ||
      die "restauration sélective du dump custom impossible ; voir $log"
  else
    reject_unsafe_plain_dump "$dump"
    docker exec "$CONTAINER_NAME" psql --username postgres --dbname legacy \
      --no-psqlrc --set ON_ERROR_STOP=1 --single-transaction \
      --file /input/source.dump >>"$log" 2>&1 ||
      die "restauration du dump plain impossible ; voir $log"
  fi

  docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
    --no-psqlrc --set ON_ERROR_STOP=1 \
    --set "declared_at_gte=$lower_bound" --set "declared_at_lt=$upper_bound" \
    <"$SCRIPT_DIR/sql/validate-source.sql" >>"$log" 2>&1 ||
    die "validation des données V1 impossible ; voir $log"

  docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
    --no-psqlrc --set ON_ERROR_STOP=1 --quiet \
    --set "declared_at_gte=$lower_bound" --set "declared_at_lt=$upper_bound" \
    <"$SCRIPT_DIR/sql/export-representations.sql" >"$work/representations.csv" 2>>"$log" ||
    die "export des représentations impossible ; voir $log"
  docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy \
    --no-psqlrc --set ON_ERROR_STOP=1 --quiet \
    <"$SCRIPT_DIR/sql/export-referents.sql" >"$work/referents.csv" 2>>"$log" ||
    die "export des référents impossible ; voir $log"

  source_version=$(docker exec "$CONTAINER_NAME" psql --username postgres --dbname legacy --no-psqlrc --tuples-only --no-align --command 'SHOW server_version' 2>>"$log" | tr -d '\r\n')
  representation_count=$(docker exec --interactive "$CONTAINER_NAME" psql --username postgres --dbname legacy --no-psqlrc --tuples-only --no-align \
    --set "declared_at_gte=$lower_bound" --set "declared_at_lt=$upper_bound" \
    2>>"$log" <"$SCRIPT_DIR/sql/count-representations.sql" | tr -d '[:space:]')
  referent_count=$(docker exec "$CONTAINER_NAME" psql --username postgres --dbname legacy --no-psqlrc --tuples-only --no-align \
    --command 'SELECT count(*) FROM public.referent' 2>>"$log" | tr -d '[:space:]')
  [[ "$representation_count" =~ ^[0-9]+$ && "$referent_count" =~ ^[1-9][0-9]*$ ]] ||
    die "compteurs V1 invalides ; voir $log"

  exported_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
  dump_hash=$(sha256_file "$dump")
  {
    printf 'format_version=%s\n' "$SNAPSHOT_VERSION"
    printf 'kit_revision=%s\n' "$SNAPSHOT_VERSION"
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
  mv -- "$work" "$output"

  docker rm --force "$CONTAINER_NAME" >/dev/null 2>&1 || true
  CONTAINER_NAME=""
  verify_snapshot "$output" >/dev/null
  printf 'Instantané créé : %s\n' "$output"
  printf 'Représentations : %s\nRéférents : %s\n' "$representation_count" "$referent_count"
}

run_target() {
  local mode=$1
  local snapshot=$2
  local service=$3
  local pgpass=$4
  local verified work log output expected_representations expected_referents failure_log psql_version

  require_command psql
  psql_version=$(psql --version | sed -E 's/.* ([0-9]+)(\..*)?$/\1/')
  [[ "$psql_version" =~ ^[0-9]+$ && "$psql_version" -ge 14 ]] || die "psql 14 ou plus récent est requis"
  [[ "$service" =~ ^[A-Za-z0-9_.-]+$ ]] || die "nom de service libpq invalide"
  if [[ -n "$pgpass" ]]; then
    pgpass=$(absolute_existing_file "$pgpass")
    assert_private_file "$pgpass"
  fi

  verified=$(verify_snapshot "$snapshot")
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
    lower_bound=""
    upper_bound=""
    while (($#)); do
      case "$1" in
        --dump) [[ $# -ge 2 ]] || die "valeur absente après --dump"; dump=$2; shift 2 ;;
        --format) [[ $# -ge 2 ]] || die "valeur absente après --format"; dump_format=$2; shift 2 ;;
        --out) [[ $# -ge 2 ]] || die "valeur absente après --out"; output=$2; shift 2 ;;
        --declared-at-gte) [[ $# -ge 2 ]] || die "valeur absente après --declared-at-gte"; lower_bound=$2; shift 2 ;;
        --declared-at-lt) [[ $# -ge 2 ]] || die "valeur absente après --declared-at-lt"; upper_bound=$2; shift 2 ;;
        *) die "option inconnue pour export : $1" ;;
      esac
    done
    [[ -n "$dump" && -n "$dump_format" && -n "$output" ]] || die "--dump, --format et --out sont requis"
    export_snapshot "$dump" "$dump_format" "$output" "$lower_bound" "$upper_bound"
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
    while (($#)); do
      case "$1" in
        --snapshot) [[ $# -ge 2 ]] || die "valeur absente après --snapshot"; snapshot=$2; shift 2 ;;
        --service) [[ $# -ge 2 ]] || die "valeur absente après --service"; service=$2; shift 2 ;;
        --pgpass) [[ $# -ge 2 ]] || die "valeur absente après --pgpass"; pgpass=$2; shift 2 ;;
        *) die "option inconnue pour $command : $1" ;;
      esac
    done
    [[ -n "$snapshot" && -n "$service" ]] || die "--snapshot et --service sont requis"
    run_target "$command" "$snapshot" "$service" "$pgpass"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    usage >&2
    die "commande inconnue : $command"
    ;;
esac
