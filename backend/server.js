require("dotenv").config();
const http = require("http");
const url = require("url");
const CONFIG = require("./config/config");
const logger = require("./helpers/logger");
const { saveKey, getKey } = require("./helpers/storage");
const { verifySnapCallback, verifyCheckoutCallback } = require("./helpers/callback-verifier");

const PORT = CONFIG.APP_PORT || 3000;

/**
 * Server Callback / Webhook Simulator
 */
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = reqUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle GET / (Health Check & Info)
  if (method === "GET" && (pathname === "/" || pathname === "/health")) {
    const lastCallback = getKey("lastCallbackReceived") || null;
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify(
        {
          status: "ONLINE",
          message: "Winpay SNAP & Checkout Callback Receiver Simulator is running",
          environment: CONFIG.env,
          port: PORT,
          endpoints: {
            snapCallback: `http://localhost:${PORT}/callback/snap`,
            checkoutCallback: `http://localhost:${PORT}/callback/checkout`,
          },
          lastCallbackReceived: lastCallback,
        },
        null,
        2
      )
    );
  }

  // Handle POST requests (Callback / Webhook)
  if (method === "POST") {
    let rawBody = "";

    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", async () => {
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch (e) {
        body = { raw: rawBody };
      }

      const headers = req.headers;
      const snapSignature = headers["x-signature"];
      const snapTimestamp = headers["x-timestamp"];
      const snapPartnerId = headers["x-partner-id"];
      const snapExternalId = headers["x-external-id"];

      const checkoutSignature = headers["x-winpay-signature"];
      const checkoutTimestamp = headers["x-winpay-timestamp"];

      const clientIp =
        headers["cf-connecting-ip"] ||
        (headers["x-forwarded-for"] ? headers["x-forwarded-for"].split(",")[0].trim() : null) ||
        headers["x-real-ip"] ||
        req.socket.remoteAddress ||
        "unknown";
      const cfCountry = headers["cf-ipcountry"] ? ` [${headers["cf-ipcountry"]}]` : "";

      logger.info(`📥 Incoming Callback [${method}] ${pathname} | 🌐 Client IP: ${clientIp}${cfCountry}`);
      logger.debug("Headers:", JSON.stringify(headers, null, 2));
      logger.debug("Body:", JSON.stringify(body, null, 2));

      // Catatan: Callback/Webhook diverifikasi secara kriptografis menggunakan RSA Public Key / HMAC,
      // sehingga tidak diblokir oleh IP Whitelist agar tidak terjadi kegagalan penerimaan notifikasi dari Winpay.

      // 1. SNAP API CALLBACK HANDLER
      if (snapSignature || pathname.includes("/snap") || pathname.includes("/v1.0")) {
        const isVerified = verifySnapCallback({
          httpMethod: method,
          path: pathname,
          body: rawBody,
          timestamp: snapTimestamp,
          signature: snapSignature,
          publicKeyPath: CONFIG.WINPAY_PUBLIC_KEY_PATH,
        });

        if (isVerified) {
          logger.success(`🔐 [SNAP] Signature VALID (Verified by Winpay Public Key) | IP: ${clientIp}`);
        } else {
          logger.warn(`⚠️ [SNAP] Signature INVALID atau Public Key belum disetel | IP: ${clientIp}`);
        }

        // Simpan callback ke db.json
        await saveKey("lastCallbackReceived", {
          type: "SNAP",
          path: pathname,
          timestamp: new Date().toISOString(),
          clientIp: clientIp,
          headers: {
            "x-timestamp": snapTimestamp,
            "x-signature": snapSignature,
            "x-partner-id": snapPartnerId,
            "x-external-id": snapExternalId,
          },
          body: body,
          isSignatureValid: isVerified,
        });

        // Response standar SNAP API
        const responsePayload = {
          responseCode: "2002500",
          responseMessage: "Successful",
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(responsePayload));
      }

      // 2. CHECKOUT PAGE CALLBACK HANDLER
      if (checkoutSignature || pathname.includes("/checkout") || pathname.includes("/invoice")) {
        const isVerified = verifyCheckoutCallback({
          timestamp: checkoutTimestamp,
          signature: checkoutSignature,
          secretKey: CONFIG.CHECKOUT_SECRET_KEY,
        });

        if (isVerified) {
          logger.success(`🔐 [Checkout] Signature VALID (Verified with Secret Key) | IP: ${clientIp}`);
        } else {
          logger.warn(`⚠️ [Checkout] Signature INVALID | IP: ${clientIp}`);
        }

        // Simpan callback ke db.json
        await saveKey("lastCallbackReceived", {
          type: "CHECKOUT",
          path: pathname,
          timestamp: new Date().toISOString(),
          clientIp: clientIp,
          headers: {
            "x-winpay-timestamp": checkoutTimestamp,
            "x-winpay-signature": checkoutSignature,
          },
          body: body,
          isSignatureValid: isVerified,
        });

        const responsePayload = {
          status: "0000",
          message: "Success",
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(responsePayload));
      }

      // 3. GENERIC CALLBACK (Fallback)
      await saveKey("lastCallbackReceived", {
        type: "GENERIC",
        path: pathname,
        timestamp: new Date().toISOString(),
        clientIp: clientIp,
        headers: headers,
        body: body,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "OK", message: "Callback received" }));
    });

    return;
  }

  // Method Not Allowed
  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method Not Allowed" }));
});

server.listen(PORT, () => {
  logger.info(`====================================================`);
  logger.info(`🚀 Winpay Callback Server Receiver Aktif`);
  logger.info(`📌 Port         : ${PORT}`);
  logger.info(`📌 Environment  : ${CONFIG.env}`);
  logger.info(`📌 SNAP URL     : http://localhost:${PORT}/callback/snap`);
  logger.info(`📌 Checkout URL : http://localhost:${PORT}/callback/checkout`);
  logger.info(`====================================================`);
  logger.info(`💡 Tip: Gunakan ngrok / cloudflared untuk publikasi URL:`);
  logger.info(`   ngrok http ${PORT}`);
  logger.info(`====================================================`);
});
