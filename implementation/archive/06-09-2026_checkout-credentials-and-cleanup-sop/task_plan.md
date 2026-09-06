# Implementation Archive: Checkout Page Credentials, Redirect URL Alignment & Server Cleanup SOP

- **Tanggal**: 06-09-2026
- **Topik**: Custom Checkout Page Credentials (Client Key & Secret Key), Direct redirect_url Link Extraction, and Zero Dangling Background Test Server SOP
- **Status**: Selesai (Approved by User)

---

## 📌 Ringkasan Pekerjaan

1. **Custom Checkout Page Credentials (Client Key & Secret Key)**:
   - Backend `backend/api/routes/state.js` mengekspos `secretKey` di endpoint `/api/config`.
   - Backend `backend/api/routes/checkoutpage.js` dan `backend/services/checkoutpage.js` mendukung override dinamis `clientKey` dan `secretKey` via `CHECKOUT_CLIENT_KEY_OVERRIDE` dan `CHECKOUT_SECRET_KEY_OVERRIDE`.
   - Frontend `CredentialInfo.jsx` kini menampilkan `Client Key (X-Winpay-Key)` dan `Secret Key` dengan fitur Show/Hide 👁️, Salin 📋, Edit ✏️, dan Reset ↺.
   - Frontend `useEnv.js` menyediakan hook `useCustomCheckoutCredentials` dengan persistensi `localStorage`.
   - Frontend `CreateInvoiceForm.jsx` otomatis meneruskan custom credentials saat membuat invoice.

2. **Perbaikan `redirect_url` & Bug Fix `saveKey`**:
   - Menyelaraskan pengambilan tautan pembayaran dari `responseData.redirect_url` pada respon Winpay Checkout Page.
   - Menambahkan import `saveKey` di `backend/api/routes/checkoutpage.js`.
   - Tautan `🔗 Buka Link Bayar ↗` pada list transaksi riwayat kini langsung mengarah ke `redirect_url`.

3. **Standard Operating Procedure (SOP) Pembersihan Server**:
   - Menambahkan aturan ketat **Section 7.6 (Mandatory Server Cleanup & Zero Dangling Background Test Server SOP)** pada [`AGENTS.md`](file:///home/bms-del112/BMS/winpay/zzzzz/SIMULASI/snap-checkout-simulator/AGENTS.md).
   - Seluruh server test background wajib dihentikan (`manage_task(Action='kill')`) sebelum mengembalikan respon ke user agar port `3033` dan `3000` bebas untuk terminal user.
