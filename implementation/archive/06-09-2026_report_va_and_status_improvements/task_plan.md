# Implementation Plan — Menu Baru: Transaction List VA (SNAP Report API)

## 🎯 Objective
Menambahkan fitur dan menu baru di Frontend & Backend untuk **Transaction List VA** menggunakan endpoint resmi SNAP BI Report: `POST /v1.0/transaction-history-list` (Service Code: 12) sesuai dokumentasi [Winpay SNAP Report Transaction](https://docs.winpay.id/payments/snap-api/report#transaction-list).

---

## 📋 Completed Tasks

### 1. Backend Engine
- ✅ **Template Payload (`backend/templates/snap/transactionList.js`)**:
  - Dibuat fungsi `transactionListBody({ fromDateTime, toDateTime, pageSize, pageNumber, partnerReferenceNo })` dengan format ISO datetime +07:00.
- ✅ **Service Client (`backend/services/snap.js`)**:
  - Ditambahkan fungsi `transactionlist(payload, simulate = false)` yang memanggil endpoint `POST /v1.0/transaction-history-list` dengan signature RSA-SHA256.
- ✅ **REST Route (`backend/api/routes/snap.js`)**:
  - Ditambahkan endpoint `POST /api/snap/report/transaction-list` dengan dukungan `env` dan custom partner ID override.

### 2. Frontend Integration & UI
- ✅ **Next.js API Proxy (`frontend/app/api/snap/report/transaction-list/route.js`)**:
  - Proxy handler request dari Next.js ke backend Fastify `/api/snap/report/transaction-list`.
- ✅ **Sidebar Navigation (`frontend/components/layout/Sidebar.jsx`)**:
  - Ditambahkan item menu baru: `{ href: '/report-va', icon: '📊', label: 'Report VA' }`.
- ✅ **Halaman Report VA (`frontend/app/report-va/page.js`)**:
  - Form filter tanggal (`fromDateTime`, `toDateTime`, preset "Hari Ini", "7 Hari Terakhir", "30 Hari Terakhir").
  - Pagination (`pageNumber`, `pageSize`).
  - Credential info banner (Partner ID & Environment).
  - Summary stats (Total Data & Total Nominal).
  - Tabel interaktif daftar transaksi VA dari Winpay (Waktu, Channel, No. VA, Ref, Amount, Fee, Status, Callback).
  - Modal inspect Detail Transaksi & Raw JSON.
