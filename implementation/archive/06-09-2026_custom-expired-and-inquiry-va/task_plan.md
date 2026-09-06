# Implementation Archive: Custom Expired Time & Inquiry VA Integration

- **Tanggal**: 06-09-2026
- **Topik**: Custom Expired Time across Payment Channels & Inquiry VA Integration
- **Status**: Selesai (Approved by User)

---

## 📌 Ringkasan Pekerjaan

1. **Custom Expired Time (Default 5 Menit)**:
   - Menambahkan input field customizable `expiredMinutes` (default: 5) pada seluruh form pembuatan transaksi di frontend:
     - `CreateVAForm.jsx` (VA SNAP)
     - `CreateQRISForm.jsx` (QRIS SNAP)
     - `CreateEwalletForm.jsx` (eWallet SNAP)
     - `CreateInvoiceForm.jsx` (Checkout Page Invoice)
   - Menyesuaikan handler API backend di `backend/api/routes/snap.js` dan `backend/api/routes/checkoutpage.js` agar menghasilkan timestamp payload ISO dinamis sesuai nilai `expiredMinutes`.

2. **Inquiry VA Integration (Service Code: 30)**:
   - Mengintegrasikan endpoint `POST /v1.0/transfer-va/inquiry-va` sesuai dokumentasi resmi Winpay SNAP BI.
   - Menambahkan tombol aksi `🔍 Inquiry VA` di setiap baris Virtual Account pada tabel `TransactionHistory.jsx`.
   - Menambahkan modal respon Inquiry VA yang menampilkan data transaksi dan string `expiredDate` secara transparan.
   - Menambahkan auto-evaluasi status `EXPIRED` jika waktu saat ini telah melewati nilai timestamp `expiredDate`.

3. **Verifikasi**:
   - `npm run build:frontend` berhasil 100% tanpa error (19/19 static pages).
   - Fastify API dev server & Next.js frontend dev server berjalan normal.
