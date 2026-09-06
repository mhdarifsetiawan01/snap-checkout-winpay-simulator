# API Reference — snap-checkout-simulator

Dokumentasi lengkap semua endpoint REST API Fastify pada project ini.

**Base URL**: `http://localhost:3001`

**Format**: Semua request dan response menggunakan `Content-Type: application/json`.

**Query Parameter Global**: Semua endpoint menerima `?env=development|sandbox|production` untuk override environment tanpa restart server.

---

## 📌 Health Check

### `GET /api/health`

Cek status server, environment aktif, dan info koneksi.

**Response:**
```json
{
  "status": "ONLINE",
  "environment": "development",
  "port": 3001,
  "timestamp": "2026-09-06T08:00:00.000+07:00",
  "endpoints": {
    "snap": {
      "createVA": "POST /api/snap/va",
      "inquiryVA": "POST /api/snap/inquiry-va",
      "statusVA": "POST /api/snap/status-va",
      "createQRIS": "POST /api/snap/qris",
      "createEwallet": "POST /api/snap/ewallet"
    },
    "checkout": {
      "createInvoice": "POST /api/checkout/invoice",
      "findInvoice": "GET /api/checkout/invoice/last"
    },
    "callback": {
      "snap": "POST /api/callback/snap",
      "checkout": "POST /api/callback/checkout"
    },
    "state": "GET /api/state"
  }
}
```

---

## 🏦 SNAP API — Virtual Account

### `POST /api/snap/va`

Buat transaksi Virtual Account baru.

**Query Params:**
| Param | Nilai | Default |
|---|---|---|
| `env` | `development` \| `sandbox` \| `production` | `development` |

**Request Body:**
```json
{
  "channel": "PERMATA",
  "amount": "15000"
}
```

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `channel` | string | ✅ | Kode bank: `PERMATA`, `BRI`, `BNI`, `BCA`, `MANDIRI`, `INDOMARET`, dll |
| `amount` | string | ✅ | Nominal dalam Rupiah (tanpa desimal) |

**Response (Success):**
```json
{
  "responseCode": "2002700",
  "responseMessage": "Successful",
  "virtualAccountData": {
    "partnerServiceId": "...",
    "customerNo": "...",
    "virtualAccountNo": "8....",
    "virtualAccountName": "...",
    "trxId": "...",
    "additionalInfo": {
      "channel": "PERMATA",
      "contractId": "...",
      "expiredDate": "..."
    }
  }
}
```

---

### `POST /api/snap/inquiry-va`

Inquiry status Virtual Account (menggunakan data terakhir dari `db.json`).

**Request Body:** *(kosong — data diambil otomatis dari db.json)*
```json
{}
```

**Response:** Sama dengan format SNAP Inquiry VA standard.

---

### `POST /api/snap/status-va`

Cek payment status Virtual Account.

**Request Body:** *(kosong — data diambil otomatis dari db.json)*
```json
{}
```

---

### `POST /api/snap/delete-va` / `DELETE /api/snap/va`

Hapus / Batalkan Virtual Account aktif.

**Endpoint Winpay SNAP**: `POST /v1.0/transfer-va/delete-va`

**Request Body:** *(opsional — data default diambil dari db.json jika kosong)*
```json
{
  "virtualAccountNo": "7270049621563864",
  "trxId": "INV-1788677740332",
  "channel": "PERMATA",
  "contractId": "pr7a1e768e-5f3a-4bb9-82af-a5a22188bba1"
}
```

**Response (Success):**
```json
{
  "responseCode": "2003100",
  "responseMessage": "Success",
  "virtualAccountData": {
    "trxId": "INV-1788677740332"
  },
  "additionalInfo": {
    "contractId": "pr7a1e768e-5f3a-4bb9-82af-a5a22188bba1",
    "channel": "PERMATA"
  }
}
```

---

## 📱 SNAP API — QRIS

### `POST /api/snap/qris`

Generate QRIS (QR Code pembayaran).

**Request Body:**
```json
{
  "amount": "25000"
}
```

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `amount` | string | ✅ | Nominal dalam Rupiah |

**Response (Success):**
```json
{
  "responseCode": "2002700",
  "responseMessage": "Successful",
  "qrContent": "00020101...",
  "additionalInfo": { ... }
}
```

---

## 💳 SNAP API — eWallet

### `POST /api/snap/ewallet`

Buat transaksi eWallet (ShopeePay, DANA, OVO, dll).

**Request Body:**
```json
{
  "channel": "SPAY",
  "amount": "10000"
}
```

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `channel` | string | ✅ | `SPAY` (ShopeePay), `DANA`, `OVO`, `SC` (Speedcash), `ASTRA` (AstraPay) |
| `amount` | string | ✅ | Nominal dalam Rupiah |

**Response (Success):**
```json
{
  "responseCode": "2005400",
  "responseMessage": "Successful",
  "partnerReferenceNo": "...",
  "webRedirectUrl": "https://...",
  "appRedirectUrl": "...",
  "additionalInfo": {
    "channel": "SPAY",
    "contractId": "..."
  }
}
```

---

## 🧾 Checkout Page API — Invoice

### `POST /api/checkout/invoice`

Buat invoice baru (Checkout Page).

**Request Body:**
```json
{
  "price": 100000,
  "productName": "Produk A"
}
```

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `price` | number | ✅ | Harga dalam Rupiah |
| `productName` | string | ✅ | Nama produk / deskripsi transaksi |

**Response (Success):**
```json
{
  "responseCode": "200",
  "responseMessage": "Success",
  "responseData": {
    "id": "inv_...",
    "ref": "...",
    "redirectUrl": "https://checkout.winpay.id/...",
    "expiredAt": "..."
  }
}
```

---

### `GET /api/checkout/invoice/last`

Cek status invoice terakhir (data dari `db.json`).

**Response:** Data invoice dari Winpay berdasarkan `lastInvoiceId` yang tersimpan.

---

## 📡 Webhook Receiver (Callback dari Winpay)

### `POST /api/callback/snap` & `POST /api/callback/snap/*` & `POST /v1.0/*`

Endpoint untuk menerima notifikasi pembayaran SNAP dari Winpay (VA, QRIS, eWallet).

> ⚠️ **Endpoint ini dipanggil oleh Winpay**, bukan oleh developer/frontend.
> 💡 **Fleksibilitas URL**: Server mendukung berbagai variasi rute:
> - `POST /api/callback/snap`
> - `POST /api/callback/snap/v1.0/transfer-va/payment` (Otomatis ditambahkan oleh Winpay SNAP VA)
> - `POST /v1.0/transfer-va/payment` (Standar SNAP root)
> - `POST /v1.0/qr/qr-mpm-notify` (QRIS notification)
> - `POST /v1.0/debit/notify` (eWallet notification)

**Headers yang dikirim Winpay:**
| Header | Keterangan |
|---|---|
| `X-TIMESTAMP` | Timestamp ISO 8601 |
| `X-SIGNATURE` | Tanda tangan RSA-SHA256 dari Winpay |
| `X-PARTNER-ID` | Merchant key |
| `X-EXTERNAL-ID` | ID request unik |

**Proses internal:**
1. Ekstraksi pathname secara dinamis (`request.raw.url`)
2. Verifikasi `X-SIGNATURE` dengan `winpay_public_key_*.pem`
3. Simpan data callback ke `db.json` (`lastCallbackReceived`)
4. Return response standar SNAP BI (`2002500` untuk payment / `2002400` untuk inquiry)

**Response:**
```json
{
  "responseCode": "2002500",
  "responseMessage": "Successful",
  "virtualAccountData": {
    "partnerServiceId": "578893",
    "customerNo": "70000072908",
    "virtualAccountNo": "57889370000072908",
    "virtualAccountName": "Gajah Mada",
    "trxId": "INV-1788668790545"
  }
}
```


---

### `POST /api/callback/checkout`

Endpoint untuk menerima notifikasi pembayaran Invoice dari Winpay.

**Headers yang dikirim Winpay:**
| Header | Keterangan |
|---|---|
| `X-Winpay-Timestamp` | Timestamp |
| `X-Winpay-Signature` | HMAC-SHA256 signature |

**Response:**
```json
{
  "status": "0000",
  "message": "Success"
}
```

---

## 📊 State / Storage

### `GET /api/state`

Baca semua data state yang tersimpan di `db.json`.

**Response:**
```json
{
  "lastContractId": "...",
  "lastTrxId": "...",
  "lastVirtualAccountNo": "8...",
  "lastChannel": "PERMATA",
  "lastInvoiceId": "inv_...",
  "lastInvoiceRef": "...",
  "lastWebRedirectUrl": "https://...",
  "lastCallbackReceived": {
    "type": "SNAP",
    "timestamp": "...",
    "isSignatureValid": true,
    "body": { ... }
  }
}
```

---

## ❌ Error Response Format

Semua endpoint mengembalikan error dalam format:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Detail pesan error"
}
```

| HTTP Code | Keterangan |
|---|---|
| `400` | Request body tidak valid |
| `404` | Endpoint tidak ditemukan |
| `500` | Error dari Winpay API atau internal server |
