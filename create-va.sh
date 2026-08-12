#!/usr/bin/env bash

# ==========================================================
# Script Simulasi Create Virtual Account (SNAP API Winpay)
# ==========================================================
# Format:
#   create-va.sh [CHANNEL] [AMOUNT] [ENVIRONMENT]
#
# Aturan Environment:
#   - Tanpa [ENVIRONMENT] : Default -> development
#   - Production          : Wajib menyertakan "production" (atau "prod")

# Resolusi path sebenarnya (bahkan jika dipanggil via Symlink dari PATH)
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
cd "$SCRIPT_DIR" || exit 1

CHANNEL=${1:-"PERMATA"}
AMOUNT=${2:-"15000.00"}
RAW_ENV=${3:-"development"}

# Normalisasi Environment (default: development)
if [[ "$RAW_ENV" == "production" || "$RAW_ENV" == "prod" ]]; then
  ENV="production"
else
  ENV="development"
fi

echo "🚀 Menjalankan Simulasi Create VA (SNAP)"
echo "----------------------------------------"
echo "📌 Bank Channel : $CHANNEL"
echo "📌 Total Amount : Rp $AMOUNT"
echo "📌 Environment  : $ENV"
echo "📌 Project Dir  : $SCRIPT_DIR"
echo "----------------------------------------"

CHANNEL="$CHANNEL" AMOUNT="$AMOUNT" NODE_ENV="$ENV" node simulator.js snap createva
