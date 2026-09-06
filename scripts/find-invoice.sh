#!/usr/bin/env bash

# ==========================================================
# Script Simulasi Find Invoice (Checkout Page Winpay)
# ==========================================================
# Format:
#   find-invoice.sh [ENVIRONMENT]
#
# Environment:
#   (kosong)    → development (default)
#   sandbox     → Winpay Sandbox
#   production  → Winpay Production
#   prod        → alias production

# Resolusi path sebenarnya (bahkan jika dipanggil via Symlink dari PATH)
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/backend"
cd "$BACKEND_DIR" || exit 1

RAW_ENV=${1:-"development"}

# Normalisasi Environment
if [[ "$RAW_ENV" == "production" || "$RAW_ENV" == "prod" ]]; then
  ENV="production"
elif [[ "$RAW_ENV" == "sandbox" ]]; then
  ENV="sandbox"
else
  ENV="development"
fi

echo "🚀 Menjalankan Simulasi Find Invoice (Checkout Page)"
echo "----------------------------------------------------"
echo "📌 Environment  : $ENV"
echo "📌 Project Dir  : $SCRIPT_DIR"
echo "----------------------------------------------------"

NODE_ENV="$ENV" node simulator.js checkoutpage findinvoice
