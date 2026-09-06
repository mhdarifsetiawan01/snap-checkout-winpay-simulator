# Architecture — snap-checkout-simulator

Dokumen ini menjelaskan arsitektur teknis lengkap project **snap-checkout-simulator** setelah transformasi menjadi full-stack: CLI + REST API (Fastify) + Web Dashboard (Next.js).

---

## 🗺️ Gambaran Umum Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER / USER                         │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  Terminal    │   │  Bash Script │   │  Web Browser   │  │
│  │  (CLI)       │   │  (*.sh)      │   │  (Next.js)     │  │
│  └──────┬───────┘   └──────┬───────┘   └───────┬────────┘  │
│         │                  │                   │            │
└─────────┼──────────────────┼───────────────────┼────────────┘
          │                  │                   │
          ▼                  ▼                   ▼ HTTP
   simulator.js          simulator.js     Fastify API :3001
   (Node CLI)            (Node CLI)       api/server.js
          │                  │                   │
          └──────────────────┴───────────────────┘
                             │
                    ┌────────▼────────┐
                    │   SERVICES      │
                    │                 │
                    │  services/      │
                    │  ├── snap.js    │
                    │  └── checkoutpage.js │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   HELPERS       │
                    │                 │
                    │  signature.js   │
                    │  timestamp.js   │
                    │  externalId.js  │
                    │  trxId.js       │
                    │  storage.js     │
                    │  logger.js      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   EXTERNAL API  │
                    │                 │
                    │  Winpay SNAP    │
                    │  Winpay Checkout│
                    └─────────────────┘
```

---

## 🔄 Alur Request SNAP API (VA / QRIS / eWallet)

```
User/Frontend
    │
    │  POST /api/snap/va  { channel, amount, env }
    ▼
Fastify Route (api/routes/snap.js)
    │
    │  Override NODE_ENV berdasarkan ?env= query param
    ▼
Template Builder (templates/snap/createVA.js)
    │  → createVABody()  → payload JSON
    ▼
Service Function (services/snap.js → createva())
    │
    ├── generateTimestamp()      → X-TIMESTAMP
    ├── generateSignature()      → X-SIGNATURE (RSA-SHA256)
    ├── generateExternalId()     → X-EXTERNAL-ID
    ▼
axios.post(SNAP_BASE_URL + "/v1.0/transfer-va/create-va", payload, headers)
    │
    ▼
Winpay SNAP Server
    │
    ▼  Response
saveKey("lastContractId", ...)   → db.json
saveKey("lastVirtualAccountNo", ...)
    │
    ▼
JSON Response → Fastify → Frontend / CLI
```

---

## 🔄 Alur Callback / Webhook dari Winpay

```
Winpay Server
    │
    │  POST /api/callback/snap
    │  Headers: X-SIGNATURE, X-TIMESTAMP, X-PARTNER-ID, X-EXTERNAL-ID
    │  Body: { virtualAccountNo, amount, ... }
    ▼
Fastify Route (api/routes/callback.js)
    │
    ├── verifySnapCallback()  → validasi X-SIGNATURE
    │   (menggunakan winpay_public_key_*.pem)
    ├── saveKey("lastCallbackReceived", ...)  → db.json
    ▼
Response: { responseCode: "2002500", responseMessage: "Successful" }
```

---

## 📦 Komponen & Tanggung Jawab

| Komponen | File | Tanggung Jawab |
|---|---|---|
| **CLI Runner** | `simulator.js` | Routing command → service → template |
| **Bash Shortcuts** | `*.sh` | Shortcut CLI dengan argumen default |
| **API Server** | `api/server.js` | Entry point Fastify, daftarkan routes & plugins |
| **SNAP Routes** | `api/routes/snap.js` | HTTP handler operasi SNAP |
| **Checkout Routes** | `api/routes/checkoutpage.js` | HTTP handler operasi Invoice |
| **Callback Routes** | `api/routes/callback.js` | Webhook receiver dari Winpay |
| **State Routes** | `api/routes/state.js` | Baca state db.json |
| **CORS Plugin** | `api/plugins/cors.js` | Izinkan akses dari Next.js frontend |
| **Config** | `config/config.js` | Single source of truth: URL, key, env |
| **Signature SNAP** | `helpers/signature.js` | Generate X-SIGNATURE RSA-SHA256 |
| **Signature Checkout** | `helpers/signature-checkoutpage.js` | Generate signature HMAC-SHA256 |
| **Callback Verifier** | `helpers/callback-verifier.js` | Verifikasi signature callback masuk |
| **Storage** | `helpers/storage.js` | CRUD lowdb → db.json |
| **Logger** | `helpers/logger.js` | Chalk-based colored console logging |
| **Frontend** | `frontend/` | Next.js dashboard web UI |

---

## 🔐 Arsitektur Keamanan

### Signing Request (Outgoing)
```
Private Key (PEM) + Payload + Timestamp + Method + Path
         │
         ▼ RSA-SHA256
    X-SIGNATURE header
```

### Verifikasi Callback (Incoming)
```
X-SIGNATURE (dari header callback Winpay)
         │
         ▼ Verify dengan Winpay Public Key (PEM)
    isValid: true | false
```

### Multi-Environment Key Mapping
| ENV | Private Key | Winpay Public Key |
|---|---|---|
| `development` | `config/private_key_dev.pem` | `config/winpay_public_key_dev.pem` |
| `sandbox` | `config/private_key_dev.pem` | `config/winpay_public_key_dev.pem` |
| `production` | `config/private_key_prod.pem` | `config/winpay_public_key_prod.pem` |

---

## 🌐 Port & Service Map

| Service | Port | Cara Jalankan |
|---|---|---|
| Fastify API | `3001` | `node api/server.js` |
| Next.js Frontend | `3000` | `npm run dev` (di folder `frontend/`) |
| Legacy Callback Server | `3000` | `node server.js` (tidak dihapus) |

> ⚠️ Jika Next.js dan Legacy Callback Server dijalankan bersamaan, akan terjadi port conflict di `3000`. Pilih salah satu, atau ubah port di `.env`.
