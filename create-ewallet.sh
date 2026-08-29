#!/usr/bin/env bash

# ==========================================================
# Script Simulasi Create eWallet Payment (SNAP API Winpay)
# ==========================================================
# Format:
#   create-ewallet.sh [CHANNEL] [AMOUNT] [ENVIRONMENT]
#
# Channel yang didukung:
#   SPAY   → ShopeePay (default)
#   DANA   → DANA
#   OVO    → OVO
#   SC     → Speedcash
#   ASTRA  → AstraPay
#
# Environment:
#   (kosong)    → development (default, sandbox-api.bmstaging.id)
#   sandbox     → Winpay Sandbox (sandbox-snap.winpay.id)
#   production  → Winpay Production (snap.winpay.id)
#   prod        → alias production

# Resolusi path sebenarnya (bahkan jika dipanggil via Symlink dari PATH)
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"
cd "$SCRIPT_DIR" || exit 1

CHANNEL=${1:-"SPAY"}
AMOUNT=${2:-"10000.00"}
RAW_ENV=${3:-"development"}

# Normalisasi Environment
if [[ "$RAW_ENV" == "production" || "$RAW_ENV" == "prod" ]]; then
  ENV="production"
elif [[ "$RAW_ENV" == "sandbox" ]]; then
  ENV="sandbox"
else
  ENV="development"
fi

echo "🚀 Menjalankan Simulasi Create eWallet (SNAP)"
echo "---------------------------------------------"
echo "📌 Channel      : $CHANNEL"
echo "📌 Total Amount : Rp $AMOUNT"
echo "📌 Environment  : $ENV"
echo "📌 Project Dir  : $SCRIPT_DIR"
echo "---------------------------------------------"

CHANNEL="$CHANNEL" AMOUNT="$AMOUNT" NODE_ENV="$ENV" node simulator.js snap createewallet
