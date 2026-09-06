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


  // ─── Health Check ─────────────────────────────────────────────────────────
  fastify.get("/api/health", async (request, reply) => {
    return reply.send({
      status: "ONLINE",
      environment: CONFIG.env,
      port: API_PORT,
      timestamp: new Date().toISOString(),
      endpoints: {
        snap: {
          createVA:     "POST /api/snap/va",
          inquiryVA:    "POST /api/snap/inquiry-va",
          statusVA:     "POST /api/snap/status-va",
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
    logger.info(`📌 Port        : ${API_PORT}`);
    logger.info(`📌 Environment : ${CONFIG.env}`);
    logger.info(`📌 Health      : http://localhost:${API_PORT}/api/health`);
    logger.info(`📌 SNAP VA     : POST http://localhost:${API_PORT}/api/snap/va`);
    logger.info(`📌 SNAP QRIS   : POST http://localhost:${API_PORT}/api/snap/qris`);
    logger.info(`📌 eWallet     : POST http://localhost:${API_PORT}/api/snap/ewallet`);
    logger.info(`📌 Invoice     : POST http://localhost:${API_PORT}/api/checkout/invoice`);
    logger.info(`📌 Callback    : POST http://localhost:${API_PORT}/api/callback/snap`);
    logger.info(`📌 State       : GET  http://localhost:${API_PORT}/api/state`);
    logger.info("====================================================");
  } catch (err) {
    logger.error("❌ Gagal menjalankan API server:", err.message);
    process.exit(1);
  }
}

start();
