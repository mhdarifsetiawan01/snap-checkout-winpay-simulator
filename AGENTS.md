# AGENTS.md — Winpay SNAP & Checkout Page API Simulator

Dokumen ini mendefinisikan konteks arsitektur, konvensi kode, aturan keamanan, dan panduan kerja bagi AI coding agent yang bekerja di repository **snap-checkout-simulator**.

---

## 🗺️ 1. Ringkasan Project

| Atribut | Nilai |
|---|---|
| **Nama** | `snap-simulasi` |
| **Tujuan** | Simulator CLI, Fastify REST API, dan Next.js Webhook Receiver UI untuk menguji integrasi API **SNAP BI** (VA, QRIS, eWallet) dan **Checkout Page** (Invoice) milik Winpay Payment Gateway |
| **Runtime** | Node.js ≥ 18.x |
| **Dependensi Utama** | `fastify`, `@fastify/cors`, `next`, `react`, `react-dom`, `axios`, `chalk@^4`, `dotenv`, `lowdb@^1` |
| **Entry Point CLI** | `simulator.js` |
| **Entry Point API** | `api/server.js` (Port: 3001) |
| **Entry Point UI** | `frontend/` (Next.js App Router, Port: 3000) |
| **State Lokal** | `db.json` (via `lowdb@^1`, **diabaikan git**) |

---

## 🏗️ 2. Arsitektur & Peta File

```
snap-checkout-simulator/
├── backend/                    # Seluruh engine backend, API Fastify & CLI Simulator
│   ├── api/                    # Fastify REST API Server
│   │   ├── plugins/cors.js     # Plugin CORS untuk API
│   │   ├── routes/             # Routes: snap.js, checkoutpage.js, callback.js, state.js
│   │   └── server.js           # Entry point Fastify API Server (Port: 3001)
│   ├── config/
│   │   ├── config.js           # Sumber konfigurasi: env, URL, path key RSA
│   │   └── validateEnv.js      # Validasi env var wajib saat startup
│   ├── helpers/                # signature, callback-verifier, timestamp, storage, logger
│   ├── services/               # HTTP Clients (snap.js, checkoutpage.js)
│   ├── templates/              # Payload body templates (snap/, checkoutpage/)
│   ├── simulator.js            # CLI Runner utama
│   ├── server.js               # Webhook Callback Receiver standalone
│   ├── Dockerfile              # Container image untuk deploy Fly.io
│   ├── .env                    # [IGNORED] Kredensial lokal
│   ├── sample.env              # Template referensi .env
│   ├── db.json                 # [IGNORED] State transaksi terakhir (lowdb)
│   └── package.json            # Dependensi Backend (fastify, axios, chalk, lowdb, dotenv)
├── frontend/                   # Next.js 15+ App Router Web Dashboard (Port: 3000)
│   ├── app/
│   │   ├── api/                # Route handlers (BFF Proxy ke Fastify API)
│   │   ├── snap/page.js        # SNAP Simulator UI (VA, QRIS, eWallet, Inquiry)
│   │   ├── checkout/page.js    # Checkout Page Simulator UI (Create & Find Invoice)
│   │   ├── layout.js & globals.css # Root layout & Design System (Glassmorphism Dark)
│   │   └── page.js             # Dashboard overview & state inspector
│   ├── components/             # Reusable UI components (Sidebar, Forms, Viewers)
│   ├── .env.local              # Konfigurasi frontend (API_URL=http://localhost:3001)
│   └── package.json            # Dependensi Next.js & React
├── scripts/                    # Shortcut Bash CLI (*.sh)
│   ├── create-va.sh            # Shortcut: Create VA SNAP
│   ├── create-qris.sh          # Shortcut: Generate QRIS SNAP
│   ├── create-ewallet.sh       # Shortcut: Create eWallet SNAP
│   ├── create-invoice.sh       # Shortcut: Create Invoice Checkout Page
│   ├── find-invoice.sh         # Shortcut: Find Invoice Checkout Page
│   └── start-callback.sh       # Shortcut: Jalankan Webhook Callback Receiver
├── docs/                       # Dokumentasi arsitektur & panduan sistem
│   ├── architecture.md         # Diagram & rancangan arsitektur lengkap
│   ├── api-reference.md        # Spesifikasi detail REST API & Webhook
│   ├── roadmap.md              # Rencana pengembangan jangka pendek & panjang
│   └── backlog.md              # Task backlog & milestone pelacakan
├── implementation/             # Siklus implementasi protokol terstruktur
│   ├── active/                 # Task plan aktif yang sedang dikerjakan
│   └── archive/                # Arsip plan selesai per tanggal & topik (DD-MM-YYYY_topic)
├── fly.toml                    # Konfigurasi deployment Fly.io
├── vercel.json                 # Konfigurasi deployment Frontend Vercel
├── package.json                # Monorepo workspace runner (npm run api, npm run dev:all, dll)
└── README.md
```

---

## ⚙️ 3. Environment & Konfigurasi

### 3.1 Tiga Mode Environment

| `NODE_ENV` / Argumen | SNAP Base URL | Checkout Page Base URL |
|---|---|---|
| `development` (default) | `SNAP_BASE_URL_DEV` | `CHECKOUT_BASE_URL_DEV` |
| `sandbox` | `SNAP_BASE_URL_SANDBOX` | `CHECKOUT_BASE_URL_SANDBOX` |
| `production` / `prod` | `SNAP_BASE_URL_PROD` | `CHECKOUT_BASE_URL_PROD` |

**Semua URL & credential di-resolve oleh `config/config.js`.** Jangan pernah hard-code URL atau key di service/template manapun.

### 3.2 File yang WAJIB Tidak Di-commit (`.gitignore`)

| File | Keterangan |
|---|---|
| `.env` | Secret key, merchant key, client key |
| `config/private_key_dev.pem` | RSA Private Key DEV/Sandbox |
| `config/public_key_dev.pem` | RSA Public Key DEV |
| `config/private_key_prod.pem` | RSA Private Key Production |
| `config/winpay_public_key_dev.pem` | Winpay Public Key untuk verifikasi callback |
| `config/winpay_public_key_prod.pem` | Winpay Public Key Production |
| `db.json` | State lokal |
| `node_modules/` | Dependensi npm |

> [!CAUTION]
> **JANGAN PERNAH** commit file `.pem`, `.env`, atau `db.json` ke repository. Ini risiko kebocoran kredensial production.

---

## 🔐 4. Konvensi Kriptografi & Keamanan

### 4.1 SNAP API (RSA-SHA256)
- **Signing request**: `helpers/signature.js` → membaca `config/private_key_*.pem`, menghasilkan `X-SIGNATURE`.
- **Verifikasi callback masuk**: `helpers/callback-verifier.js` → `verifySnapCallback()` menggunakan `config/winpay_public_key_*.pem`.
- Key path di-resolve dari `config/config.js` berdasarkan `NODE_ENV`. **Jangan hardcode path `.pem`.**

### 4.2 Checkout Page (HMAC-SHA256)
- **Signing request**: `helpers/signature-checkoutpage.js` → menggunakan `CHECKOUT_SECRET_KEY` dari config.
- **Verifikasi callback masuk**: `helpers/callback-verifier.js` → `verifyCheckoutCallback()`.

### 4.3 Header Standar SNAP yang Wajib Ada
| Header | Generator |
|---|---|
| `X-TIMESTAMP` | `helpers/timestamp.js` |
| `X-EXTERNAL-ID` | `helpers/externalId.js` |
| `X-SIGNATURE` | `helpers/signature.js` |
| `X-PARTNER-ID` | `config.SNAP_MERCHANT_KEY` |

---

## 🧩 5. Konvensi Kode

### 5.1 Menambah Command/Tipe Baru di Simulator

Ikuti pola berikut **secara ketat**:

1. **Buat template baru** di `templates/<service>/<commandName>.js`:
   ```js
   // templates/snap/createFoo.js
   function createFooBody() {
     // Gunakan helpers: trxId, externalId, timestamp
     return { /* payload */ };
   }
   module.exports = { createFooBody };
   ```

2. **Tambah handler di service** (`services/snap.js` atau `services/checkoutpage.js`):
   ```js
   async function createfoo(payload, simulate = false) {
     // Gunakan config untuk URL & key
     // Gunakan helpers/signature.js untuk signing
     // Gunakan logger.js untuk logging
   }
   module.exports = { ..., createfoo };
   ```

3. **Register di `simulator.js`**:
   ```js
   // TEMPLATES
   snap: { ..., createfoo: require("./templates/snap/createFoo").createFooBody }
   // SERVICES → otomatis terpanggil jika nama fungsi service sesuai dengan key TEMPLATES
   ```

4. **Buat bash shortcut** di root: `create-foo.sh` dengan pola yang sama seperti `create-va.sh`.

### 5.2 Pola Penyimpanan State (`db.json`)

Selalu gunakan `helpers/storage.js`:
```js
const { saveKey, getKey } = require("./helpers/storage");
await saveKey("lastContractId", value);  // tulis
const id = getKey("lastContractId");     // baca
```

**Jangan akses `db.json` secara langsung (fs/read/write raw).**

### 5.3 Logging

Selalu gunakan `helpers/logger.js`:
```js
const logger = require("./helpers/logger");
logger.info("pesan");
logger.success("berhasil");
logger.warn("peringatan");
logger.error("error");
logger.debug("data debug");  // hanya tampil saat DEBUG=true
```

**Jangan gunakan `console.log` langsung** kecuali di entry point (`simulator.js` baris final response).

### 5.4 Konfigurasi

Selalu import dari `config/config.js`:
```js
const CONFIG = require("./config/config");
// Gunakan: CONFIG.SNAP_BASE_URL, CONFIG.SNAP_MERCHANT_KEY, CONFIG.env, dll.
```

---

## 🚀 6. Cara Menjalankan (Quick Reference)

### CLI Simulator
```bash
# Via bash shortcut (rekomendasi)
./create-va.sh [CHANNEL] [AMOUNT] [ENV]
./create-qris.sh [AMOUNT] [ENV]
./create-ewallet.sh [CHANNEL] [AMOUNT] [ENV]
./create-invoice.sh [PRICE] [PRODUCT_NAME] [ENV]
./find-invoice.sh [ENV]

# Via Node.js langsung
NODE_ENV=development node simulator.js snap createva
NODE_ENV=sandbox      node simulator.js snap createqris
NODE_ENV=production   node simulator.js checkoutpage createinvoice
```

### Callback Receiver Server
```bash
./start-callback.sh [PORT] [ENV]
# atau
PORT=3000 NODE_ENV=development node server.js
```

### Endpoint Server
| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/` atau `/health` | Status server & last callback |
| `POST` | `/callback/snap` | Terima notifikasi SNAP (VA/QRIS/eWallet) |
| `POST` | `/callback/checkout` | Terima notifikasi Checkout Page (Invoice) |

---

## 🛡️ 7. Aturan Keamanan untuk AI Agent

### 7.1 File yang TIDAK BOLEH Dimodifikasi Tanpa Izin Eksplisit
- `config/private_key_*.pem` — private key kriptografi
- `config/winpay_public_key_*.pem` — public key verifikasi dari Winpay
- `.env` — kredensial aktif

### 7.2 Perubahan di `config/config.js` Harus Hati-Hati
File ini adalah **single source of truth** untuk seluruh konfigurasi. Perubahan di sini berdampak ke seluruh services, helpers, dan server. Selalu verifikasi dampak ke semua consumer sebelum mengubah struktur object `CONFIG`.

### 7.3 Jangan Ubah Format Payload Tanpa Referensi Dokumentasi Winpay
Payload API SNAP dan Checkout Page mengikuti **standar resmi SNAP BI dan Winpay**. Jangan spekulatif mengubah field payload (nama field, format nilai, tipe data) tanpa merujuk ke dokumentasi resmi atau konfirmasi user.

### 7.4 Jangan Ganti Library `lowdb` ke Versi Lebih Tinggi Secara Sembarangan
Project ini menggunakan `lowdb@^1` (CommonJS). `lowdb@^2+` tidak kompatibel (ESM only). Upgrade versi harus disertai refactor `storage.js` dan disetujui user.

### 7.5 Jangan Ganti `chalk@^4` ke Versi Lebih Tinggi Tanpa Izin
`chalk@^5+` adalah ESM only. Project ini menggunakan CommonJS (`require`). Pertahankan `chalk@^4`.

---

## 🔄 8. Alur Kerja Implementasi (SOP untuk Agent)

Ketika menerima instruksi pengembangan fitur baru di project ini, ikuti urutan berikut:

```
[1. PAHAMI] → Baca README.md & AGENTS.md ini terlebih dahulu
     ↓
[2. TEMPLATE] → Buat file payload di templates/<service>/
     ↓
[3. SERVICE] → Tambah fungsi HTTP client di services/<service>.js
     ↓
[4. REGISTER] → Daftarkan di simulator.js (TEMPLATES + SERVICES)
     ↓
[5. BASH] → Buat atau update .sh shortcut jika diperlukan
     ↓
[6. TEST] → Jalankan NODE_ENV=development node simulator.js <service> <type>
     ↓
[7. VERIFIKASI] → Periksa output response & state db.json
```

---

## 📝 9. Troubleshooting Umum

| Error | Penyebab | Solusi |
|---|---|---|
| `Invalid signature {cannot verify signature}` | Public key belum disetor ke Winpay Dashboard, atau keypair tidak matching | Setor `public_key_dev.pem` ke Dashboard Winpay → Menu Merchant Info / SNAP Key |
| `timeout of 10000ms exceeded` di `development` | DNS `sandbox-api.bmstaging.id` tidak resolve dari jaringan saat ini | Gunakan `ENV=sandbox` atau tambah entry `/etc/hosts` |
| `Cannot find module 'lowdb'` | `node_modules` belum terinstall | Jalankan `npm install` |
| `db.json` kosong / key `null` | Belum pernah ada request sukses tersimpan | Jalankan request pertama, pastikan response sukses |
| `Permission denied: ./create-va.sh` | File `.sh` belum executable | Jalankan `chmod +x *.sh` |

---

## 🔗 10. Referensi Eksternal

- [Winpay SNAP API Documentation](https://sandbox-snap.winpay.id)
- [Winpay Checkout Page API](https://sandbox-checkout.winpay.id)
- [BI SNAP Standard](https://www.bi.go.id/id/sistem-pembayaran/ritel/snap/)
- [lowdb v1 Docs](https://github.com/typicode/lowdb/tree/v1)
- [axios Docs](https://axios-http.com/docs/intro)
