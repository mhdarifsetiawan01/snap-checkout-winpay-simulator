---
name: checkout-page-flow
description: Standard Operating Procedure (SOP) for Winpay Checkout Page (Invoice, Web Redirect, and Payment Status). Use when generating Invoice payloads, calculating HMAC-SHA256 signatures, checking invoice status, or building Checkout UI components.
---

# Winpay Checkout Page Integration SOP

This skill governs the integration standards, signature calculation, and lifecycle management for **Winpay Checkout Page (Invoice)**.

---

## 1. File Structure & Component Mapping

- **Payload Templates**: `backend/templates/checkoutpage/`
  - `createInvoice.js` (Creates payment invoice & returns web redirect URL)
  - `findInvoice.js` (Queries transaction status by `contract_id` / `order_id`)
- **HTTP Client**: `backend/services/checkoutpage.js`
- **Fastify API Routes**: `backend/api/routes/checkoutpage.js`
- **Frontend UI Form**: `frontend/components/checkout/CreateInvoiceForm.jsx`
- **Frontend Status Panel**: `frontend/components/checkout/FindInvoicePanel.jsx`
- **Frontend BFF Routes**: `frontend/app/api/checkout/`

---

## 2. Cryptographic Signing Rule (HMAC-SHA256)

Checkout Page uses HMAC-SHA256 signature with `CHECKOUT_SECRET_KEY`:

### Signature Calculation Pattern
- Helper: `backend/helpers/signature-checkoutpage.js`
- Secret Key source: `CONFIG.CHECKOUT_SECRET_KEY`
- Format: `crypto.createHmac("sha256", secretKey).update(payloadString).digest("hex")`

---

## 3. Storage & State Persistence (`db.json`)

Upon successful `createInvoice`:
1. Save `contract_id` to `lastContractId` in `db.json` via `backend/helpers/storage.js`.
2. Save `url_redirect` to `lastWebRedirectUrl`.
3. Save `order_id` to `lastTrxId`.

Upon executing `findInvoice`:
1. Use `lastContractId` or `lastTrxId` from `db.json` if no specific ID is passed in arguments.
2. Update transaction status in `db.json` based on Winpay's response.

---

## 4. Multi-Environment Endpoints

Resolved via `backend/config/config.js`:
- `development`: `https://checkout.bmstaging.id`
- `sandbox`: `https://sandbox-checkout.winpay.id`
- `production`: `https://checkout.winpay.id`

---

## 5. Adding New Checkout Page Channels or Fields

1. Never remove required fields: `client_key`, `order_id`, `amount`, `customer_name`, `customer_email`, `customer_phone`, `signature`.
2. For custom item breakdown: Ensure sum of `item.price * item.quantity` equals total invoice `amount`.
