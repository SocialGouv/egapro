#!/usr/bin/env bash
# Generate a self-signed CA + client certificate pair for SUIT API mTLS.
#
# Usage:
#   ./scripts/generate-suit-mtls-certs.sh <env> [output-dir]
#
#   env: dev | prod | all
#
# Examples:
#   ./scripts/generate-suit-mtls-certs.sh dev              # → ./suit-mtls-certs/dev/
#   ./scripts/generate-suit-mtls-certs.sh prod             # → ./suit-mtls-certs/prod/
#   ./scripts/generate-suit-mtls-certs.sh all              # → both dev + prod
#   ./scripts/generate-suit-mtls-certs.sh dev ./my-certs   # → ./my-certs/dev/
#
# Output files (per env):
#   ca.key       — CA private key (keep secure, never distribute)
#   ca.crt       — CA certificate (base64 → K8s secret EGAPRO_SUIT_MTLS_CA_PEM)
#   client.crt   — Client certificate / public key (give to SUIT)

set -euo pipefail

VALIDITY_CA=3650    # 10 years
VALIDITY_CLIENT=365 # 1 year
KEY_SIZE=4096

# --- Environment configuration ---

declare -A ENV_HOSTS
ENV_HOSTS[dev]="egapro-dev.ovh.fabrique.social.gouv.fr"
ENV_HOSTS[prod]="egapro.travail.gouv.fr"

declare -A ENV_CA_CN
ENV_CA_CN[dev]="EgaPro SUIT mTLS CA (dev)"
ENV_CA_CN[prod]="EgaPro SUIT mTLS CA (prod)"

declare -A ENV_CLIENT_CN
ENV_CLIENT_CN[dev]="SUIT API Client (dev)"
ENV_CLIENT_CN[prod]="SUIT API Client (prod)"

VALID_ENVS=("dev" "prod")

# --- Functions ---

usage() {
  echo "Usage: $0 <env> [output-dir]"
  echo ""
  echo "  env:  dev | prod | all"
  echo ""
  echo "Examples:"
  echo "  $0 dev              # generate dev certs in ./suit-mtls-certs/dev/"
  echo "  $0 prod             # generate prod certs in ./suit-mtls-certs/prod/"
  echo "  $0 all              # generate certs for both environments"
  echo "  $0 dev ./my-certs   # generate dev certs in ./my-certs/dev/"
  exit 1
}

generate_certs() {
  local env_name="$1"
  local base_dir="$2"
  local output_dir="$base_dir/$env_name"
  local host="${ENV_HOSTS[$env_name]}"
  local ca_cn="${ENV_CA_CN[$env_name]}"
  local client_cn="${ENV_CLIENT_CN[$env_name]}"

  mkdir -p "$output_dir"

  echo "=== [$env_name] Generating CA key pair ==="
  openssl genrsa -out "$output_dir/ca.key" "$KEY_SIZE" 2>/dev/null
  openssl req -new -x509 \
    -key "$output_dir/ca.key" \
    -out "$output_dir/ca.crt" \
    -days "$VALIDITY_CA" \
    -subj "/C=FR/O=DGEFP/OU=EGAPRO/CN=$ca_cn"

  echo "=== [$env_name] Generating client certificate ==="
  openssl genrsa -out "$output_dir/client.key" "$KEY_SIZE" 2>/dev/null
  openssl req -new \
    -key "$output_dir/client.key" \
    -out "$output_dir/client.csr" \
    -subj "/C=FR/O=Ministere du Travail/OU=SUIT/CN=$client_cn"

  openssl x509 -req \
    -in "$output_dir/client.csr" \
    -CA "$output_dir/ca.crt" \
    -CAkey "$output_dir/ca.key" \
    -CAcreateserial \
    -out "$output_dir/client.crt" \
    -days "$VALIDITY_CLIENT" \
    2>/dev/null

  # Base64-encode the CA cert (for the EGAPRO_SUIT_MTLS_CA_PEM env var)
  local ca_pem_b64
  ca_pem_b64=$(base64 < "$output_dir/ca.crt" | tr -d '\n')

  # Base64-encode the client cert (for the X-Client-Cert header)
  local client_cert_b64
  client_cert_b64=$(base64 < "$output_dir/client.crt" | tr -d '\n')

  # Clean up intermediate files (client.key was only needed to generate the CSR)
  rm -f "$output_dir/client.key" "$output_dir/client.csr" "$output_dir/ca.srl"

  echo ""
  echo "=== [$env_name] Done ==="
  echo ""
  echo "Files generated in $output_dir/:"
  echo "  ca.key       — CA private key (DO NOT share)"
  echo "  ca.crt       — CA certificate"
  echo "  client.crt   — Client certificate (public key) → give to SUIT"
  echo ""
  echo "=== [$env_name] Next steps ==="
  echo ""
  echo "1. Add the CA cert to the K8s sealed-secret for $env_name."
  echo "   Value for EGAPRO_SUIT_MTLS_CA_PEM (base64 of ca.crt):"
  echo ""
  echo "   $ca_pem_b64"
  echo ""
  echo "2. Give SUIT the client certificate and the base64 value to send as header:"
  echo ""
  echo "   X-Client-Cert value (base64 of client.crt):"
  echo "   $client_cert_b64"
  echo ""
  echo "3. SUIT calls the API with:"
  echo "   curl -H 'X-Client-Cert: <base64 above>' \\"
  echo "        -H 'Authorization: Bearer <api-key>' \\"
  echo "        https://$host/api/v1/export/declarations?date_begin=2026-01-01"
  echo ""
}

# --- Main ---

if [[ $# -lt 1 ]]; then
  usage
fi

ENV_ARG="$1"
BASE_DIR="${2:-./suit-mtls-certs}"

if [[ "$ENV_ARG" == "all" ]]; then
  for env_name in "${VALID_ENVS[@]}"; do
    generate_certs "$env_name" "$BASE_DIR"
  done
elif [[ -v "ENV_HOSTS[$ENV_ARG]" ]]; then
  generate_certs "$ENV_ARG" "$BASE_DIR"
else
  echo "Error: unknown environment '$ENV_ARG'. Must be one of: dev, prod, all."
  echo ""
  usage
fi
