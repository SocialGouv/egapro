#!/usr/bin/env bash
# Generate or renew an RSA key pair for SUIT API request signing.
#
# SUIT signs each request with the private key. EgaPro verifies
# the signature with the public key (stored as EGAPRO_SUIT_PUBLIC_KEY_PEM).
#
# Usage:
#   ./scripts/generate-suit-signing-keys.sh <command> <env> [output-dir]
#
#   command: generate | renew
#   env:     dev | prod | all
#
# Commands:
#   generate  Create a new key pair. Refuses to overwrite existing keys.
#   renew     Back up the current key pair (timestamped), then generate new keys.
#
# Examples:
#   ./scripts/generate-suit-signing-keys.sh generate dev
#   ./scripts/generate-suit-signing-keys.sh generate all
#   ./scripts/generate-suit-signing-keys.sh renew prod
#   ./scripts/generate-suit-signing-keys.sh generate dev ./my-keys
#
# Output files (per env):
#   suit-signing.key — RSA private key (give to SUIT — they sign requests with it)
#   suit-signing.pub — RSA public key  (base64 → K8s secret EGAPRO_SUIT_PUBLIC_KEY_PEM)

set -euo pipefail

KEY_SIZE=4096

# --- Environment configuration ---

declare -A ENV_HOSTS
ENV_HOSTS[dev]="egapro-dev.ovh.fabrique.social.gouv.fr"
ENV_HOSTS[prod]="egapro.travail.gouv.fr"

VALID_ENVS=("dev" "prod")

# --- Functions ---

usage() {
  echo "Usage: $0 <command> <env> [output-dir]"
  echo ""
  echo "  command: generate | renew"
  echo "  env:     dev | prod | all"
  echo ""
  echo "Commands:"
  echo "  generate  Create a new key pair (refuses if keys already exist)"
  echo "  renew     Back up existing keys, then generate new ones"
  echo ""
  echo "Examples:"
  echo "  $0 generate dev              # first-time setup for dev"
  echo "  $0 generate all              # first-time setup for both environments"
  echo "  $0 renew prod                # rotate prod keys (backs up current pair)"
  echo "  $0 generate dev ./my-keys    # custom output directory"
  exit 1
}

backup_keys() {
  local output_dir="$1"
  local backup_suffix
  backup_suffix=$(date +%Y%m%d-%H%M%S)
  local backup_dir="$output_dir/backup-$backup_suffix"

  mkdir -p "$backup_dir"
  mv "$output_dir/suit-signing.key" "$backup_dir/suit-signing.key"
  mv "$output_dir/suit-signing.pub" "$backup_dir/suit-signing.pub"

  echo "  Existing keys backed up to $backup_dir/"
}

generate_keys() {
  local env_name="$1"
  local base_dir="$2"
  local command="$3"
  local output_dir="$base_dir/$env_name"
  local host="${ENV_HOSTS[$env_name]}"

  mkdir -p "$output_dir"

  # Check for existing keys
  if [[ -f "$output_dir/suit-signing.key" ]]; then
    if [[ "$command" == "generate" ]]; then
      echo "Error: keys already exist in $output_dir/"
      echo "  Use '$0 renew $env_name' to rotate keys (will back up the current pair)."
      exit 1
    fi
    echo "=== [$env_name] Backing up existing keys ==="
    backup_keys "$output_dir"
  fi

  echo "=== [$env_name] Generating RSA-$KEY_SIZE key pair ==="
  openssl genrsa -out "$output_dir/suit-signing.key" "$KEY_SIZE" 2>/dev/null
  openssl rsa -in "$output_dir/suit-signing.key" -pubout -out "$output_dir/suit-signing.pub" 2>/dev/null

  local pub_b64
  pub_b64=$(base64 < "$output_dir/suit-signing.pub" | tr -d '\n')

  echo ""
  echo "=== [$env_name] Done ==="
  echo ""
  echo "Files generated in $output_dir/:"
  echo "  suit-signing.key — Private key -> give to SUIT (they sign requests)"
  echo "  suit-signing.pub — Public key"
  echo ""
  echo "=== [$env_name] Next steps ==="
  echo ""

  if [[ "$command" == "renew" ]]; then
    echo "  ROTATION PROCEDURE (both sides must switch together):"
    echo ""
    echo "  1. Update the K8s sealed-secret for $env_name with the new public key."
    echo "     Value for EGAPRO_SUIT_PUBLIC_KEY_PEM (base64 of suit-signing.pub):"
    echo ""
    echo "     $pub_b64"
    echo ""
    echo "  2. Deploy EgaPro with the updated secret."
    echo ""
    echo "  3. Give SUIT the new private key (suit-signing.key)."
    echo "     They must switch to it immediately after EgaPro is deployed."
    echo ""
    echo "  The old keys are in the backup directory if you need to rollback."
  else
    echo "  1. Add the public key to the K8s sealed-secret for $env_name."
    echo "     Value for EGAPRO_SUIT_PUBLIC_KEY_PEM (base64 of suit-signing.pub):"
    echo ""
    echo "     $pub_b64"
    echo ""
    echo "  2. Give SUIT the private key (suit-signing.key)."
    echo "     They must keep it secure — it proves their identity."
  fi

  echo ""
  echo "  SUIT signs each request:"
  echo "   TIMESTAMP=\$(date +%s)"
  echo "   PAYLOAD=\"\$TIMESTAMP|GET|/api/v1/export/declarations\""
  echo "   SIGNATURE=\$(echo -n \"\$PAYLOAD\" | openssl dgst -sha256 -sign suit-signing.key | base64 | tr -d '\\n')"
  echo "   curl -H \"X-Timestamp: \$TIMESTAMP\" \\"
  echo "        -H \"X-Signature: \$SIGNATURE\" \\"
  echo "        -H 'Authorization: Bearer <api-key>' \\"
  echo "        https://$host/api/v1/export/declarations?date_begin=2026-01-01"
  echo ""
}

# --- Main ---

if [[ $# -lt 2 ]]; then
  usage
fi

COMMAND="$1"
ENV_ARG="$2"
BASE_DIR="${3:-./suit-signing-keys}"

if [[ "$COMMAND" != "generate" && "$COMMAND" != "renew" ]]; then
  echo "Error: unknown command '$COMMAND'. Must be 'generate' or 'renew'."
  echo ""
  usage
fi

if [[ "$ENV_ARG" == "all" ]]; then
  for env_name in "${VALID_ENVS[@]}"; do
    generate_keys "$env_name" "$BASE_DIR" "$COMMAND"
  done
elif [[ -v "ENV_HOSTS[$ENV_ARG]" ]]; then
  generate_keys "$ENV_ARG" "$BASE_DIR" "$COMMAND"
else
  echo "Error: unknown environment '$ENV_ARG'. Must be one of: dev, prod, all."
  echo ""
  usage
fi
