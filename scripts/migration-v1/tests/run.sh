#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# The CLI suite takes seconds and validates the interface; the Docker suite takes
# minutes. Running them in this order fails fast when the kit is unusable.
bash "$SCRIPT_DIR/cli.test.sh"
bash "$SCRIPT_DIR/integration.sh"
