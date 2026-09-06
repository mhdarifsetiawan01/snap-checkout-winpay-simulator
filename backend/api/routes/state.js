"use strict";

const { getKey } = require("../../helpers/storage");

/**
 * Routes State — Baca state transaksi terakhir dari db.json
 * @param {import('fastify').FastifyInstance} fastify
 */
async function stateRoutes(fastify) {
  fastify.get("/state", async (request, reply) => {
    const state = {
      lastContractId:        getKey("lastContractId")        || null,
      lastTrxId:             getKey("lastTrxId")             || null,
      lastVirtualAccountNo:  getKey("lastVirtualAccountNo")  || null,
      lastChannel:           getKey("lastChannel")           || null,
      lastPartnerReferenceNo: getKey("lastPartnerReferenceNo") || null,
      lastWebRedirectUrl:    getKey("lastWebRedirectUrl")    || null,
      lastAppRedirectUrl:    getKey("lastAppRedirectUrl")    || null,
      lastInvoiceId:         getKey("lastInvoiceId")         || null,
      lastInvoiceRef:        getKey("lastInvoiceRef")        || null,
      lastCallbackReceived:  getKey("lastCallbackReceived")  || null,
    };

    return reply.send({ success: true, data: state });
  });

  // ─── GET /api/config — Info Credential & URL Berdasarkan Environment ────────
  fastify.get("/config", async (request, reply) => {
    require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env"), override: true });

    const env = request.query.env || process.env.NODE_ENV || "development";
    const isProd = env === "production" || env === "prod";
    const isSandbox = env === "sandbox";


    const snapBaseUrl = isProd
      ? process.env.SNAP_BASE_URL_PROD
      : isSandbox
        ? process.env.SNAP_BASE_URL_SANDBOX
        : process.env.SNAP_BASE_URL_DEV;

    const snapPartnerId = isProd
      ? process.env.SNAP_MERCHANT_KEY_PROD
      : isSandbox
        ? (process.env.SNAP_MERCHANT_KEY_SANDBOX || process.env.SNAP_MERCHANT_KEY_DEV)
        : (process.env.SNAP_MERCHANT_KEY_DEV || process.env.SNAP_MERCHANT_KEY_SANDBOX);


    const checkoutBaseUrl = isProd
      ? process.env.CHECKOUT_BASE_URL_PROD
      : isSandbox
        ? process.env.CHECKOUT_BASE_URL_SANDBOX
        : process.env.CHECKOUT_BASE_URL_DEV;

    const checkoutClientKey = isProd
      ? process.env.CHECKOUT_CLIENT_KEY_PROD
      : isSandbox
        ? process.env.CHECKOUT_CLIENT_KEY_SANDBOX
        : process.env.CHECKOUT_CLIENT_KEY_DEV;

    const enableIpWhitelist = process.env.ENABLE_IP_WHITELIST === "true" || process.env.ENABLE_IP_WHITELIST === "1";
    const allowedIps = (process.env.ALLOWED_IPS || "").split(",").map(s => s.trim()).filter(Boolean);

    return reply.send({
      success: true,
      data: {
        env,
        ipWhitelist: {
          enabled: enableIpWhitelist,
          allowedIpsCount: allowedIps.length,
          allowedIps: enableIpWhitelist ? allowedIps : [],
        },
        snap: {
          baseUrl: snapBaseUrl || "—",
          partnerId: snapPartnerId || "—",
          privateKey: isProd ? "private_key_prod.pem" : "private_key_dev.pem",
        },
        checkout: {
          baseUrl: checkoutBaseUrl || "—",
          clientKey: checkoutClientKey || "—",
        },
      },
    });
  });
}

module.exports = stateRoutes;
