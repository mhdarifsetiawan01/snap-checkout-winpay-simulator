"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const checkoutService = require("../../services/checkoutpage");
const { createInvoiceBody } = require("../../templates/checkoutpage/createInvoice");
const { getKey, saveKey, recordTransaction, updateTransactionStatus } = require("../../helpers/storage");

function applyEnvOverride(envParam) {
  const allowed = ["development", "sandbox", "production", "prod"];
  const target = envParam || process.env.DEFAULT_ENV || process.env.NODE_ENV || "development";
  if (allowed.includes(target)) {
    process.env.NODE_ENV = target === "prod" ? "production" : target;
    delete require.cache[require.resolve("../../config/config")];
  }
}

/**
 * Routes Checkout Page API
 * @param {import('fastify').FastifyInstance} fastify
 */
async function checkoutPageRoutes(fastify) {
  // ─── Create Invoice ──────────────────────────────────────────────────────
  fastify.post("/checkout/invoice", async (request, reply) => {
    const { price, productName, interval, expiredMinutes, env, clientKey, secretKey } = request.body || {};
    let payload = null;
    try {
      applyEnvOverride(env || request.query.env);

      if (!price)       return reply.code(400).send({ error: "Field 'price' wajib diisi" });
      if (!productName) return reply.code(400).send({ error: "Field 'productName' wajib diisi" });

      if (clientKey && String(clientKey).trim() !== "") {
        process.env.CHECKOUT_CLIENT_KEY_OVERRIDE = String(clientKey).trim();
      }
      if (secretKey && String(secretKey).trim() !== "") {
        process.env.CHECKOUT_SECRET_KEY_OVERRIDE = String(secretKey).trim();
      }

      // Inject ke env agar template bisa baca
      process.env.PRICE        = String(price);
      process.env.PRODUCT_NAME = String(productName);

      const intervalMins = Number(expiredMinutes || interval) > 0 ? Number(expiredMinutes || interval) : 5;
      payload = createInvoiceBody({ interval: intervalMins });
      const result  = await checkoutService.createinvoice(payload, false);

      delete process.env.PRICE;
      delete process.env.PRODUCT_NAME;
      delete process.env.CHECKOUT_CLIENT_KEY_OVERRIDE;
      delete process.env.CHECKOUT_SECRET_KEY_OVERRIDE;

      const invoiceId = result?.responseData?.id || result?.invoiceId || result?.data?.id || getKey("lastInvoiceId");
      const redirectUrl = result?.responseData?.redirect_url || result?.responseData?.redirectUrl || result?.redirect_url || result?.redirectUrl || result?.data?.redirect_url || result?.data?.url;

      if (redirectUrl) {
        await saveKey("lastWebRedirectUrl", redirectUrl);
      }

      recordTransaction("checkout", {
        type: "INVOICE",
        channel: "Checkout Page",
        invoiceId: invoiceId,
        partnerReferenceNo: payload.invoice?.ref || payload.reference,
        amount: price,
        interval: intervalMins,
        webRedirectUrl: redirectUrl,
        redirect_url: redirectUrl,
        status: "PENDING",
        env: process.env.NODE_ENV,
        rawResponse: result,
      });

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.PRICE;
      delete process.env.PRODUCT_NAME;
      delete process.env.CHECKOUT_CLIENT_KEY_OVERRIDE;
      delete process.env.CHECKOUT_SECRET_KEY_OVERRIDE;

      let errorMsg = err.message;
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = parsed.error?.message || parsed.error?.status || JSON.stringify(parsed.error);
      } catch (_) {}

      recordTransaction("checkout", {
        type: "INVOICE",
        channel: "Checkout Page",
        partnerReferenceNo: payload?.reference || `ERR-${Date.now()}`,
        amount: price || 0,
        status: "FAILED",
        errorMessage: errorMsg,
        env: process.env.NODE_ENV,
      });

      const statusCode = err.statusCode || err.response?.status || 500;
      return reply.code(statusCode).send({
        success: false,
        error: errorMsg,
        data: err.responseData || err.response?.data || null,
        rawError: err.message,
      });
    }
  });

  // ─── Find / Status Invoice Terakhir ──────────────────────────────────────
  fastify.get("/checkout/invoice/last", async (request, reply) => {
    try {
      applyEnvOverride(request.query.env);

      const invoiceId = request.query.invoiceId || getKey("lastInvoiceId");
      if (!invoiceId) {
        return reply.code(404).send({
          success: false,
          error: "Belum ada invoice tersimpan. Buat invoice terlebih dahulu.",
        });
      }

      const result = await checkoutService.findinvoice(invoiceId, false);

      // Update status jika invoice terbayar / expired
      const responseData = result?.responseData || result?.data || {};
      const statusStr = String(responseData.status || result?.status || "").toUpperCase();
      if (statusStr === "0000" || statusStr === "PAID" || statusStr === "SETTLED" || statusStr === "SUCCESS") {
        updateTransactionStatus(
          { invoiceId: invoiceId },
          "PAID",
          { rawStatusResponse: result }
        );
      } else if (statusStr === "EXPIRED") {
        updateTransactionStatus(
          { invoiceId: invoiceId },
          "EXPIRED",
          { rawStatusResponse: result }
        );
      } else {
        // Time-based expiry check (Winpay returns UNPAID even after expiry)
        const createdTimeStr = responseData.created_at;
        const createdTime = createdTimeStr ? new Date(createdTimeStr.replace(" ", "T") + "+07:00").getTime() : null;
        const { getTransactions } = require("../../helpers/storage");
        const allCheckout = getTransactions("checkout", 50) || [];
        const matchedTx = allCheckout.find(t => t.invoiceId === invoiceId);
        const intervalMins = Number(matchedTx?.interval) > 0 ? Number(matchedTx.interval) : 5;
        const baseTime = (matchedTx?.createdAt ? new Date(matchedTx.createdAt).getTime() : null) || createdTime;

        if (baseTime && (Date.now() > baseTime + intervalMins * 60 * 1000)) {
          updateTransactionStatus(
            { invoiceId: invoiceId },
            "EXPIRED",
            { rawStatusResponse: result }
          );
        }
      }

      return reply.send({ success: true, invoiceId, data: result });
    } catch (err) {
      const statusCode = err.statusCode || err.response?.status || 500;
      let errorMsg = err.message;
      let errorData = null;
      try {
        const parsed = JSON.parse(err.message);
        errorData = parsed.error;
        errorMsg = parsed.error?.message || parsed.error?.status || JSON.stringify(parsed.error);
      } catch (_) {}

      return reply.code(statusCode).send({
        success: false,
        error: errorMsg,
        data: err.responseData || err.response?.data || errorData || null,
        rawError: err.message,
      });
    }
  });
}

module.exports = checkoutPageRoutes;
