"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const checkoutService = require("../../services/checkoutpage");
const { createInvoiceBody } = require("../../templates/checkoutpage/createInvoice");
const { getKey } = require("../../helpers/storage");

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
    try {
      const { price, productName, env } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (!price)       return reply.code(400).send({ error: "Field 'price' wajib diisi" });
      if (!productName) return reply.code(400).send({ error: "Field 'productName' wajib diisi" });

      // Inject ke env agar template bisa baca
      process.env.PRICE        = String(price);
      process.env.PRODUCT_NAME = String(productName);

      const payload = createInvoiceBody();
      const result  = await checkoutService.createinvoice(payload, false);

      delete process.env.PRICE;
      delete process.env.PRODUCT_NAME;

      return reply.send({ success: true, data: result });
    } catch (err) {
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Find / Status Invoice Terakhir ──────────────────────────────────────
  fastify.get("/checkout/invoice/last", async (request, reply) => {
    try {
      applyEnvOverride(request.query.env);

      const invoiceId = getKey("lastInvoiceId");
      if (!invoiceId) {
        return reply.code(404).send({
          success: false,
          error: "Belum ada invoice tersimpan. Buat invoice terlebih dahulu.",
        });
      }

      const result = await checkoutService.findinvoice(invoiceId, false);
      return reply.send({ success: true, invoiceId, data: result });
    } catch (err) {
      return reply.code(500).send({ success: false, error: err.message });
    }
  });
}

module.exports = checkoutPageRoutes;
