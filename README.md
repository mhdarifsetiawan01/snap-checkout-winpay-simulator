# 🚀 Winpay SNAP & Checkout Page API Simulator

Alat simulator berbasis Node.js CLI untuk mendokumentasikan, menguji, dan mensimulasikan integrasi API **SNAP BI (Virtual Account, QRIS, & eWallet)** serta **Checkout Page (Invoice)** pada Payment Gateway Winpay.

---

## 📌 Fitur Utama

- 🔐 **Hitung Otomatis Signature & Header**: Menghasilkan `X-SIGNATURE` (RSA-SHA256), `X-TIMESTAMP`, dan `X-EXTERNAL-ID` secara otomatis sesuai standar SNAP BI & Checkout Page.
- 💾 **Auto-Save ID Transaksi (`db.json`)**: Menyimpan ID transaksi terakhir secara otomatis (seperti `lastContractId`, `lastTrxId`, `lastVirtualAccountNo`, `lastInvoiceId`, `lastWebRedirectUrl`) untuk mempermudah eksekusi request lanjutan (*Inquiry* / *Status*).
- 🛠️ **Bash Helper Script**: Menyediakan shortcut CLI `.sh` yang dapat dipanggil langsung dari mana saja di terminal (`create-va.sh`, `create-qris.sh`, `create-ewallet.sh`, `create-invoice.sh`, `find-invoice.sh`).
- ⚡ **3 Multi-Environment Support**: Mendukung `development`, `sandbox`, dan `production` secara dinamis tanpa mengubah kode.

---

## 🌐 Environment

| Environment | SNAP Base URL | Checkout Page Base URL | Keterangan |
|---|---|---|---|
| `development` | `https://sandbox-api.bmstaging.id/snap` | `https://checkout.bmstaging.id` | Server internal staging |
| `sandbox` | `https://sandbox-snap.winpay.id` | `https://sandbox-checkout.winpay.id` | Official Winpay Sandbox |
| `production` | `https://snap.winpay.id` | `https://checkout.winpay.id` | Official Winpay Production |

> 💡 **Default jika argumen environment tidak diisi: `development`**

---

## 🔒 Daftar File yang Di-Ignore Git (Wajib Disiapkan Manual)

Untuk menjaga keamanan kredensial dan mencegah kebocoran private key ke GitHub, file-file berikut sengaja dimasukkan ke dalam `.gitignore`. **Setelah melakukan `git clone`, Anda wajib menyiapkan file-file berikut secara manual:**

| File / Direktori | Status | Deskripsi & Cara Menyiapkannya |
|---|---|---|
| **`.env`** | *Ignored* | Menyimpan secret key, merchant key, dan client key. Dibuat dengan menyalin `sample.env`. |
| **`config/private_key_dev.pem`** | *Ignored* | RSA Private Key merchant untuk signing request SNAP (Dev & Sandbox). Dihasilkan via OpenSSL. |
| **`config/public_key_dev.pem`** | *Ignored* | RSA Public Key pasangan `private_key_dev.pem`. Disetor ke dashboard Winpay. |
| **`config/private_key_prod.pem`** | *Ignored* | RSA Private Key merchant untuk environment Production (jika menggunakan production). |
| **`config/winpay_public_key_dev.pem`** | *Ignored* | Public Key resmi dari Winpay untuk validasi callback di Sandbox/Dev (opsional). |
| **`config/winpay_public_key_prod.pem`** | *Ignored* | Public Key resmi dari Winpay untuk validasi callback di Production (opsional). |
| **`db.json`** | *Ignored* | Database JSON lokal yang dibuat otomatis saat script pertama kali berhasil mengeksekusi request. |
| **`node_modules/`** | *Ignored* | Folder dependensi library Node.js. Dibuat otomatis saat menjalankan `npm install`. |

---

## 💻 Prasyarat Sistem

* **Node.js**: `>= 18.x`
* **npm**: `>= 9.x`
* **OpenSSL**: untuk generate RSA keypair (bawaan Linux/macOS/Git Bash)

---

## ⚙️ Panduan Setup Langkah Demi Langkah

### 1. Clone Repository & Install Dependensi

```bash
git clone <URL_REPOSITORY_ANDA>
cd snap-checkout-simulator
npm install
```

---

### 2. Setup File Environment (`.env`)

Salin template `sample.env` menjadi file `.env`:

```bash
cp sample.env .env
```

Buka dan isi file `.env` dengan kredensial akun Winpay Anda:

```env
# Mode Debug Console
DEBUG=true
NODE_ENV=development
PORT=3000

# =============================================================
# SNAP API CONFIG
# =============================================================
SNAP_BASE_URL_DEV=https://sandbox-api.bmstaging.id/snap
SNAP_BASE_URL_SANDBOX=https://sandbox-snap.winpay.id
SNAP_BASE_URL_PROD=https://snap.winpay.id

# Merchant Key (X-PARTNER-ID)
SNAP_MERCHANT_KEY_DEV=your-merchant-key-dev-or-sandbox
SNAP_MERCHANT_KEY_PROD=your-merchant-key-prod

# =============================================================
# CHECKOUT PAGE API CONFIG
# =============================================================
CHECKOUT_BASE_URL_DEV=https://checkout.bmstaging.id
CHECKOUT_BASE_URL_SANDBOX=https://sandbox-checkout.winpay.id
CHECKOUT_BASE_URL_PROD=https://checkout.winpay.id

CHECKOUT_CLIENT_KEY_DEV=your-client-key-dev
CHECKOUT_SECRET_KEY_DEV=your-secret-key-dev

CHECKOUT_CLIENT_KEY_SANDBOX=your-client-key-sandbox
CHECKOUT_SECRET_KEY_SANDBOX=your-secret-key-sandbox

CHECKOUT_CLIENT_KEY_PROD=your-client-key-prod
CHECKOUT_SECRET_KEY_PROD=your-secret-key-prod
```

---

### 3. Generate RSA Key Pair untuk SNAP API

SNAP BI mewajibkan setiap request ditandatangani (*sign*) dengan RSA-SHA256 Private Key, dan Winpay akan memverifikasinya menggunakan Public Key Anda yang terdaftar di sistem mereka.

Jalankan perintah OpenSSL berikut dari root project:

```bash
# 1. Generate Private Key DEV/Sandbox
openssl genrsa -out config/private_key_dev.pem 2048

# 2. Derive Public Key dari Private Key
openssl rsa -in config/private_key_dev.pem -pubout -out config/public_key_dev.pem
```

> ⚠️ **Penting**: Salin seluruh isi teks file `config/public_key_dev.pem` lalu simpan/setor ke **Dashboard Winpay (Menu Merchant Info / SNAP Key)**.

Jika Anda ingin menggunakan environment Production:
```bash
openssl genrsa -out config/private_key_prod.pem 2048
openssl rsa -in config/private_key_prod.pem -pubout -out config/public_key_prod.pem
```

---

### 4. Berikan Izin Eksekusi pada Script Bash

Pastikan semua file script `.sh` memiliki izin executable:

```bash
chmod +x *.sh
```

*(Opsional)* Agar perintah `.sh` dapat dipanggil dari folder mana pun di terminal tanpa harus masuk ke folder project ini, buat symlink ke direktori `$PATH` Anda (misal `~/.local/bin` atau `~/scrypt`):

```bash
ln -sf $(pwd)/create-va.sh ~/.local/bin/create-va.sh
ln -sf $(pwd)/create-qris.sh ~/.local/bin/create-qris.sh
ln -sf $(pwd)/create-ewallet.sh ~/.local/bin/create-ewallet.sh
ln -sf $(pwd)/create-invoice.sh ~/.local/bin/create-invoice.sh
ln -sf $(pwd)/find-invoice.sh ~/.local/bin/find-invoice.sh
```

---

## 🚀 Cara Penggunaan

### 1. Menggunakan Script Shell CLI (Rekomendasi)

#### A. Create Virtual Account (SNAP API)
```bash
./create-va.sh [CHANNEL] [AMOUNT] [ENVIRONMENT]
```
* **Contoh Eksekusi:**
  ```bash
  # Default: Channel PERMATA | Rp 15.000 | Development
  ./create-va.sh

  # Channel BRI | Rp 50.000 | Development
  ./create-va.sh BRI 50000

  # Channel BCA | Rp 100.000 | Winpay Sandbox
  ./create-va.sh BCA 100000 sandbox

  # Channel MANDIRI | Rp 75.000 | Production
  ./create-va.sh MANDIRI 75000 prod
  ```

---

#### B. Generate QRIS (SNAP API)
```bash
./create-qris.sh [AMOUNT] [ENVIRONMENT]
```
* **Contoh Eksekusi:**
  ```bash
  # Default: Rp 25.000 | Development
  ./create-qris.sh

  # Rp 50.000 | Development
  ./create-qris.sh 50000

  # Rp 50.000 | Winpay Sandbox
  ./create-qris.sh 50000 sandbox

  # Rp 100.000 | Production
  ./create-qris.sh 100000 prod
  ```

---

#### C. Create eWallet Payment (SNAP API)
```bash
./create-ewallet.sh [CHANNEL] [AMOUNT] [ENVIRONMENT]
```
* **Channel yang Didukung:**
  - `SPAY` : ShopeePay (*default*)
  - `DANA` : DANA
  - `OVO`  : OVO
  - `SC`   : Speedcash
  - `ASTRA`: AstraPay

* **Contoh Eksekusi:**
  ```bash
  # Default: ShopeePay | Rp 10.000 | Development
  ./create-ewallet.sh

  # DANA | Rp 25.000 | Development
  ./create-ewallet.sh DANA 25000

  # OVO | Rp 50.000 | Winpay Sandbox
  ./create-ewallet.sh OVO 50000 sandbox

  # ShopeePay | Rp 10.000 | Production
  ./create-ewallet.sh SPAY 10000 prod
  ```

---

#### D. Create Invoice (Checkout Page)
```bash
./create-invoice.sh [PRICE] [PRODUCT_NAME] [ENVIRONMENT]
```
* **Contoh Eksekusi:**
  ```bash
  # Default: Rp 100.000 | Produk A | Development
  ./create-invoice.sh

  # Rp 150.000 | "Buku Panduan Dev" | Development
  ./create-invoice.sh 150000 "Buku Panduan Dev"

  # Rp 250.000 | "Langganan Premium" | Winpay Sandbox
  ./create-invoice.sh 250000 "Langganan Premium" sandbox

  # Rp 500.000 | "Tiket Event" | Production
  ./create-invoice.sh 500000 "Tiket Event" prod
  ```

#### E. Find / Check Status Invoice (Checkout Page)
Mengecek status invoice terakhir yang tersimpan di `db.json`:
```bash
./find-invoice.sh [ENVIRONMENT]
```
* **Contoh Eksekusi:**
  ```bash
  # Cek invoice terakhir di Development
  ./find-invoice.sh

  # Cek invoice terakhir di Sandbox
  ./find-invoice.sh sandbox

  # Cek invoice terakhir di Production
  ./find-invoice.sh prod
  ```

---

#### F. Menjalankan Callback / Webhook Receiver Server
Untuk menerima dan memvalidasi notifikasi pembayaran callback dari Winpay:
```bash
./start-callback.sh [PORT] [ENVIRONMENT]
```
* **Contoh Eksekusi:**
  ```bash
  # Menjalankan di Port 3000 (Default)
  ./start-callback.sh

  # Menjalankan di Port 8080 pada Winpay Sandbox
  ./start-callback.sh 8080 sandbox
  ```

* **URL Endpoint Callback yang Tersedia:**
  - `POST http://localhost:3000/callback/snap` : Receiver callback SNAP (VA, QRIS, eWallet)
  - `POST http://localhost:3000/callback/checkout` : Receiver callback Checkout Page Invoice
  - `GET http://localhost:3000/health` : Cek status server & callback terakhir

* **Uji Publikasi Webhook (Local to Public via ngrok / cloudflared):**
  ```bash
  # Menggunakan ngrok
  ngrok http 3000
  # Setel URL Callback di dashboard Winpay ke: https://<your-id>.ngrok-free.app/callback/snap
  ```

---

### 2. Menggunakan Node.js Direct Runner (`simulator.js` & `server.js`)

Anda juga dapat menjalankan command simulator atau callback server secara manual menggunakan Node.js CLI:

```bash
# === SNAP API ===
NODE_ENV=development node simulator.js snap createva
NODE_ENV=development node simulator.js snap inquiryva
NODE_ENV=development node simulator.js snap statusva
NODE_ENV=development node simulator.js snap createqris
NODE_ENV=development node simulator.js snap createewallet

# === Checkout Page API ===
NODE_ENV=development node simulator.js checkoutpage createinvoice
NODE_ENV=development node simulator.js checkoutpage findinvoice

# === Menjalankan Callback Receiver Server ===
PORT=3000 NODE_ENV=development node server.js

# Ganti environment dengan NODE_ENV=sandbox atau NODE_ENV=production:
NODE_ENV=sandbox node simulator.js snap createva
NODE_ENV=production node simulator.js snap createva
```

---

## 📂 Struktur Project

```text
snap-checkout-simulator/
├── config/
│   ├── config.js                   # Pemetaan konfigurasi env & path RSA keys
│   ├── validateEnv.js              # Validator env variabel
│   ├── private_key_dev.pem         # [Ignored] RSA Private Key (DEV & Sandbox)
│   ├── public_key_dev.pem          # [Ignored] RSA Public Key DEV (disetor ke Winpay)
│   ├── private_key_prod.pem        # [Ignored] RSA Private Key (Production)
│   ├── winpay_public_key_dev.pem   # [Ignored] Public Key Winpay DEV/Sandbox
│   └── winpay_public_key_prod.pem  # [Ignored] Public Key Winpay Production
├── helpers/
│   ├── callback-verifier.js        # Verifikator X-SIGNATURE callback masuk (RSA/HMAC)
│   ├── externalId.js               # Generator X-EXTERNAL-ID unik
│   ├── logger.js                   # Logger konsol berwarna dengan timestamp
│   ├── signature.js                # Generator X-SIGNATURE SNAP (RSA-SHA256)
│   ├── signature-checkoutpage.js   # Generator Signature Checkout Page (HMAC-SHA256)
│   ├── storage.js                  # Database lokal lowdb (db.json)
│   ├── timestamp.js                # Generator Timestamp ISO 8601 (+07:00)
│   └── trxId.js                    # Generator nomor referensi/transaksi acak
├── services/
│   ├── snap.js                     # HTTP Client API SNAP (VA, QRIS, eWallet)
│   └── checkoutpage.js             # HTTP Client API Checkout Page (Invoice)
├── templates/
│   ├── snap/                       # Template Payload JSON SNAP API
│   │   ├── createVA.js
│   │   ├── createQRIS.js
│   │   ├── createEwallet.js
│   │   ├── inquiryVA.js
│   │   └── paymentStatus.js
│   └── checkoutpage/               # Template Payload JSON Checkout Page
│       ├── createInvoice.js
│       └── findInvoice.js
├── create-va.sh                    # CLI Shortcut: Create VA SNAP
├── create-qris.sh                  # CLI Shortcut: Generate QRIS SNAP
├── create-ewallet.sh               # CLI Shortcut: Create eWallet SNAP
├── create-invoice.sh               # CLI Shortcut: Create Invoice Checkout Page
├── find-invoice.sh                 # CLI Shortcut: Find Invoice Checkout Page
├── start-callback.sh               # CLI Shortcut: Jalankan Callback Server Receiver
├── server.js                       # HTTP Server Webhook Callback Receiver
├── .env                            # [Ignored] Konfigurasi environment lokal
├── sample.env                      # Template referensi file .env
├── db.json                         # [Ignored] Penyimpanan lokal state transaksi terakhir
├── simulator.js                    # Entry point CLI Runner utama
├── package.json                    # Konfigurasi dependensi Node.js
└── README.md                       # Dokumentasi lengkap project
```

---

## 📝 Catatan Teknis & Troubleshooting

### 1. Error `Invalid signature {cannot verify signature}`
Penyebab paling umum:
- RSA Public key (`public_key_dev.pem`) belum disetor ke Dashboard Winpay pada merchant key yang bersangkutan.
- Private key yang dipakai berbeda dengan pasangan public key yang didaftarkan ke Winpay.
- Pastikan saat generate keypair menggunakan format PKCS#8 / standard OpenSSL RSA.

### 2. Error Jaringan `timeout of 10000ms exceeded` di Environment `development`
Environment `development` menggunakan server internal BMS (`sandbox-api.bmstaging.id`).
- Jika Anda terhubung via WiFi tertentu (seperti `it-sbf`), domain tersebut memerlukan entry `/etc/hosts` ke IP staging yang valid.
- **Solusi Alternatif**: Gunakan environment `sandbox` (`sandbox-snap.winpay.id`) yang dapat diakses dari jaringan internet umum tanpa hambatan DNS lokal.