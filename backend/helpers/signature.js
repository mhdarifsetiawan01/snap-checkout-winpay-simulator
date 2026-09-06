const fs = require("fs");
const crypto = require("crypto");
const CONFIG = require("../config/config");

function getPrivateKey() {
  const envKey = (CONFIG.isProduction ? process.env.SNAP_PRIVATE_KEY_PROD : process.env.SNAP_PRIVATE_KEY_DEV) || process.env.SNAP_PRIVATE_KEY;
  if (envKey) {
    // Jika format base64, decode terlebih dahulu
    if (!envKey.includes("-----BEGIN") && envKey.length > 100) {
      try {
        return Buffer.from(envKey, "base64").toString("utf8");
      } catch (_) {}
    }
    return envKey.replace(/\\n/g, "\n");
  }

  if (fs.existsSync(CONFIG.PRIVATE_KEY_PATH)) {
    return fs.readFileSync(CONFIG.PRIVATE_KEY_PATH, "utf8");
  }
  return "";
}

/**
 * Generate RSA-SHA256 signature (SNAP)
 */
function generateSignature(httpMethod, endpoint, body, timestamp) {
  const privateKey = getPrivateKey();
  // pastikan body identik
  const minifiedBody = JSON.stringify(body);

  // hash body
  const bodyHash = crypto.createHash("sha256").update(minifiedBody).digest("hex").toLowerCase();

  // penting: endpoint TIDAK pakai BASE_URL
  const endpointPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const stringToSign = `${httpMethod}:${endpointPath}:${bodyHash}:${timestamp}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(stringToSign);
  signer.end();

  const signature = signer.sign(privateKey, "base64");
  
  return { signature, stringToSign };
}


module.exports = { generateSignature };
