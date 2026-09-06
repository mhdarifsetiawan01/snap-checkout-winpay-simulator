"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const snapService    = require("../../services/snap");
const checkoutService = require("../../services/checkoutpage");
const { createVABody }       = require("../../templates/snap/createVA");
const { createQRISBody }     = require("../../templates/snap/createQRIS");
const { createEwalletBody }  = require("../../templates/snap/createEwallet");
const { inquiryVABody }      = require("../../templates/snap/inquiryVA");
const { paymentStatusBody }  = require("../../templates/snap/paymentStatus");
const { deleteVABody }       = require("../../templates/snap/deleteVA");
const { generateTimestamp }  = require("../../helpers/timestamp");
const { getKey, getTransactions, recordTransaction, updateTransactionStatus } = require("../../helpers/storage");

/**
 * Utility: override NODE_ENV dari query param ?env=
 * sehingga config.js membaca URL & key yang sesuai.
 *
 * ⚠️  config.js di-evaluate saat require() pertama kali.
 * Override env di sini memengaruhi pemanggilan config baru
 * di dalam service call (karena config di-require per modul).
 *
 * Untuk multi-env per-request yang benar-benar dinamis,
 * services perlu menerima overrideEnv — tapi untuk saat ini
 * cukup set process.env dan reload config.
 */
function applyEnvOverride(envParam) {
  const allowed = ["development", "sandbox", "production", "prod"];
  if (envParam && allowed.includes(envParam)) {
    process.env.NODE_ENV = envParam === "prod" ? "production" : envParam;
    // Hapus cache config agar re-evaluate dengan env baru
    delete require.cache[require.resolve("../../config/config")];
  }
}

/**
 * Routes SNAP API
 * @param {import('fastify').FastifyInstance} fastify
 */
async function snapRoutes(fastify) {
  // ─── Create Virtual Account ─────────────────────────────────────────────
  fastify.post("/snap/va", async (request, reply) => {
    const { channel, amount, expiredMinutes, env, partnerId } = request.body || {};
    let payload = null;
    try {
      applyEnvOverride(env || request.query.env);

      if (!channel) return reply.code(400).send({ error: "Field 'channel' wajib diisi" });
      if (!amount)  return reply.code(400).send({ error: "Field 'amount' wajib diisi" });

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      // Inject override ke dalam template via env vars sementara
      process.env.CHANNEL = channel;
      process.env.AMOUNT  = String(amount);

      payload = createVABody();
      const mins = Number(expiredMinutes) > 0 ? Number(expiredMinutes) : 5;
      payload.expiredDate = generateTimestamp(mins);

      const result  = await snapService.createva(payload, false);

      delete process.env.CHANNEL;
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      const vaNo = result?.virtualAccountData?.virtualAccountNo ||
                   result?.virtualAccountData?.customerNo ||
                   payload.virtualAccountNo;

      recordTransaction("va", {
        type: "VA",
        channel: channel,
        trxId: result?.virtualAccountData?.trxId || payload.trxId,
        partnerReferenceNo: payload.partnerReferenceNo || payload.trxId,
        virtualAccountNo: vaNo,
        amount: amount,
        status: "PENDING",
        env: process.env.NODE_ENV,
        rawResponse: result,
      });

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.CHANNEL;
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      let errorMsg = err.message;
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = parsed.error?.responseMessage || parsed.error?.message || JSON.stringify(parsed.error);
      } catch (_) {}

      recordTransaction("va", {
        type: "VA",
        channel: channel || "—",
        trxId: payload?.trxId || `ERR-${Date.now()}`,
        partnerReferenceNo: payload?.partnerReferenceNo || payload?.trxId,
        virtualAccountNo: payload?.virtualAccountNo || null,
        amount: amount || 0,
        status: "FAILED",
        errorMessage: errorMsg,
        env: process.env.NODE_ENV,
      });

      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Inquiry VA ─────────────────────────────────────────────────────────
  fastify.post("/snap/inquiry-va", async (request, reply) => {
    try {
      const { env, partnerId, virtualAccountNo, trxId, contractId, channel } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      let txContractId = contractId;
      let txChannel = channel;
      let txTrxId = trxId;
      let txVaNo = virtualAccountNo;

      if (trxId || virtualAccountNo) {
        const allVAs = getTransactions("va", 50);
        const matched = allVAs.find(t => (trxId && t.trxId === trxId) || (virtualAccountNo && t.virtualAccountNo === virtualAccountNo));
        if (matched) {
          txContractId = txContractId || matched.contractId || matched.rawResponse?.virtualAccountData?.additionalInfo?.contractId || matched.rawResponse?.additionalInfo?.contractId;
          txChannel = txChannel || matched.channel || matched.rawResponse?.virtualAccountData?.additionalInfo?.channel;
          txTrxId = txTrxId || matched.trxId;
          txVaNo = txVaNo || matched.virtualAccountNo;
        }
      }

      const payload = {
        trxId: txTrxId || getKey("lastTrxId"),
        additionalInfo: {
          contractId: txContractId || getKey("lastContractId"),
        },
      };

      const result = await snapService.inquiryva(payload, false);
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      // Update status jika inquiry mengindikasikan status bayar atau expired
      const vaData = result?.virtualAccountData || {};
      const expDateStr = vaData.expiredDate;
      if (expDateStr) {
        try {
          const expTime = new Date(expDateStr).getTime();
          if (!isNaN(expTime) && Date.now() > expTime) {
            updateTransactionStatus(
              { virtualAccountNo: txVaNo || vaData.virtualAccountNo, trxId: payload.trxId },
              "EXPIRED",
              { rawInquiryResponse: result }
            );
          }
        } catch (_) {}
      }

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Payment Status VA ───────────────────────────────────────────────────
  fastify.post("/snap/status-va", async (request, reply) => {
    try {
      const { env, partnerId, virtualAccountNo, trxId, channel, contractId } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      let txContractId = contractId;
      let txChannel = channel;
      let txTrxId = trxId;
      let txVaNo = virtualAccountNo;

      if (trxId || virtualAccountNo) {
        const allVAs = getTransactions("va", 50);
        const matched = allVAs.find(t => (trxId && t.trxId === trxId) || (virtualAccountNo && t.virtualAccountNo === virtualAccountNo));
        if (matched) {
          txContractId = txContractId || matched.contractId || matched.rawResponse?.virtualAccountData?.additionalInfo?.contractId || matched.rawResponse?.additionalInfo?.contractId;
          txChannel = txChannel || matched.channel || matched.rawResponse?.virtualAccountData?.additionalInfo?.channel;
          txTrxId = txTrxId || matched.trxId;
          txVaNo = txVaNo || matched.virtualAccountNo;
        }
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

      const result = await snapService.statusva(payload, false);
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      // Update status di DB berdasarkan status pembayaran sesungguhnya (bukan responseCode API)
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

      let currentStatus = "PENDING";
      if (statusCandidates.some(s => ["PAID", "SUCCESS", "SETTLED", "0000", "00", "SUCCESSFUL"].includes(s))) {
        currentStatus = "PAID";
      } else if (statusCandidates.some(s => ["EXPIRED", "0002", "02"].includes(s))) {
        currentStatus = "EXPIRED";
      } else if (statusCandidates.some(s => ["FAILED", "0003", "03", "CANCELLED"].includes(s))) {
        currentStatus = "FAILED";
      } else if (statusCandidates.some(s => ["PENDING", "0001", "01", "UNPAID"].includes(s))) {
        currentStatus = "PENDING";
      }

      if (currentStatus !== "PENDING") {
        updateTransactionStatus(
          { virtualAccountNo: payload.virtualAccountNo, trxId: payload.trxId },
          currentStatus,
          { rawStatusResponse: result }
        );
      }

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Delete VA (POST & DELETE) ───────────────────────────────────────────
  const handleDeleteVA = async (request, reply) => {
    try {
      const { env, partnerId, virtualAccountNo, trxId, channel, contractId } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      let txContractId = contractId;
      let txChannel = channel;
      let txTrxId = trxId;
      let txVaNo = virtualAccountNo;

      if (trxId || virtualAccountNo) {
        const allVAs = getTransactions("va", 50);
        const matched = allVAs.find(t => (trxId && t.trxId === trxId) || (virtualAccountNo && t.virtualAccountNo === virtualAccountNo));
        if (matched) {
          txContractId = txContractId || matched.contractId || matched.rawResponse?.virtualAccountData?.additionalInfo?.contractId || matched.rawResponse?.additionalInfo?.contractId;
          txChannel = txChannel || matched.channel;
          txTrxId = txTrxId || matched.trxId;
          txVaNo = txVaNo || matched.virtualAccountNo;
        }
      }

      const payload = {
        virtualAccountNo: String(txVaNo || getKey("lastVirtualAccountNo") || "").trim(),
        trxId: txTrxId || getKey("lastTrxId"),
        additionalInfo: {
          contractId: txContractId || getKey("lastContractId"),
          channel: txChannel || getKey("lastChannel"),
        },
      };

      const result = await snapService.deleteva(payload, false);
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      // Update status di DB transaksi lokal menjadi CANCELLED / DELETED jika sukses
      if (result?.responseCode === "2002900" || result?.responseCode === "200" || result?.responseMessage?.toLowerCase()?.includes("success")) {
        updateTransactionStatus(
          { virtualAccountNo: payload.virtualAccountNo, trxId: payload.trxId },
          "CANCELLED",
          { rawDeleteResponse: result }
        );
      }

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  };

  fastify.post("/snap/delete-va", handleDeleteVA);
  fastify.delete("/snap/va", handleDeleteVA);
  fastify.delete("/snap/delete-va", handleDeleteVA);
  fastify.delete("/v1.0/transfer-va/delete-va", handleDeleteVA);

  // ─── Create QRIS ─────────────────────────────────────────────────────────
  fastify.post("/snap/qris", async (request, reply) => {
    const { amount, expiredMinutes, env, partnerId } = request.body || {};
    let payload = null;
    try {
      applyEnvOverride(env || request.query.env);

      if (!amount) return reply.code(400).send({ error: "Field 'amount' wajib diisi" });

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      process.env.AMOUNT = String(amount);
      payload = createQRISBody();
      const mins = Number(expiredMinutes) > 0 ? Number(expiredMinutes) : 5;
      payload.validityPeriod = generateTimestamp(mins);

      const result = await snapService.createqris(payload, false);
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      recordTransaction("qris", {
        type: "QRIS",
        channel: "QRIS",
        trxId: payload.partnerReferenceNo || payload.trxId,
        partnerReferenceNo: payload.partnerReferenceNo || payload.trxId,
        amount: amount,
        qrContent: result?.qrContent || result?.qrString || result?.qrCode || null,
        status: "PENDING",
        env: process.env.NODE_ENV,
        rawResponse: result,
      });

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      let errorMsg = err.message;
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = parsed.error?.responseMessage || parsed.error?.message || JSON.stringify(parsed.error);
      } catch (_) {}

      recordTransaction("qris", {
        type: "QRIS",
        channel: "QRIS",
        trxId: payload?.partnerReferenceNo || `ERR-${Date.now()}`,
        partnerReferenceNo: payload?.partnerReferenceNo || null,
        amount: amount || 0,
        status: "FAILED",
        errorMessage: errorMsg,
        env: process.env.NODE_ENV,
      });

      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Create eWallet ──────────────────────────────────────────────────────
  fastify.post("/snap/ewallet", async (request, reply) => {
    const { channel, amount, expiredMinutes, env, partnerId } = request.body || {};
    let payload = null;
    try {
      applyEnvOverride(env || request.query.env);

      if (!channel) return reply.code(400).send({ error: "Field 'channel' wajib diisi (SPAY/DANA/OVO/SC/ASTRA)" });
      if (!amount)  return reply.code(400).send({ error: "Field 'amount' wajib diisi" });

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      process.env.CHANNEL = channel;
      process.env.AMOUNT  = String(amount);

      payload = createEwalletBody();
      const mins = Number(expiredMinutes) > 0 ? Number(expiredMinutes) : 5;
      payload.validUpTo = generateTimestamp(mins);

      const result = await snapService.createewallet(payload, false);

      delete process.env.CHANNEL;
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      recordTransaction("ewallet", {
        type: "EWALLET",
        channel: channel,
        trxId: payload.partnerReferenceNo || payload.trxId,
        partnerReferenceNo: payload.partnerReferenceNo || payload.trxId,
        amount: amount,
        webRedirectUrl: result?.webRedirectUrl || result?.redirectUrl || null,
        appRedirectUrl: result?.appRedirectUrl || null,
        status: "PENDING",
        env: process.env.NODE_ENV,
        rawResponse: result,
      });

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.CHANNEL;
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      let errorMsg = err.message;
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = parsed.error?.responseMessage || parsed.error?.message || JSON.stringify(parsed.error);
      } catch (_) {}

      recordTransaction("ewallet", {
        type: "EWALLET",
        channel: channel || "—",
        trxId: payload?.partnerReferenceNo || `ERR-${Date.now()}`,
        partnerReferenceNo: payload?.partnerReferenceNo || null,
        amount: amount || 0,
        status: "FAILED",
        errorMessage: errorMsg,
        env: process.env.NODE_ENV,
      });

      return reply.code(500).send({ success: false, error: err.message });
    }
  });
}

module.exports = snapRoutes;
