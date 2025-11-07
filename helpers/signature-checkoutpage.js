const crypto = require("crypto");

/**
 * Generate signature untuk Checkout Page API
 * @param {string} timestamp - format ISO 8601 (ex: 2025-11-07T13:15:00+07:00)
 * @param {string} secretKey - diambil dari .env (CHECKOUT_SECRET_KEY)
 * @returns {string} signature hex string
 */
function generateCheckoutPageSignature(timestamp, secretKey) {
  if (!timestamp || !secretKey) {
    throw new Error("timestamp dan secretKey wajib diisi untuk generate signature Checkout Page");
  }

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(timestamp)
    .digest("hex");

  return signature;
}

module.exports = { generateCheckoutPageSignature };
