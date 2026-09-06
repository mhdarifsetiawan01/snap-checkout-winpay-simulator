const http = require("http");
const https = require("https");
const axios = require("axios");
const CONFIG = require("../config/config");
const { generateTimestamp } = require("../helpers/timestamp");
const { generateSignature } = require("../helpers/signature");
const { generateExternalId } = require("../helpers/externalId");
const logger = require("../helpers/logger");
const { saveKey } = require("../helpers/storage");

const httpAgent = new http.Agent({ family: 4, keepAlive: false });
const httpsAgent = new https.Agent({ family: 4, keepAlive: false });

/**
 * Generic request ke SNAP API
 */
async function sendRequest(endpoint, payload, simulate = true) {
  const url = `${CONFIG.SNAP_BASE_URL}${endpoint}`;
  const httpMethod = "POST";
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
    logger.debug("URL:", url);
    logger.debug("Headers:", headers);
    logger.debug("Body:", JSON.stringify(payload, null, 2));
    logger.debug("StringToSign:", stringToSign);
    logger.debug("Signature:", signature);
    // return null;
  }

  // eksekusi request real
  try {
    logger.info(`📡 Sending request to: ${url}`);
    const response = await axios.post(url, payload, {
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
    logger.error("❌ Request Failed:", errorData);
    throw new Error(
      JSON.stringify(
        {
          endpoint,
          error: errorData,
          stringToSign,
          timestamp,
        },
        null,
        2
      )
    );
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
    if (vaData.virtualAccountNo) {
      if (payload.additionalInfo.channel == "INDOMARET") {
        await saveKey("lastVirtualAccountNo", vaData.customerNo);
        logger.info(`💾 customerNo saved: ${vaData.customerNo}`);
      } else {
        await saveKey("lastVirtualAccountNo", vaData.virtualAccountNo);
        logger.info(`💾 VA Number saved: ${vaData.virtualAccountNo}`);
      }
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

module.exports = { createva, inquiryva, statusva, createqris, createewallet };


