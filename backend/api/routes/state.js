"use strict";

const { getKey, getTransactions, updateTransactionStatus } = require("../../helpers/storage");
const snapService = require("../../services/snap");
const checkoutService = require("../../services/checkoutpage");
const { paymentStatusBody } = require("../../templates/snap/paymentStatus");
const { inquiryVABody } = require("../../templates/snap/inquiryVA");

/**
 * Routes State — Baca state transaksi terakhir dan daftar transaksi dari db.json
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

  // ─── GET /api/transactions — Daftar 10 Transaksi Terakhir per Kategori ──────
  fastify.get("/transactions", async (request, reply) => {
    const category = request.query.category || "all";
    const limit = Number(request.query.limit) || 10;
    const list = getTransactions(category, limit);
    return reply.send({ success: true, category, data: list });
  });

  // ─── POST /api/transactions/check-status — Inquiry Status Transaksi Manual ─
  fastify.post("/transactions/check-status", async (request, reply) => {
    try {
      const { id, type, virtualAccountNo, trxId, invoiceId, env, partnerId } = request.body || {};

      if (env) {
        process.env.NODE_ENV = env === "prod" ? "production" : env;
        delete require.cache[require.resolve("../../config/config")];
      }
      if (partnerId) {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      const txType = (type || "").toUpperCase();
      let result = null;
      let newStatus = "PENDING";

      if (txType === "VA") {
        let txContractId = request.body?.contractId;
        let txChannel = request.body?.channel;
        let txTrxId = trxId;
        let txVaNo = virtualAccountNo;

        // Cari data transaksi spesifik dari database lokal jika ada
        const allVAs = getTransactions("va", 50);
        const matched = allVAs.find(t => (id && t.id === id) || (trxId && t.trxId === trxId) || (virtualAccountNo && t.virtualAccountNo === virtualAccountNo));
        if (matched) {
          txContractId = txContractId || matched.contractId || matched.rawResponse?.virtualAccountData?.additionalInfo?.contractId || matched.rawResponse?.additionalInfo?.contractId;
          txChannel = txChannel || matched.channel || matched.rawResponse?.virtualAccountData?.additionalInfo?.channel || matched.rawResponse?.additionalInfo?.channel;
          txTrxId = txTrxId || matched.trxId;
          txVaNo = txVaNo || matched.virtualAccountNo;
        }

        const payload = {
          virtualAccountNo: String(txVaNo || getKey("lastVirtualAccountNo") || "").trim(),
          trxId: txTrxId || getKey("lastTrxId"),
          additionalInfo: {
            contractId: txContractId || getKey("lastContractId"),
            channel: txChannel || getKey("lastChannel"),
            trxId: txTrxId || getKey("lastTrxId"),
          },
        };

        result = await snapService.statusva(payload, false);
        const vaData = result?.virtualAccountData || {};
        const addInfo = vaData?.additionalInfo || result?.additionalInfo || {};
        const statusCandidates = [
          vaData.paymentFlagStatus,
          vaData.paidStatus,
          vaData.paymentStatus,
          vaData.status,
          addInfo.status,
          addInfo.paymentStatus,
          result?.paidStatus,
          result?.paymentStatus,
        ].filter(Boolean).map(s => String(s).trim().toUpperCase());

        if (statusCandidates.some(s => ["PAID", "SUCCESS", "SETTLED", "0000", "00", "SUCCESSFUL"].includes(s))) {
          newStatus = "PAID";
        } else if (statusCandidates.some(s => ["EXPIRED", "0002", "02"].includes(s))) {
          newStatus = "EXPIRED";
        } else if (statusCandidates.some(s => ["FAILED", "0003", "03", "CANCELLED"].includes(s))) {
          newStatus = "FAILED";
        } else {
          newStatus = "PENDING";
        }
      } else if (txType === "INVOICE" || txType === "CHECKOUT") {
        if (!invoiceId) return reply.code(400).send({ success: false, error: "invoiceId required" });
        const { clientKey, secretKey } = request.body || {};
        if (clientKey && String(clientKey).trim() !== "") {
          process.env.CHECKOUT_CLIENT_KEY_OVERRIDE = String(clientKey).trim();
        }
        if (secretKey && String(secretKey).trim() !== "") {
          process.env.CHECKOUT_SECRET_KEY_OVERRIDE = String(secretKey).trim();
        }

        result = await checkoutService.findinvoice(invoiceId, false);

        delete process.env.CHECKOUT_CLIENT_KEY_OVERRIDE;
        delete process.env.CHECKOUT_SECRET_KEY_OVERRIDE;

        const responseData = result?.responseData || result?.data || {};
        const statusStr = String(responseData.status || result?.status || "").toUpperCase();
        if (["SETTLED", "PAID", "SUCCESS", "0000"].includes(statusStr)) {
          newStatus = "PAID";
        } else if (["EXPIRED"].includes(statusStr)) {
          newStatus = "EXPIRED";
        } else if (["FAILED", "CANCELLED", "CANCELED"].includes(statusStr)) {
          newStatus = "FAILED";
        } else {
          newStatus = "PENDING";
        }
      } else {
        // Default check
        newStatus = "PENDING";
        result = { message: "Status check completed", type: txType };
      }

      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      delete process.env.CHECKOUT_CLIENT_KEY_OVERRIDE;
      delete process.env.CHECKOUT_SECRET_KEY_OVERRIDE;

      const updatedTx = updateTransactionStatus(
        { id, trxId, virtualAccountNo, invoiceId },
        newStatus,
        { rawStatusResponse: result }
      );

      return reply.send({
        success: true,
        status: newStatus,
        transaction: updatedTx,
        data: result,
      });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      delete process.env.CHECKOUT_CLIENT_KEY_OVERRIDE;
      delete process.env.CHECKOUT_SECRET_KEY_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
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

    const checkoutSecretKey = isProd
      ? process.env.CHECKOUT_SECRET_KEY_PROD
      : isSandbox
        ? process.env.CHECKOUT_SECRET_KEY_SANDBOX
        : process.env.CHECKOUT_SECRET_KEY_DEV;

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
          secretKey: checkoutSecretKey || "—",
        },
      },
    });
  });
}

module.exports = stateRoutes;
