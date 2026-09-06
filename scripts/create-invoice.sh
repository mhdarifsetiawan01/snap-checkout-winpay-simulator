#!/usr/bin/env bash

# ==========================================================
# Script Simulasi Create Invoice (Checkout Page Winpay)
# ==========================================================
# Format:
#   create-invoice.sh [PRICE] [PRODUCT_NAME] [ENVIRONMENT]
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

PRICE=${1:-"100000"}
PRODUCT_NAME=${2:-"Produk A"}
RAW_ENV=${3:-"development"}

# Normalisasi Environment
if [[ "$RAW_ENV" == "production" || "$RAW_ENV" == "prod" ]]; then
  ENV="production"
elif [[ "$RAW_ENV" == "sandbox" ]]; then
  ENV="sandbox"
else
  ENV="development"
fi

echo "🚀 Menjalankan Simulasi Create Invoice (Checkout Page)"
echo "------------------------------------------------------"
echo "📌 Harga Produk : Rp $PRICE"
echo "📌 Nama Produk  : $PRODUCT_NAME"
echo "📌 Environment  : $ENV"
echo "📌 Project Dir  : $SCRIPT_DIR"
echo "------------------------------------------------------"

PRICE="$PRICE" PRODUCT_NAME="$PRODUCT_NAME" NODE_ENV="$ENV" node simulator.js checkoutpage createinvoice
