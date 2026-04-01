#!/usr/bin/env bash
# Generate a self-signed CA + client certificate pair for SUIT API mTLS.
#
# Usage:
#   ./scripts/generate-suit-mtls-certs.sh [output-dir]
#
# Output files:
#   ca.key       — CA private key (keep secure, never distribute)
#   ca.crt       — CA certificate (base64 → K8s secret EGAPRO_SUIT_MTLS_CA_PEM)
#   client.key   — Client private key (give to SUIT)
#   client.crt   — Client certificate (give to SUIT)

set -euo pipefail

OUTPUT_DIR="${1:-./suit-mtls-certs}"
VALIDITY_CA=3650    # 10 years
VALIDITY_CLIENT=365 # 1 year
KEY_SIZE=4096

mkdir -p "$OUTPUT_DIR"

echo "=== Generating CA key pair ==="
openssl genrsa -out "$OUTPUT_DIR/ca.key" "$KEY_SIZE" 2>/dev/null
openssl req -new -x509 \
  -key "$OUTPUT_DIR/ca.key" \
  -out "$OUTPUT_DIR/ca.crt" \
  -days "$VALIDITY_CA" \
  -subj "/C=FR/O=DGEFP/OU=EGAPRO/CN=EgaPro SUIT mTLS CA"

echo "=== Generating client certificate ==="
openssl genrsa -out "$OUTPUT_DIR/client.key" "$KEY_SIZE" 2>/dev/null
openssl req -new \
  -key "$OUTPUT_DIR/client.key" \
  -out "$OUTPUT_DIR/client.csr" \
  -subj "/C=FR/O=Ministere du Travail/OU=SUIT/CN=SUIT API Client"

openssl x509 -req \
  -in "$OUTPUT_DIR/client.csr" \
  -CA "$OUTPUT_DIR/ca.crt" \
  -CAkey "$OUTPUT_DIR/ca.key" \
  -CAcreateserial \
  -out "$OUTPUT_DIR/client.crt" \
  -days "$VALIDITY_CLIENT" \
  2>/dev/null

# Base64-encode the CA cert (for the EGAPRO_SUIT_MTLS_CA_PEM env var)
CA_PEM_B64=$(base64 < "$OUTPUT_DIR/ca.crt" | tr -d '\n')

# Base64-encode the client cert (for the X-Client-Cert header)
CLIENT_CERT_B64=$(base64 < "$OUTPUT_DIR/client.crt" | tr -d '\n')

# Clean up intermediate files
rm -f "$OUTPUT_DIR/client.csr" "$OUTPUT_DIR/ca.srl"

echo ""
echo "=== Done ==="
echo ""
echo "Files generated in $OUTPUT_DIR/:"
echo "  ca.key       — CA private key (DO NOT share)"
echo "  ca.crt       — CA certificate"
echo "  client.key   — Client private key → give to SUIT"
echo "  client.crt   — Client certificate → give to SUIT"
echo ""
echo "=== Next steps ==="
echo ""
echo "1. Add the CA cert to the K8s sealed-secret for each env."
echo "   Value for EGAPRO_SUIT_MTLS_CA_PEM (base64 of ca.crt):"
echo ""
echo "   $CA_PEM_B64"
echo ""
echo "2. Give SUIT their client cert + key + the value to send as header:"
echo ""
echo "   X-Client-Cert value (base64 of client.crt):"
echo "   $CLIENT_CERT_B64"
echo ""
echo "3. SUIT calls the API with:"
echo "   curl -H 'X-Client-Cert: <base64 above>' \\"
echo "        -H 'Authorization: Bearer <api-key>' \\"
echo "        https://egapro.travail.gouv.fr/api/v1/export/declarations?date_begin=2026-01-01"
