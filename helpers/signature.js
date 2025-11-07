const fs = require("fs");
const crypto = require("crypto");
const CONFIG = require("../config/config");

const privateKey = fs.readFileSync(CONFIG.PRIVATE_KEY_PATH, "utf8");

/**
 * Generate RSA-SHA256 signature (SNAP)
 */
function generateSignature(httpMethod, endpoint, body, timestamp) {
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
