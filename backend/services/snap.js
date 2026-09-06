const http = require("http");
const https = require("https");
const axios = require("axios");
const CONFIG = require("../config/config");
const { generateTimestamp } = require("../helpers/timestamp");
const { generateSignature } = require("../helpers/signature");
const { generateExternalId } = require("../helpers/externalId");
const logger = require("../helpers/logger");
const { saveKey } = require("../helpers/storage");
const { resolveCleanVaNumber } = require("../helpers/trxId");

const httpAgent = new http.Agent({ family: 4, keepAlive: false });
const httpsAgent = new https.Agent({ family: 4, keepAlive: false });

/**
 * Generic request ke SNAP API
 */
async function sendRequest(endpoint, payload, simulate = true, httpMethod = "POST") {
  const url = `${CONFIG.SNAP_BASE_URL}${endpoint}`;
  const timestamp = generateTimestamp();

  const { signature, stringToSign } = generateSignature(httpMethod, endpoint, payload, timestamp);

  const externalId = generateExternalId("VA"); // bisa ganti prefix sesuai jenis request

  const partnerId = process.env.SNAP_PARTNER_ID_OVERRIDE || CONFIG.SNAP_MERCHANT_KEY;

  const headers = {
    "Content-Type": "application/json", 
    "X-TIMESTAMP": timestamp,
    "X-SIGNATURE": signature,
    "X-PARTNER-ID": partnerId,
    "X-EXTERNAL-ID": externalId,
    "CHANNEL-ID": 'WEB'
  };


  if (!simulate) {
    logger.info("=== SIMULATED REQUEST ===");
    logger.debug("Method:", httpMethod);
    logger.debug("URL:", url);
    logger.debug("Headers:", headers);
    logger.debug("Body:", JSON.stringify(payload, null, 2));
    logger.debug("StringToSign:", stringToSign);
    logger.debug("Signature:", signature);
    // return null;
  }

  // eksekusi request real
  try {
    logger.info(`📡 Sending ${httpMethod} request to: ${url}`);
    const response = await axios({
      method: httpMethod,
      url,
      data: payload,
      headers,
      timeout: 10000,
      httpAgent,
      httpsAgent,
    });

    // log sukses
    logger.success("✅ Response Success:");
    logger.debug(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (err) {
    // log error
    const errorData = err.response?.data || err.message;
    const statusCode = err.response?.status || 500;
    logger.error("❌ Request Failed:", errorData);
    const customErr = new Error(
      JSON.stringify(
        {
          method: httpMethod,
          endpoint,
          error: errorData,
          stringToSign,
          timestamp,
        },
        null,
        2
      )
    );
    customErr.statusCode = statusCode;
    customErr.response = err.response;
    customErr.responseData = err.response?.data || null;
    customErr.details = {
      method: httpMethod,
      endpoint,
      error: errorData,
      stringToSign,
      timestamp,
    };
    throw customErr;
  }
}

/**
 * Create VA
 */
async function createva(payload = {}, simulate = true) {
  if (!payload.expiredDate) payload.expiredDate = generateTimestamp(5);

  // kirim request ke API
  const result = await sendRequest("/v1.0/transfer-va/create-va", payload, simulate);

  // simpan beberapa key penting dari response ke db.json
  if (result && result.virtualAccountData) {
    const vaData = result.virtualAccountData;
    if (vaData.additionalInfo?.contractId) {
      await saveKey("lastContractId", vaData.additionalInfo.contractId);
      logger.info(`💾 contractId saved: ${vaData.additionalInfo.contractId}`);
    }
    if (vaData.trxId) {
      await saveKey("lastTrxId", vaData.trxId);
      logger.info(`💾 trxid saved: ${vaData.trxId}`);
    }
    if (vaData.customerNo || vaData.virtualAccountNo) {
      const cleanVa = resolveCleanVaNumber(vaData);
      await saveKey("lastVirtualAccountNo", cleanVa);
      await saveKey("lastCustomerNo", cleanVa);
      logger.info(`💾 VA Number saved: ${cleanVa}`);
    }
    if (vaData.additionalInfo.channel) {
      await saveKey("lastChannel", vaData.additionalInfo.channel);
      logger.info(`💾 Channel saved: ${vaData.additionalInfo.channel}`);
    }
  }

  return result;
}

/**
 * Inquiry VA
 */
async function inquiryva(payload = {}, simulate = true) {
  return await sendRequest("/v1.0/transfer-va/inquiry-va", payload, simulate);
}

/**
 * Payment Status
 */
async function statusva(payload = {}, simulate = true) {
  if (payload.virtualAccountNo) {
    payload.virtualAccountNo = resolveCleanVaNumber(payload.virtualAccountNo);
  }
  return await sendRequest("/v1.0/transfer-va/status", payload, simulate);
}

async function createqris(payload = {}, simulate = true) {
  // kirim request ke API
  const result = await sendRequest("/v1.0/qr/qr-mpm-generate", payload, simulate);

  // simpan beberapa key penting dari response ke db.json
  if (result) {
    logger.info(result);
  }

  return result;
}

async function createewallet(payload = {}, simulate = false) {
  // kirim request ke API
  const result = await sendRequest("/v1.0/debit/payment-host-to-host", payload, simulate);

  // simpan beberapa key penting dari response ke db.json
  if (result) {
    if (result.additionalInfo?.contractId) {
      await saveKey("lastContractId", result.additionalInfo.contractId);
      logger.info(`💾 contractId saved: ${result.additionalInfo.contractId}`);
    }
    if (result.partnerReferenceNo) {
      await saveKey("lastPartnerReferenceNo", result.partnerReferenceNo);
      await saveKey("lastTrxId", result.partnerReferenceNo);
      logger.info(`💾 partnerReferenceNo saved: ${result.partnerReferenceNo}`);
    }
    if (result.additionalInfo?.channel) {
      await saveKey("lastChannel", result.additionalInfo.channel);
      logger.info(`💾 Channel saved: ${result.additionalInfo.channel}`);
    }
    if (result.webRedirectUrl) {
      await saveKey("lastWebRedirectUrl", result.webRedirectUrl);
      logger.info(`🌐 Web Redirect URL: ${result.webRedirectUrl}`);
    }
    if (result.appRedirectUrl) {
      await saveKey("lastAppRedirectUrl", result.appRedirectUrl);
      logger.info(`📱 App Redirect URL: ${result.appRedirectUrl}`);
    }
  }

  return result;
}

async function deleteva(payload = {}, simulate = false) {
  if (payload.virtualAccountNo) {
    payload.virtualAccountNo = resolveCleanVaNumber(payload.virtualAccountNo);
  }
  // Winpay SNAP requires POST method for /v1.0/transfer-va/delete-va
  return await sendRequest("/v1.0/transfer-va/delete-va", payload, simulate, "POST");
}

async function transactionlist(payload = {}, simulate = false) {
  return await sendRequest("/v1.0/transaction-history-list", payload, simulate, "POST");
}

module.exports = { createva, inquiryva, statusva, deleteva, createqris, createewallet, transactionlist };


