#!/usr/bin/env bash

# ==========================================================
# Script Menjalankan Callback Server Receiver (Winpay)
# ==========================================================
# Format:
#   start-callback.sh [PORT] [ENVIRONMENT]
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

PORT=${1:-"3000"}
RAW_ENV=${2:-"development"}

# Normalisasi Environment
if [[ "$RAW_ENV" == "production" || "$RAW_ENV" == "prod" ]]; then
  ENV="production"
elif [[ "$RAW_ENV" == "sandbox" ]]; then
  ENV="sandbox"
else
  ENV="development"
fi

echo "🚀 Menjalankan Winpay Callback Server Receiver"
echo "----------------------------------------------"
echo "📌 Port         : $PORT"
echo "📌 Environment  : $ENV"
echo "📌 Project Dir  : $SCRIPT_DIR"
echo "----------------------------------------------"

PORT="$PORT" NODE_ENV="$ENV" node server.js
