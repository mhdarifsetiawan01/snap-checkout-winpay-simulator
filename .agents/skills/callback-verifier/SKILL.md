---
name: callback-verifier
description: Standard Operating Procedure (SOP) for handling incoming Winpay Webhook Callbacks (SNAP BI & Checkout Page). Use when implementing callback routes, verifying RSA/HMAC webhook signatures, and parsing payment notifications.
---

# Webhook Callback Receiver & Verifier SOP

This skill defines the security verification, acknowledgment contract, and state management for **Winpay Webhooks**.

---

## 1. Webhook Endpoints & Handlers

In Fastify API server (`backend/api/server.js`):
- `POST /api/callback/snap`: Receives SNAP BI payment notifications (VA, QRIS, eWallet).
- `POST /api/callback/checkout`: Receives Checkout Page payment status updates.

Standalone legacy server (`backend/server.js`):
- Runs bare Node.js HTTP server on configured port (e.g., `PORT=3000 node server.js`).

---

## 2. Signature Verification Protocols

### A. SNAP BI Callback Verification (`RSA-SHA256`)
- Helper: `backend/helpers/callback-verifier.js` -> `verifySnapCallback(req)`
- Uses **Winpay Public Key**: `backend/config/winpay_public_key_dev.pem` or `winpay_public_key_prod.pem`.
- Reconstructs StringToSign using callback HTTP method, path, minified body, and `X-TIMESTAMP`.
- Verifies against incoming `X-SIGNATURE` header.

### B. Checkout Page Callback Verification (`HMAC-SHA256`)
- Helper: `backend/helpers/callback-verifier.js` -> `verifyCheckoutCallback(req)`
- Uses `CONFIG.CHECKOUT_SECRET_KEY`.
- Compares calculated HMAC with incoming `signature` parameter in callback payload.

---

## 3. Required ACK Response Format

Winpay payment gateway requires immediate JSON acknowledgment:

### SNAP BI Callback ACK:
```json
{
  "responseCode": "2002500",
  "responseMessage": "Successful"
}
```

### Checkout Page Callback ACK:
```json
{
  "status": "success",
  "message": "Payment processed successfully"
}
```

---

## 4. State Update Lifecycle
Upon receiving a verified callback:
1. Extract `partnerReferenceNo` / `order_id`, `amount`, and `paidStatus`.
2. Save latest callback payload to `db.json` (`lastCallback`) via `backend/helpers/storage.js`.
3. Log structured transaction result using `backend/helpers/logger.js`.
