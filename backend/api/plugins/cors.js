"use strict";

/**
 * CORS Plugin untuk Fastify
 * Mengizinkan akses dari Next.js frontend (localhost:3000)
 * dan tools development seperti Postman / browser
 */
const fp = require("fastify-plugin");
const cors = require("@fastify/cors");

async function corsPlugin(fastify) {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
  ].filter(Boolean);

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      // Allow any localhost/127.0.0.1 port dynamically
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, true); // Permissive for simulator
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
}

module.exports = fp(corsPlugin);
