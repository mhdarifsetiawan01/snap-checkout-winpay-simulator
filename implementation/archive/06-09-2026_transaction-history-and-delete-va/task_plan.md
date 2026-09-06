# Implementation Plan — Simulated Multi-Channel Transaction DB (JSON LowDB)

## 🎯 1. Overview & Goal
Simulasikan database transaksional menggunakan JSON (`backend/db.json` via `lowdb@^1`) yang menampung riwayat transaksi (maksimal 10 transaksi terakhir per kategori/channel) dengan siklus status lengkap:
1. **Saat Create**: Disimpan dengan status `PENDING` (Berhasil dibuat / Belum terbayar) atau `FAILED` (Gagal create dengan pesan error).
2. **Saat Callback Masuk**: Otomatis mencari data transaksi terkait (berdasarkan `trxId`, `virtualAccountNo`, `partnerReferenceNo`, atau `invoiceId`) dan memperbarui status menjadi `PAID` / `SUCCESS`.
3. **Tombol "Cek Status"**: Menambahkan tombol di baris riwayat frontend untuk melakukan inquiry real-time ke Winpay API dan memperbarui status transaksi di JSON.
4. **Tampilan Frontend**: Menampilkan daftar tabel/tab riwayat transaksi 10 terakhir untuk masing-masing kategori (**VA**, **QRIS**, **eWallet**, **Checkout Invoice**).

---

## 🏗️ 2. Proposed Architecture & Schema

### 2.1 Skema Data Transaksi di `backend/db.json`
```json
{
  "transactions": {
    "va": [
      {
        "id": "trx-uuid-1",
        "trxId": "VA-1788673129703",
        "partnerReferenceNo": "VA-1788673129703",
        "type": "VA",
        "channel": "BCA",
        "amount": 15000,
        "virtualAccountNo": "7270049658206724",
        "status": "PENDING",
        "errorMessage": null,
        "env": "development",
        "createdAt": "2026-09-06T13:40:00.000Z",
        "updatedAt": "2026-09-06T13:40:00.000Z",
        "rawResponse": { ... },
        "callbackData": null
      }
    ],
    "qris": [ ... ],
    "ewallet": [ ... ],
    "checkout": [ ... ]
  },
  "lastCallbackReceived": { ... }
}
```

### 2.2 Aturan Penyimpanan (Max 10 per Channel)
- Saat ada transaksi baru masuk di kategori tertentu, masukkan ke urutan teratas (unshift).
- Jika jumlah transaksi di kategori tersebut melebihi 10, pangkas elemen terlama (`slice(0, 10)`).

---

## 📋 3. Rincian Perubahan File

### Backend Layer
1. **`backend/helpers/storage.js`**:
   - Menambahkan fungsi helper terstruktur:
     - `recordTransaction(category, data)` (unshift & trim to 10).
     - `updateTransactionStatus(matchQuery, newStatus, extraData)`.
     - `getTransactions(category, limit)`.
2. **`backend/api/routes/snap.js`**:
   - Di endpoint `create-va`, `qris`, `ewallet`:
     - Jika request API sukses ➔ `recordTransaction('va', { status: 'PENDING', ... })`.
     - Jika request API gagal/error ➔ `recordTransaction('va', { status: 'FAILED', errorMessage: err.message, ... })`.
3. **`backend/api/routes/checkoutpage.js`**:
   - Di endpoint `createInvoice`:
     - Rekam transaksi invoice baru ke kategori `checkout`.
4. **`backend/api/routes/callback.js`**:
   - Saat callback webhook diterima:
     - Cocokkan transaksi di database JSON dan update statusnya menjadi `PAID` / `SUCCESS` beserta timestamp bayar.
5. **`backend/api/routes/state.js`**:
   - Tambahkan endpoint `GET /api/transactions` (dengan query `?category=va|qris|ewallet|checkout`) untuk diambil oleh frontend.
   - Tambahkan endpoint `POST /api/transactions/check-status` untuk trigger manual inquiry status transaksi tertentu.

### Frontend Layer
1. **`frontend/app/api/transactions/route.js` & `frontend/app/api/transactions/check-status/route.js`**:
   - BFF Proxy untuk mengambil data riwayat transaksi dan trigger cek status.
2. **`frontend/components/shared/TransactionHistory.jsx` (Komponen Baru)**:
   - Menampilkan tabel/kartu 10 transaksi terakhir dengan tab: `Virtual Account`, `QRIS`, `eWallet`, `Checkout Invoice`.
   - Badge status warna:
     - 🟡 `PENDING` (Belum Terbayar)
     - 🟢 `PAID / SUCCESS` (Sudah Terbayar)
     - 🔴 `FAILED` (Gagal Dibuat / Error)
   - Tombol **"↻ Cek Status"** di setiap baris transaksi yang masih pending.
   - Tombol **"Lihat Detail"** (modal/popover payload JSON).
3. **Integrasi ke Halaman Dashboard & Page Khusus**:
   - Pasang `TransactionHistory` di:
     - `frontend/app/page.js` (Overview semua channel di Dashboard utama).
     - `frontend/app/snap/page.js` (Tab SNAP VA, QRIS, eWallet).
     - `frontend/app/checkout/page.js` (Tab Invoice).

---

## 🧪 4. Verification & Testing Plan
1. **Test Create Success**: Buat VA baru ➔ pastikan masuk ke list dengan status `PENDING`. [PASSED]
2. **Test Create Failed**: Buat transaksi dengan parameter invalid ➔ pastikan masuk ke list dengan status `FAILED` beserta detail pesan kegagalannya. [PASSED]
3. **Test Auto-Update by Callback**: Kirim webhook callback untuk VA tersebut ➔ pastikan status di list otomatis berubah jadi `PAID / SUCCESS`. [PASSED]
4. **Test Manual "Cek Status" Button**: Klik tombol "Cek Status" pada baris transaksi ➔ memanggil inquiry status dan memperbarui status secara live di UI. [PASSED]
5. **Test Limit 10 Records**: Buat > 10 transaksi ➔ pastikan hanya 10 transaksi terbaru yang dipertahankan. [PASSED]

---

## 📊 5. Implementation Status
- [x] Backend Storage Helper (`backend/helpers/storage.js`)
- [x] SNAP Route Transaction Tracking (`backend/api/routes/snap.js`)
- [x] Checkout Route Transaction Tracking (`backend/api/routes/checkoutpage.js`)
- [x] Webhook Callback Auto-update Matcher (`backend/api/routes/callback.js`)
- [x] State Transaction Endpoints (`backend/api/routes/state.js`)
- [x] Frontend BFF Handlers (`frontend/app/api/transactions/*`)
- [x] Reusable Frontend History Component (`frontend/components/shared/TransactionHistory.jsx`)
- [x] Integrated in Dashboard, SNAP, and Checkout Pages (`frontend/app/page.js`, `frontend/app/snap/page.js`, `frontend/app/checkout/page.js`)
- [x] End-to-End Verification & Next.js Build Check (0 errors, 18/18 static routes compiled)

