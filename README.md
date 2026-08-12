# 🚀 Winpay SNAP & Checkout Page API Simulator

Alat simulator berbasis Node.js CLI untuk mendokumentasikan, menguji, dan mensimulasikan integrasi API **SNAP BI (Virtual Account & QRIS)** serta **Checkout Page (Invoice)** pada Payment Gateway Winpay.

---

## 📌 Fitur Utama

- 🔐 **Hitung Otomatis Signature & Header**: Menghasilkan `X-SIGNATURE`, `X-TIMESTAMP`, dan `X-EXTERNAL-ID` secara otomatis sesuai standar SNAP & Checkout Page.
- 💾 **Auto-Save ID Transaksi (`db.json`)**: Menyimpan ID transaksi terakhir secara otomatis (seperti `lastContractId`, `lastTrxId`, `lastVirtualAccountNo`, `lastInvoiceId`) untuk mempermudah eksekusi request lanjutan (*Inquiry* / *Status*).
- 🛠️ **Bash Helper Script**: Menyediakan shortcut `.sh` yang dapat dijalankan langsung dari terminal (`create-va.sh`, `create-invoice.sh`, `find-invoice.sh`).
- ⚡ **3 Environment Support**: Mendukung `development`, `sandbox`, dan `production` secara dinamis tanpa mengubah kode.

---

## 🌐 Environment

| Environment | SNAP URL | Checkout URL | Keterangan |
|---|---|---|---|
| `development` | `sandbox-api.bmstaging.id/snap` | `checkout.bmstaging.id` | Internal BMS staging |
| `sandbox` | `sandbox-snap.winpay.id` | `sandbox-checkout.winpay.id` | Winpay Sandbox |
| `production` | `snap.winpay.id` | `checkout.winpay.id` | Winpay Production |

> **Default jika tidak diisi: `development`**

---

## 💻 Prasyarat Sistem

* **Node.js**: `>= 18.20.3`
* **npm**: `>= 9.0.0`

---

## ⚙️ Cara Instalasi & Konfigurasi

### 1. Install Dependensi

```bash
npm install
```

### 2. Setup File Environment (`.env`)

Salin file `sample.env` menjadi `.env`:
```bash
cp sample.env .env
```

### 3. Isi Konfigurasi `.env`

```env
DEBUG=true
NODE_ENV=development

# SNAP API
SNAP_BASE_URL_DEV=https://sandbox-api.bmstaging.id/snap
SNAP_BASE_URL_SANDBOX=https://sandbox-snap.winpay.id
SNAP_BASE_URL_PROD=https://snap.winpay.id
SNAP_MERCHANT_KEY_DEV=your-merchant-key-dev
SNAP_MERCHANT_KEY_PROD=your-merchant-key-prod

# Checkout Page API
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

### 4. Setup RSA Key Pair

Project ini menggunakan RSA keypair yang **Anda generate sendiri**. Terdapat 3 jenis file key:

| File | Fungsi | Dari mana |
|---|---|---|
| `config/private_key_dev.pem` | Signing request SNAP (DEV & Sandbox) | Generate sendiri |
| `config/private_key_prod.pem` | Signing request SNAP (Production) | Generate sendiri |
| `config/public_key_dev.pem` | Pasangan dari `private_key_dev.pem` | Derive dari private key |
| `config/winpay_public_key_dev.pem` | Verifikasi signature callback masuk (DEV/Sandbox) | Dari Winpay |
| `config/winpay_public_key_prod.pem` | Verifikasi signature callback masuk (Production) | Dari Winpay |

**Generate keypair baru:**
```bash
# Generate private key DEV
openssl genrsa -out config/private_key_dev.pem 1024

# Derive public key dari private key
openssl rsa -in config/private_key_dev.pem -pubout -out config/public_key_dev.pem
```

**Setor `public_key_dev.pem` ke dashboard Winpay** (menu Public Key / Partner Key). Winpay akan menggunakannya untuk memverifikasi setiap request yang Anda kirim.

---

## 🚀 Cara Penggunaan

### 1. Menggunakan Script Shell (Rekomendasi)

#### A. Create Virtual Account (SNAP)
```bash
create-va.sh [CHANNEL] [AMOUNT] [ENVIRONMENT]
```

| Contoh | Keterangan |
|---|---|
| `./create-va.sh` | Default: PERMATA \| Rp 15.000 \| development |
| `./create-va.sh BRI 50000` | BRI \| Rp 50.000 \| development |
| `./create-va.sh BRI 50000 sandbox` | BRI \| Rp 50.000 \| Winpay sandbox |
| `./create-va.sh BRI 50000 prod` | BRI \| Rp 50.000 \| production |

#### B. Create Invoice (Checkout Page)
```bash
create-invoice.sh [PRICE] [PRODUCT_NAME] [ENVIRONMENT]
```

| Contoh | Keterangan |
|---|---|
| `./create-invoice.sh` | Default: Rp 100.000 \| Produk A \| development |
| `./create-invoice.sh 150000 "Buku Dev"` | Rp 150.000 \| development |
| `./create-invoice.sh 150000 "Buku Dev" sandbox` | Rp 150.000 \| Winpay sandbox |
| `./create-invoice.sh 150000 "Buku Dev" prod` | Rp 150.000 \| production |

#### C. Find / Check Invoice (Checkout Page)
```bash
find-invoice.sh [ENVIRONMENT]
```

| Contoh | Keterangan |
|---|---|
| `./find-invoice.sh` | Cek invoice terakhir (development) |
| `./find-invoice.sh sandbox` | Cek invoice terakhir (Winpay sandbox) |
| `./find-invoice.sh prod` | Cek invoice terakhir (production) |

---

### 2. Menggunakan Node.js Direct Runner (`simulator.js`)

```bash
# SNAP API
NODE_ENV=development node simulator.js snap createva
NODE_ENV=development node simulator.js snap inquiryva
NODE_ENV=development node simulator.js snap statusva
NODE_ENV=development node simulator.js snap createqris

# Checkout Page API
NODE_ENV=development node simulator.js checkoutpage createinvoice
NODE_ENV=development node simulator.js checkoutpage findinvoice

# Ganti NODE_ENV untuk environment lain:
NODE_ENV=sandbox     node simulator.js snap createva
NODE_ENV=production  node simulator.js snap createva
```

---

## 📂 Struktur Project

```text
snap-checkout-simulator/
├── config/
│   ├── config.js                   # Pemetaan konfigurasi env & key (dev/sandbox/prod)
│   ├── private_key_dev.pem         # RSA Private Key (DEV & Sandbox)
│   ├── private_key_prod.pem        # RSA Private Key (Production)
│   ├── public_key_dev.pem          # RSA Public Key DEV (disetor ke Winpay)
│   ├── winpay_public_key_dev.pem   # Public Key dari Winpay (verifikasi callback DEV)
│   └── winpay_public_key_prod.pem  # Public Key dari Winpay (verifikasi callback PROD)
├── helpers/
│   ├── externalId.js               # Generator X-EXTERNAL-ID
│   ├── logger.js                   # Logger konsol berwarna
│   ├── signature-checkoutpage.js   # Signature generator Checkout Page
│   ├── signature.js                # Signature generator SNAP (RSA-SHA256)
│   ├── storage.js                  # Penyimpanan lokal lowdb (db.json)
│   ├── timestamp.js                # ISO 8601 Timestamp Generator (+07:00)
│   └── trxId.js                    # Transaction ID & Customer No Generator
├── services/
│   ├── checkoutpage.js             # HTTP client & handler Checkout Page API
│   └── snap.js                     # HTTP client & handler SNAP API
├── templates/
│   ├── checkoutpage/               # Body payload template Checkout Page
│   │   ├── createInvoice.js
│   │   └── findInvoice.js
│   └── snap/                       # Body payload template SNAP API
│       ├── createVA.js
│       ├── inquiryVA.js
│       └── paymentStatus.js
├── create-va.sh                    # Shortcut CLI: Create VA
├── create-invoice.sh               # Shortcut CLI: Create Invoice
├── find-invoice.sh                 # Shortcut CLI: Find Invoice
├── db.json                         # State lokal: ID transaksi terakhir
├── simulator.js                    # Entry point CLI Runner utama
├── sample.env                      # Template file environment
└── README.md                       # Dokumentasi teknis project
```

---

## 📝 Catatan Penting

### 1. Aturan Environment

- Default jika tidak diisi argumen: **`development`**
- `sandbox` dan `production` **wajib ditulis eksplisit** saat menjalankan script

### 2. Alur Signature SNAP

```
Merchant generate RSA Keypair
    ↓
private_key_*.pem  →  dipakai kode untuk signing setiap request
public_key_dev.pem →  disetor ke dashboard Winpay
    ↓
Winpay verifikasi signature request menggunakan public key yang terdaftar
```

> ⚠️ Jika Anda regenerate keypair, **wajib update public key di dashboard Winpay** juga. Ketidakcocokan keypair adalah penyebab utama error `Invalid signature {cannot verify signature}`.

### 3. Verifikasi Callback dari Winpay

Winpay mengirim signature di setiap notifikasi callback. Untuk memverifikasi bahwa callback benar-benar dari Winpay:
- Gunakan `winpay_public_key_dev.pem` (DEV/Sandbox)
- Gunakan `winpay_public_key_prod.pem` (Production)

File ini didapat dari tim Winpay atau dashboard Winpay.

### 4. Perilaku Database Lokal (`db.json`)

- Setiap `createva` atau `createinvoice` sukses → ID transaksi & nomor VA tersimpan otomatis ke `db.json`
- Command `inquiryva`, `statusva`, dan `findinvoice` otomatis membaca dari `db.json` tanpa perlu mengetik ulang ID