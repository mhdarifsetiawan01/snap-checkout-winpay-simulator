"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const checkoutService = require("../../services/checkoutpage");
const { createInvoiceBody } = require("../../templates/checkoutpage/createInvoice");
const { getKey, saveKey, recordTransaction, updateTransactionStatus } = require("../../helpers/storage");

function applyEnvOverride(envParam) {
  const allowed = ["development", "sandbox", "production", "prod"];
  if (envParam && allowed.includes(envParam)) {
    process.env.NODE_ENV = envParam === "prod" ? "production" : envParam;
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

      return reply.code(500).send({ success: false, error: err.message });
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

      // Update status jika invoice sudah terbayar
      const statusStr = String(result?.status || result?.data?.status || "").toUpperCase();
      if (statusStr === "0000" || statusStr === "PAID" || statusStr === "SETTLED" || statusStr === "SUCCESS") {
        updateTransactionStatus(
          { invoiceId: invoiceId },
          "PAID",
          { rawStatusResponse: result }
        );
      }

      return reply.send({ success: true, invoiceId, data: result });
    } catch (err) {
      return reply.code(500).send({ success: false, error: err.message });
    }
  });
}

module.exports = checkoutPageRoutes;
