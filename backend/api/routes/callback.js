"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const CONFIG = require("../../config/config");
const { verifySnapCallback, verifyCheckoutCallback } = require("../../helpers/callback-verifier");
const { saveKey, updateTransactionStatus } = require("../../helpers/storage");
const logger = require("../../helpers/logger");

/**
 * Helper untuk memproses callback SNAP
 */
async function handleSnapCallback(request, reply) {
  const headers        = request.headers;
  const snapSignature  = headers["x-signature"];
  const snapTimestamp  = headers["x-timestamp"];
  const snapPartnerId  = headers["x-partner-id"];
  const snapExternalId = headers["x-external-id"];
  const rawBody        = JSON.stringify(request.body);
  const pathname       = (request.raw?.url || request.url || "").split("?")[0];
  let clientIp =
    request.clientIp ||
    headers["cf-connecting-ip"] ||
    (headers["x-forwarded-for"] ? headers["x-forwarded-for"].split(",")[0].trim() : null) ||
    headers["x-real-ip"] ||
    request.ip ||
    "127.0.0.1";
  if (clientIp && clientIp.startsWith("::ffff:")) clientIp = clientIp.replace("::ffff:", "");
  const country = headers["cf-ipcountry"] ? ` [${headers["cf-ipcountry"]}]` : "";

  logger.info(`📥 [SNAP] Callback masuk: POST ${pathname} | 🌐 IP: ${clientIp}${country}`);
  logger.debug("Headers:", JSON.stringify(headers, null, 2));
  logger.debug("Body:", JSON.stringify(request.body, null, 2));

  const isVerified = verifySnapCallback({
    httpMethod: "POST",
    path: pathname,
    body: rawBody,
    timestamp: snapTimestamp,
    signature: snapSignature,
    publicKeyPath: CONFIG.WINPAY_PUBLIC_KEY_PATH,
  });

  if (isVerified) {
    logger.success(`🔐 [SNAP] Signature VALID (IP: ${clientIp})`);
  } else {
    logger.warn(`⚠️ [SNAP] Signature INVALID atau Public Key belum disetel (IP: ${clientIp}).`);
  }

  // Update status transaksi di database JSON menjadi PAID
  const bodyTrxId = request.body?.trxId || request.body?.partnerReferenceNo || snapExternalId;
  const bodyVaNo = request.body?.virtualAccountNo || request.body?.customerNo;
  const bodyPartnerRef = request.body?.partnerReferenceNo || request.body?.referenceNo;

  const updatedTx = updateTransactionStatus(
    { trxId: bodyTrxId, virtualAccountNo: bodyVaNo, partnerReferenceNo: bodyPartnerRef },
    "PAID",
    { callbackData: request.body }
  );

  if (updatedTx) {
    logger.success(`🎉 [DB] Status transaksi ${updatedTx.trxId || updatedTx.virtualAccountNo || updatedTx.id} berhasil diupdate ke PAID`);
  }

  await saveKey("lastCallbackReceived", {
    type: "SNAP",
    path: pathname,
    clientIp,
    timestamp: new Date().toISOString(),
    headers: {
      "x-timestamp":  snapTimestamp,
      "x-signature":  snapSignature,
      "x-partner-id": snapPartnerId,
      "x-external-id": snapExternalId,
    },
    body: request.body,
    isSignatureValid: isVerified,
  });

  // Tentukan response code SNAP BI yang sesuai
  const responseCode = pathname.includes("inquiry") ? "2002400" : "2002500";

  return reply.code(200).send({
    responseCode,
    responseMessage: "Successful",
    virtualAccountData: request.body?.virtualAccountNo ? {
      partnerServiceId: request.body.partnerServiceId,
      customerNo: request.body.customerNo,
      virtualAccountNo: request.body.virtualAccountNo,
      virtualAccountName: request.body.virtualAccountName,
      trxId: request.body.trxId,
    } : undefined
  });
}

/**
 * Helper untuk memproses callback Checkout Page
 */
async function handleCheckoutCallback(request, reply) {
  const headers            = request.headers;
  const checkoutSignature  = headers["x-winpay-signature"];
  const checkoutTimestamp  = headers["x-winpay-timestamp"];
  const pathname           = (request.raw.url || request.url).split("?")[0];
  let clientIp =
    request.clientIp ||
    headers["cf-connecting-ip"] ||
    (headers["x-forwarded-for"] ? headers["x-forwarded-for"].split(",")[0].trim() : null) ||
    headers["x-real-ip"] ||
    request.ip ||
    "127.0.0.1";
  if (clientIp && clientIp.startsWith("::ffff:")) clientIp = clientIp.replace("::ffff:", "");
  const country = headers["cf-ipcountry"] ? ` [${headers["cf-ipcountry"]}]` : "";

  logger.info(`📥 [Checkout] Callback masuk: POST ${pathname} | 🌐 IP: ${clientIp}${country}`);
  logger.debug("Headers:", JSON.stringify(headers, null, 2));
  logger.debug("Body:", JSON.stringify(request.body, null, 2));

  const isVerified = verifyCheckoutCallback({
    timestamp: checkoutTimestamp,
    signature: checkoutSignature,
    secretKey: CONFIG.CHECKOUT_SECRET_KEY,
  });

  if (isVerified) {
    logger.success(`🔐 [Checkout] Signature VALID (IP: ${clientIp})`);
  } else {
    logger.warn(`⚠️ [Checkout] Signature INVALID (IP: ${clientIp}).`);
  }

  // Update status transaksi invoice di database JSON menjadi PAID
  const bodyInvoiceId = request.body?.invoice_id || request.body?.invoiceId || request.body?.id;
  const bodyRef = request.body?.reference || request.body?.order_id;

  const updatedInvoiceTx = updateTransactionStatus(
    { invoiceId: bodyInvoiceId, partnerReferenceNo: bodyRef },
    "PAID",
    { callbackData: request.body }
  );

  if (updatedInvoiceTx) {
    logger.success(`🎉 [DB] Status Invoice ${updatedInvoiceTx.invoiceId || updatedInvoiceTx.id} berhasil diupdate ke PAID`);
  }

  await saveKey("lastCallbackReceived", {
    type: "CHECKOUT",
    path: pathname,
    clientIp,
    timestamp: new Date().toISOString(),
    headers: {
      "x-winpay-timestamp": checkoutTimestamp,
      "x-winpay-signature": checkoutSignature,
    },
    body: request.body,
    isSignatureValid: isVerified,
  });

  return reply.code(200).send({
    status: "0000",
    message: "Success",
  });
}


/**
 * Routes Webhook / Callback Receiver
 * Endpoint ini dipanggil oleh Winpay server, bukan oleh frontend.
 * @param {import('fastify').FastifyInstance} fastify
 */
async function callbackRoutes(fastify) {
  // ─── SNAP Callback Routes (Dukung berbagai format URL Winpay) ─────────────
  fastify.post("/callback/snap", handleSnapCallback);
  fastify.post("/callback/snap/*", handleSnapCallback);

  // Standar path SNAP BI langsung
  fastify.post("/v1.0/transfer-va/payment", handleSnapCallback);
  fastify.post("/v1.0/transfer-va/inquiry", handleSnapCallback);
  fastify.post("/v1.0/qr/qr-mpm-notify", handleSnapCallback);
  fastify.post("/v1.0/debit/notify", handleSnapCallback);
  fastify.post("/v1.0/*", handleSnapCallback);

  // ─── Checkout Page Callback Routes ────────────────────────────────────────
  fastify.post("/callback/checkout", handleCheckoutCallback);
  fastify.post("/callback/checkout/*", handleCheckoutCallback);
  fastify.post("/checkout/callback", handleCheckoutCallback);
}

module.exports = callbackRoutes;

