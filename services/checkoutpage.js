const axios = require("axios");
const CONFIG = require("../config/config");
const logger = require("../helpers/logger");
const { generateTimestamp } = require("../helpers/timestamp");
const { generateCheckoutPageSignature } = require("../helpers/signature-checkoutpage");
const { saveKey } = require("../helpers/storage");

async function sendRequest(endpoint, payload, simulate = true) {
  const url = `${CONFIG.CHECKOUT_BASE_URL}${endpoint}`;
  const timestamp = generateTimestamp();
  const signature = generateCheckoutPageSignature(timestamp, CONFIG.CHECKOUT_SECRET_KEY);
  
  const headers = {
    "Content-Type": "application/json",
    "X-Winpay-Timestamp": timestamp,
    "X-Winpay-Signature": signature,
    "X-Winpay-Key": CONFIG.CHECKOUT_CLIENT_KEY,
  };
  
  if (!simulate) {
    logger.info("=== CHECKOUTPAGE REQUEST ===");
    logger.debug("URL:", url);
    logger.debug("Headers:", headers);
    logger.debug("Body:", JSON.stringify(payload, null, 2));
  }
  
  try {
    logger.info(`📡 Sending request to: ${url}`);
    const response = await axios.post(url, payload, { headers, timeout: 10000 });

    const data = response.data;
    logger.success("✅ Response Success:");
    logger.debug(JSON.stringify(data, null, 2));

    // simpan key penting
    if (data?.responseData?.id) {
      await saveKey("lastInvoiceId", data?.responseData?.id);
      logger.info(`💾 invoiceId saved: ${data?.responseData?.id}`);
    }
    if (data?.responseData?.ref) {
      await saveKey("lastInvoiceRef", data.responseData.ref);
      logger.info(`💾 invoiceRef saved: ${data.responseData.ref}`);
    }

    return data;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    logger.error("❌ Request Failed:", errorData);
    throw new Error(JSON.stringify({ url, error: errorData }, null, 2));
  }
}

async function createinvoice(payload, simulate = true) {
  return await sendRequest("/api/create", payload, simulate);
}

/**
 * Find Invoice (GET)
 */
async function findinvoice(invoiceId, simulate = true) {
  const path = `/api/find/${invoiceId}`;
  const url = `${CONFIG.CHECKOUT_BASE_URL}${path}`;
  const timestamp = generateTimestamp();
  const signature = generateCheckoutPageSignature(timestamp, CONFIG.CHECKOUT_SECRET_KEY);

  const headers = {
    "X-Winpay-Timestamp": timestamp,
    "X-Winpay-Signature": signature,
    "X-Winpay-Key": CONFIG.CHECKOUT_CLIENT_KEY,
  };

  if (simulate) {
    logger.info("=== SIMULATED CHECKOUT FIND INVOICE ===");
    logger.debug("URL:", url);
    logger.debug("Headers:", headers);
    return null;
  }

  try {
    logger.info(`📡 Sending GET request to: ${url}`);
    const response = await axios.get(url, { headers, timeout: 10000 });

    logger.success("✅ Response Success:");
    logger.debug(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    logger.error("❌ Checkout Find Invoice Failed:", errorData);
    throw err;
  }
}

module.exports = { createinvoice, findinvoice };
