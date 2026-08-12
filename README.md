# 🚀 Winpay SNAP & Checkout Page API Simulator

Alat simulator berbasis Node.js CLI untuk mendokumentasikan, menguji, dan mendimulasikan integrasi API **SNAP BI (Virtual Account & QRIS)** serta **Checkout Page (Invoice)** pada Payment Gateway Winpay.

---

## 📌 Fitur Utama

- 🔐 **Hitung Otomatis Signature & Header**: Menghasilkan `X-SIGNATURE`, `X-TIMESTAMP`, dan `X-EXTERNAL-ID` secara otomatis sesuai standar SNAP & Checkout Page.
- 💾 **Auto-Save ID Transaksi (`db.json`)**: Menyimpan ID transaksi terakhir secara otomatis (seperti `lastContractId`, `lastTrxId`, `lastVirtualAccountNo`, `lastInvoiceId`) untuk mempermudah eksekusi request lanjutan (*Inquiry* / *Status*).
- 🛠️ **Bash Helper Script**: Menyediakan shortcut `.sh` yang dapat dijalankan langsung dari direktori manapun di terminal (`create-va.sh`, `create-invoice.sh`, `find-invoice.sh`).
- ⚡ **Dynamic Parameter & Timeout Guard**: Memungkinkan kustomisasi channel bank, nominal, dan environment secara dinamis tanpa mengubah kode, dilengkapi batas waktu request (10s timeout).

---

## 💻 Prasyarat Sistem

* **Node.js**: `>= 18.20.3`
* **npm**: `>= 9.0.0`

---

## ⚙️ Cara Instalasi & Konfigurasi

1. **Clone / Buka Direktori Project**:
   ```bash
   cd /path/to/snap-checkout-simulator
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Setup File Environment (`.env`)**:
   Salin file `sample.env` menjadi `.env`:
   ```bash
   cp sample.env .env
   ```

4. **Isi Konfigurasi `.env`**:
   ```env
   DEBUG=true
   NODE_ENV=development

   # SNAP API
   SNAP_BASE_URL_DEV=https://sandbox-snap.winpay.id
   SNAP_MERCHANT_KEY_DEV=your-merchant-key-dev

   SNAP_BASE_URL_PROD=https://snap.winpay.id
   SNAP_MERCHANT_KEY_PROD=your-merchant-key-prod

   # Checkout Page API
   CHECKOUT_BASE_URL_DEV=https://sandbox-checkout.winpay.id
   CHECKOUT_CLIENT_KEY_DEV=your-client-key-dev
   CHECKOUT_SECRET_KEY_DEV=your-secret-key-dev

   CHECKOUT_BASE_URL_PROD=https://checkout.winpay.id
   CHECKOUT_CLIENT_KEY_PROD=your-client-key-prod
   CHECKOUT_SECRET_KEY_PROD=your-secret-key-prod
   ```

---

## 🚀 Cara Penggunaan

### 1. Menggunakan Script Shell Shortcut (Rekomendasi)

Script ini dapat dijalankan langsung dari terminal mana saja.

#### A. Create Virtual Account (SNAP)
```bash
create-va.sh [CHANNEL] [AMOUNT] [ENVIRONMENT]
```
* **Contoh**:
  ```bash
  create-va.sh                          # Default: PERMATA | Rp 15.000 | Development
  create-va.sh BCA 50000                # BCA | Rp 50.000 | Development
  create-va.sh BCA 50000 production     # BCA | Rp 50.000 | Production
  ```

#### B. Create Invoice (Checkout Page)
```bash
create-invoice.sh [PRICE] [PRODUCT_NAME] [ENVIRONMENT]
```
* **Contoh**:
  ```bash
  create-invoice.sh                     # Default: Rp 100.000 | Produk A | Development
  create-invoice.sh 150000 "Buku Dev"   # Rp 150.000 | Buku Dev | Development
  create-invoice.sh 150000 "Buku Dev" production
  ```

#### C. Find / Check Invoice (Checkout Page)
```bash
find-invoice.sh [ENVIRONMENT]
```
* **Contoh**:
  ```bash
  find-invoice.sh                       # Cek invoice terakhir (Development)
  find-invoice.sh production            # Cek invoice terakhir (Production)
  ```

---

### 2. Menggunakan Node.js Direct Runner (`simulator.js`)

Jika Anda ingin menjalankan runner Node.js secara langsung:

#### A. SNAP API (Virtual Account & QRIS)
```bash
# 1. Create Virtual Account
node simulator.js snap createva

# 2. Inquiry Virtual Account (Cek Detail VA)
node simulator.js snap inquiryva

# 3. Check Payment Status VA (Cek Lunas)
node simulator.js snap statusva

# 4. Generate QRIS
node simulator.js snap createqris
```

#### B. Checkout Page API (Invoice)
```bash
# 1. Create Invoice
node simulator.js checkoutpage createinvoice

# 2. Find / Query Invoice Status
node simulator.js checkoutpage findinvoice
```

*Untuk menjalankan di environment production via `simulator.js`, tambahkan `NODE_ENV=production`:*
```bash
NODE_ENV=production node simulator.js snap createva
```

---

## 📂 Struktur Project

```text
snap-checkout-simulator/
├── config/
│   ├── config.js              # Pemetakan konfigurasi env & key
│   ├── private_key_prod.pem   # RSA Private Key (Production)
│   └── temp_key_dev.pem       # RSA Private Key (Development)
├── helpers/
│   ├── externalId.js          # Generator X-EXTERNAL-ID
│   ├── logger.js              # Logger konsol berwarna (Chalk)
│   ├── signature-checkoutpage.js # Signature generator Checkout Page
│   ├── signature.js           # Signature generator SNAP SHA256withRSA
│   ├── storage.js             # Penyimpanan lokal lowdb (db.json)
│   ├── timestamp.js           # ISO 8601 Timestamp Generator
│   └── trxId.js               # Transaction ID & Customer No Generator
├── services/
│   ├── checkoutpage.js        # HTTP client & handler Checkout Page API
│   └── snap.js                # HTTP client & handler SNAP API
├── templates/
│   ├── checkoutpage/          # Body payload template Checkout Page
│   │   ├── createInvoice.js
│   │   └── findInvoice.js
│   └── snap/                  # Body payload template SNAP API
│       ├── createVA.js
│       ├── inquiryVA.js
│       └── paymentStatus.js
├── create-va.sh               # Shortcut script CLI Create VA
├── create-invoice.sh          # Shortcut script CLI Create Invoice
├── find-invoice.sh            # Shortcut script CLI Find Invoice
├── db.json                    # Database lokal penyimpan state transaksi terakhir
├── simulator.js               # Entry point CLI Runner utama
├── sample.env                 # Template file environment
└── README.md                  # Dokumentasi teknis project
```

---

## 📝 Catatan Penting

1. **Aturan Environment Default**:
   - Jika argument `ENVIRONMENT` tidak diberikan pada script shell, maka sistem secara otomatis menggunakan **`development`**.
   - Untuk menguji pada environment production, Anda **wajib** menyertakan argument `production` atau `prod`.

2. **Perilaku Database Local (`db.json`)**:
   - Setiap kali `createva` atau `createinvoice` berhasil dieksekusi, ID transaksi dan nomor VA akan disimpan ke `db.json`.
   - Command `inquiryva`, `statusva`, dan `findinvoice` akan otomatis membaca data dari `db.json` tanpa perlu mengetik ulang ID transaksi.