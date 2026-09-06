const crypto = require("crypto");
const fs = require("fs");
const logger = require("./logger");

/**
 * Validasi X-SIGNATURE dari SNAP API Callback menggunakan Winpay Public Key
 * @param {Object} params
 * @param {string} params.httpMethod - 'POST'
 * @param {string} params.path - URL path (ex: /callback/snap atau /v1.0/transfer-va/payment)
 * @param {string|Object} params.body - Request body (JSON string atau Object)
 * @param {string} params.timestamp - X-TIMESTAMP header
 * @param {string} params.signature - X-SIGNATURE header (Base64)
 * @param {string} params.publicKeyPath - Path ke file winpay_public_key.pem
 * @returns {boolean}
 */
function verifySnapCallback({ httpMethod = "POST", path, body, timestamp, signature, publicKeyPath }) {
  if (!signature || !timestamp) {
    logger.warn("⚠️ X-SIGNATURE atau X-TIMESTAMP header tidak ditemukan pada callback.");
    return false;
  }

  if (!fs.existsSync(publicKeyPath)) {
    logger.warn(`⚠️ File Public Key Winpay tidak ditemukan di: ${publicKeyPath}. Validasi signature dilewati.`);
    return false;
  }

  try {
    const publicKey = fs.readFileSync(publicKeyPath, "utf8");
    const minifiedBody = typeof body === "string" ? body : JSON.stringify(body);
    const bodyHash = crypto.createHash("sha256").update(minifiedBody).digest("hex").toLowerCase();

    // Endpoint format
    const endpointPath = path.startsWith("/") ? path : `/${path}`;
    const stringToSign = `${httpMethod}:${endpointPath}:${bodyHash}:${timestamp}`;

    logger.debug("--- SNAP Callback Signature Verification ---");
    logger.debug("StringToSign:", stringToSign);
    logger.debug("Signature:", signature);

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign);
    verifier.end();

    const isValid = verifier.verify(publicKey, Buffer.from(signature, "base64"));
    return isValid;
  } catch (err) {
    logger.error("❌ Error saat verifikasi signature SNAP callback:", err.message);
    return false;
  }
}

/**
 * Validasi signature untuk Checkout Page Callback (HMAC-SHA256)
 * @param {Object} params
 * @param {string} params.timestamp - X-Winpay-Timestamp header
 * @param {string} params.signature - X-Winpay-Signature header
 * @param {string} params.secretKey - CHECKOUT_SECRET_KEY
 * @returns {boolean}
 */
function verifyCheckoutCallback({ timestamp, signature, secretKey }) {
  if (!signature || !timestamp || !secretKey) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(timestamp)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (err) {
    logger.error("❌ Error saat verifikasi signature Checkout callback:", err.message);
    return false;
  }
}

module.exports = { verifySnapCallback, verifyCheckoutCallback };
