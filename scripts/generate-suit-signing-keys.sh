#!/usr/bin/env bash
# Generate an RSA key pair for SUIT API request signing.
#
# SUIT signs each request with the private key. EgaPro verifies
# the signature with the public key (stored as EGAPRO_SUIT_PUBLIC_KEY_PEM).
#
# Usage:
#   ./scripts/generate-suit-signing-keys.sh <env> [output-dir]
#
#   env: dev | prod | all
#
# Examples:
#   ./scripts/generate-suit-signing-keys.sh dev              # → ./suit-signing-keys/dev/
#   ./scripts/generate-suit-signing-keys.sh prod             # → ./suit-signing-keys/prod/
#   ./scripts/generate-suit-signing-keys.sh all              # → both dev + prod
#   ./scripts/generate-suit-signing-keys.sh dev ./my-keys    # → ./my-keys/dev/
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
  echo "Usage: $0 <env> [output-dir]"
  echo ""
  echo "  env:  dev | prod | all"
  echo ""
  echo "Examples:"
  echo "  $0 dev              # generate dev keys in ./suit-signing-keys/dev/"
  echo "  $0 prod             # generate prod keys in ./suit-signing-keys/prod/"
  echo "  $0 all              # generate keys for both environments"
  echo "  $0 dev ./my-keys    # generate dev keys in ./my-keys/dev/"
  exit 1
}

generate_keys() {
  local env_name="$1"
  local base_dir="$2"
  local output_dir="$base_dir/$env_name"
  local host="${ENV_HOSTS[$env_name]}"

  mkdir -p "$output_dir"

  echo "=== [$env_name] Generating RSA-$KEY_SIZE key pair ==="
  openssl genrsa -out "$output_dir/suit-signing.key" "$KEY_SIZE" 2>/dev/null
  openssl rsa -in "$output_dir/suit-signing.key" -pubout -out "$output_dir/suit-signing.pub" 2>/dev/null

  local pub_b64
  pub_b64=$(base64 < "$output_dir/suit-signing.pub" | tr -d '\n')

  echo ""
  echo "=== [$env_name] Done ==="
  echo ""
  echo "Files generated in $output_dir/:"
  echo "  suit-signing.key — Private key → give to SUIT (they sign requests)"
  echo "  suit-signing.pub — Public key"
  echo ""
  echo "=== [$env_name] Next steps ==="
  echo ""
  echo "1. Add the public key to the K8s sealed-secret for $env_name."
  echo "   Value for EGAPRO_SUIT_PUBLIC_KEY_PEM (base64 of suit-signing.pub):"
  echo ""
  echo "   $pub_b64"
  echo ""
  echo "2. Give SUIT the private key (suit-signing.key)."
  echo "   They must keep it secure — it proves their identity."
  echo ""
  echo "3. SUIT signs each request:"
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

if [[ $# -lt 1 ]]; then
  usage
fi

ENV_ARG="$1"
BASE_DIR="${2:-./suit-signing-keys}"

if [[ "$ENV_ARG" == "all" ]]; then
  for env_name in "${VALID_ENVS[@]}"; do
    generate_keys "$env_name" "$BASE_DIR"
  done
elif [[ -v "ENV_HOSTS[$ENV_ARG]" ]]; then
  generate_keys "$ENV_ARG" "$BASE_DIR"
else
  echo "Error: unknown environment '$ENV_ARG'. Must be one of: dev, prod, all."
  echo ""
  usage
fi
