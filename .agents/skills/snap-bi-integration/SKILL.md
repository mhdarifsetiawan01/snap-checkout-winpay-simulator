---
name: snap-bi-integration
description: Standard Operating Procedure (SOP) for Winpay SNAP BI API integration (Virtual Account, QRIS, eWallet, and Inquiry). Use when creating SNAP payload templates, adding payment channels, signing requests with RSA-SHA256, or debugging SNAP responses.
---

# SNAP BI Integration Standard Operating Procedure

This skill governs the integration standards, payload structures, cryptographic signing, and endpoint patterns for **Bank Indonesia SNAP Standard** implementation on the Winpay Payment Gateway.

---

## 1. Core Architecture & File Mapping

When working on SNAP API features in this repository, always adhere to this structure:
- **Payload Templates**: `backend/templates/snap/<actionName>.js`
- **HTTP Client Service**: `backend/services/snap.js`
- **Fastify API Routes**: `backend/api/routes/snap.js`
- **CLI Runner**: `backend/simulator.js`
- **Frontend Form Components**: `frontend/components/snap/`
- **Frontend BFF Routes**: `frontend/app/api/snap/`

---

## 2. Mandatory HTTP Headers for SNAP API

Every SNAP request must include these 6 headers:

| Header | Format / Value | Helper / Source |
|---|---|---|
| `Content-Type` | `application/json` | Static |
| `CHANNEL-ID` | `WEB` or `MOBILE` | Static |
| `X-PARTNER-ID` | Merchant Key / UUID | `CONFIG.SNAP_MERCHANT_KEY` |
| `X-EXTERNAL-ID` | 16-digit numeric string | `backend/helpers/externalId.js` |
| `X-TIMESTAMP` | ISO 8601 with `+07:00` offset (e.g. `YYYY-MM-DDTHH:mm:ss+07:00`) | `backend/helpers/timestamp.js` |
| `X-SIGNATURE` | RSA-SHA256 Base64 of StringToSign | `backend/helpers/signature.js` |

---

## 3. Cryptographic Signing Rule (RSA-SHA256)

### StringToSign Formula
```text
HttpMethod + ":" + EndpointPath + ":" + MinifiedSha256Hex(Body) + ":" + Timestamp
```

Example:
`POST:/v1.0/transfer-va/create-va:d4e3e351d5e8d62056c80192b0de1123db0d3112beccd7d52e1497a8ee357f04:2026-09-06T09:49:18+07:00`

### Rules:
1. **Never alter the minification algorithm** (`helpers/signature.js` uses `JSON.stringify` without whitespace).
2. **Key Resolution**: Private key is loaded from `backend/config/private_key_dev.pem` (dev/sandbox) or `backend/config/private_key_prod.pem` (prod) via `CONFIG.PRIVATE_KEY_PATH`.
3. **Never hardcode key paths** in templates or services.

---

## 4. Payment Channels & Payload Templates

### A. Virtual Account (`/v1.0/transfer-va/create-va`)
- Channel name in `additionalInfo.channel`: `BNC`, `PERMATA`, `BCA`, `BRI`, `BNI`, `MANDIRI`, `CIMB`, `MUAMALAT`, `DANAMON`.
- Amount format: `{ value: "15000.00", currency: "IDR" }` (2 decimal places).
- Trx ID format: Unique `INV-<timestamp>` generated via `helpers/trxId.js`.

### B. QRIS (`/v1.0/qr/qr-mpm-generate`)
- Requires `partnerReferenceNo` and `validityPeriod` (ISO 8601 +07:00).
- `additionalInfo`: `{ isStatic: false }`.

### C. eWallet (`/v1.0/debit/payment-host-to-host`)
- Channels: `SPAY` (ShopeePay), `DANA`, `OVO`, `SC` (Speedcash), `ASTRA` (AstraPay).
- Requires `customerNo` or redirect parameters depending on channel.

---

## 5. Adding a New SNAP Transaction Type

Follow this 5-step checklist:
1. Create payload generator in `backend/templates/snap/<newType>.js`.
2. Add HTTP request method in `backend/services/snap.js`.
3. Register in `backend/simulator.js` (`TEMPLATES.snap` & `SERVICES.snap`).
4. Add endpoint in `backend/api/routes/snap.js` and BFF route in `frontend/app/api/snap/<newType>/route.js`.
5. Add UI form in `frontend/components/snap/` and tab in `frontend/app/snap/page.js`.
