"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const Fastify   = require("fastify");
const CONFIG    = require("../config/config");
const logger    = require("../helpers/logger");

// Routes
const snapRoutes        = require("./routes/snap");
const checkoutRoutes    = require("./routes/checkoutpage");
const callbackRoutes    = require("./routes/callback");
const stateRoutes       = require("./routes/state");

const API_PORT = Number(process.env.API_PORT || process.env.PORT || 3001);

async function buildServer() {
  const fastify = Fastify({
    logger: false, // pakai logger.js sendiri
  });

  // ─── Plugin: CORS ────────────────────────────────────────────────────────
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  await fastify.register(require("@fastify/cors"), {
    origin: (origin, cb) => {
      // Allow requests with no origin (like server-to-server, curl, webhook)
      if (!origin) return cb(null, true);
      // Allow localhost/127.0.0.1 on any port dynamically
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, true); // Permissive for simulator environment
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-TIMESTAMP",
      "X-SIGNATURE",
      "X-PARTNER-ID",
      "X-EXTERNAL-ID",
      "CHANNEL-ID",
      "X-Winpay-Timestamp",
      "X-Winpay-Signature",
      "X-Winpay-Key",
    ],
  });

  // ─── Global Request Logger & IP Whitelist Guard ─────────────────────────
  fastify.addHook("onRequest", async (request, reply) => {
    const headers = request.headers || {};
    let ip =
      headers["cf-connecting-ip"] ||
      (headers["x-forwarded-for"] ? headers["x-forwarded-for"].split(",")[0].trim() : null) ||
      headers["x-real-ip"] ||
      request.ip ||
      request.raw?.socket?.remoteAddress ||
      "127.0.0.1";

    if (ip && ip.startsWith("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    request.clientIp = ip;
    const country = headers["cf-ipcountry"] ? ` [${headers["cf-ipcountry"]}]` : "";
    const urlPath = (request.url || "").split("?")[0];
    const isWebhook = request.url.includes("callback") || request.url.startsWith("/v1.0/");
    const isHealthCheck = urlPath === "/" || urlPath === "/health" || urlPath === "/api/health";

    if (isWebhook) {
      logger.info(`📥 [WEBHOOK HIT] ${request.method} ${request.url} | 🌐 Client IP: ${ip}${country}`);
    } else if (isHealthCheck) {
      logger.info(`🌐 [HEALTH CHECK] ${request.method} ${request.url} | 🌐 Client IP: ${ip}${country}`);
    } else {
      logger.info(`🌐 [HTTP ${request.method}] ${request.url} | 🌐 Client IP: ${ip}${country}`);
    }

    // Bypass check untuk OPTIONS (CORS preflight), Health Check, dan Webhook Callbacks
    // Webhook Callback (SNAP & Checkout) sudah diverifikasi secara kriptografis menggunakan RSA Public Key & HMAC
    if (request.method === "OPTIONS") return;
    if (isHealthCheck) return;
    if (isWebhook) return;

    // Enforce IP Whitelist jika diaktifkan di .env untuk endpoint simulator lainnya
    if (CONFIG.ENABLE_IP_WHITELIST) {
      const allowedIps = CONFIG.ALLOWED_IPS;
      const isAllowed = allowedIps.includes(ip);

      if (!isAllowed) {
        logger.warn(`⛔ [IP BLOCKED] IP ${ip} tidak diizinkan mengakses ${request.method} ${request.url}`);
        return reply.status(403).send({
          responseCode: "4030000",
          responseMessage: `IP ${ip} tidak diizinkan, silahkan hubungi admin.`,
          clientIp: ip,
        });
      }
    }
  });

  // ─── Health Check ─────────────────────────────────────────────────────────

  fastify.get("/api/health", async (request, reply) => {
    return reply.send({
      status: "ONLINE",
      environment: CONFIG.env,
      port: API_PORT,
      timestamp: new Date().toISOString(),
      ipWhitelist: {
        enabled: CONFIG.ENABLE_IP_WHITELIST,
        allowedIpsCount: CONFIG.ALLOWED_IPS.length,
        allowedIps: CONFIG.ENABLE_IP_WHITELIST ? CONFIG.ALLOWED_IPS : [],
      },
      endpoints: {
        snap: {
          createVA:     "POST /api/snap/va",
          inquiryVA:    "POST /api/snap/inquiry-va",
          statusVA:     "POST /api/snap/status-va",
          deleteVA:     "POST /api/snap/delete-va | DELETE /api/snap/va",
          createQRIS:   "POST /api/snap/qris",
          createEwallet: "POST /api/snap/ewallet",
        },
        checkout: {
          createInvoice: "POST /api/checkout/invoice",
          findInvoice:   "GET  /api/checkout/invoice/last",
        },
        callback: {
          snap:     "POST /api/callback/snap",
          checkout: "POST /api/callback/checkout",
        },
        state: "GET /api/state",
      },
    });
  });

  // ─── Register Routes dengan prefix /api & root untuk callback ─────────────
  fastify.register(snapRoutes,     { prefix: "/api" });
  fastify.register(checkoutRoutes, { prefix: "/api" });
  fastify.register(callbackRoutes, { prefix: "/api" });
  fastify.register(callbackRoutes); // Support root paths seperti /v1.0/* dan /callback/*
  fastify.register(stateRoutes,    { prefix: "/api" });

  // ─── Global Error Handler ─────────────────────────────────────────────────
  fastify.setErrorHandler((error, request, reply) => {
    logger.error("❌ Unhandled error:", error.message);
    reply.code(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildServer();
    await fastify.listen({ port: Number(API_PORT), host: "0.0.0.0" });

    logger.info("====================================================");
    logger.info("🚀 Winpay Simulator API Server (Fastify) Aktif");
    logger.info(`📌 Port         : ${API_PORT}`);
    logger.info(`📌 Environment  : ${CONFIG.env}`);
    logger.info(`📌 IP Whitelist : ${CONFIG.ENABLE_IP_WHITELIST ? `AKTIF (${CONFIG.ALLOWED_IPS.join(", ")})` : "NONAKTIF (Semua IP diizinkan)"}`);
    logger.info(`📌 Health       : http://localhost:${API_PORT}/api/health`);
    logger.info(`📌 SNAP VA      : POST http://localhost:${API_PORT}/api/snap/va`);
    logger.info(`📌 SNAP QRIS    : POST http://localhost:${API_PORT}/api/snap/qris`);
    logger.info(`📌 eWallet      : POST http://localhost:${API_PORT}/api/snap/ewallet`);
    logger.info(`📌 Invoice      : POST http://localhost:${API_PORT}/api/checkout/invoice`);
    logger.info(`📌 Callback     : POST http://localhost:${API_PORT}/api/callback/snap`);
    logger.info(`📌 State        : GET  http://localhost:${API_PORT}/api/state`);
    logger.info("====================================================");
  } catch (err) {
    logger.error("❌ Gagal menjalankan API server:", err.message);
    process.exit(1);
  }
}

start();
