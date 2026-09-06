"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const snapService    = require("../../services/snap");
const checkoutService = require("../../services/checkoutpage");
const { createVABody }       = require("../../templates/snap/createVA");
const { createQRISBody }     = require("../../templates/snap/createQRIS");
const { createEwalletBody }  = require("../../templates/snap/createEwallet");
const { inquiryVABody }      = require("../../templates/snap/inquiryVA");
const { paymentStatusBody }  = require("../../templates/snap/paymentStatus");

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
    try {
      const { channel, amount, env, partnerId } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (!channel) return reply.code(400).send({ error: "Field 'channel' wajib diisi" });
      if (!amount)  return reply.code(400).send({ error: "Field 'amount' wajib diisi" });

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      // Inject override ke dalam template via env vars sementara
      process.env.CHANNEL = channel;
      process.env.AMOUNT  = String(amount);

      const payload = createVABody();
      const result  = await snapService.createva(payload, false);

      delete process.env.CHANNEL;
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Inquiry VA ─────────────────────────────────────────────────────────
  fastify.post("/snap/inquiry-va", async (request, reply) => {
    try {
      const { env, partnerId } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      const payload = inquiryVABody();
      const result  = await snapService.inquiryva(payload, false);
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Payment Status VA ───────────────────────────────────────────────────
  fastify.post("/snap/status-va", async (request, reply) => {
    try {
      const { env, partnerId } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      const payload = paymentStatusBody();
      const result  = await snapService.statusva(payload, false);
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Create QRIS ─────────────────────────────────────────────────────────
  fastify.post("/snap/qris", async (request, reply) => {
    try {
      const { amount, env, partnerId } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (!amount) return reply.code(400).send({ error: "Field 'amount' wajib diisi" });

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      process.env.AMOUNT = String(amount);
      const payload = createQRISBody();
      const result  = await snapService.createqris(payload, false);
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // ─── Create eWallet ──────────────────────────────────────────────────────
  fastify.post("/snap/ewallet", async (request, reply) => {
    try {
      const { channel, amount, env, partnerId } = request.body || {};
      applyEnvOverride(env || request.query.env);

      if (!channel) return reply.code(400).send({ error: "Field 'channel' wajib diisi (SPAY/DANA/OVO/SC/ASTRA)" });
      if (!amount)  return reply.code(400).send({ error: "Field 'amount' wajib diisi" });

      if (partnerId && String(partnerId).trim() !== "") {
        process.env.SNAP_PARTNER_ID_OVERRIDE = String(partnerId).trim();
      }

      process.env.CHANNEL = channel;
      process.env.AMOUNT  = String(amount);

      const payload = createEwalletBody();
      const result  = await snapService.createewallet(payload, false);

      delete process.env.CHANNEL;
      delete process.env.AMOUNT;
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;

      return reply.send({ success: true, data: result });
    } catch (err) {
      delete process.env.SNAP_PARTNER_ID_OVERRIDE;
      return reply.code(500).send({ success: false, error: err.message });
    }
  });
}

module.exports = snapRoutes;
