# Implementation Plan — Time-Based Expiry Logic for Checkout Page

## 🎯 Objective
Implement time-based expiration calculation for Winpay Checkout Page invoices across the backend and frontend, since the upstream Winpay API returns status `"UNPAID"` even after the invoice interval has expired.

## 📋 Key Changes
1. **`backend/helpers/storage.js`**:
   - ✅ Stored `interval` (in minutes) in `recordTransaction()`.
   - ✅ Added `checkIfTxExpired(tx)` helper function.
   - ✅ In `getTransactions()`, auto-evaluated `PENDING` transactions that have exceeded their expiration time (`createdAt + interval * 60s` or `expiredDate`) and dynamically updated status to `EXPIRED`.

2. **`backend/api/routes/checkoutpage.js`**:
   - ✅ Passed `interval` to `recordTransaction()` during invoice creation.
   - ✅ In `GET /checkout/invoice/last`, calculated time-based expiry if Winpay API returns `"UNPAID"` / `"PENDING"`.

3. **`backend/api/routes/state.js`**:
   - ✅ In `POST /api/transactions/check-status`, performed time-based expiry check for Checkout Page (and VA if `expiredDate` is passed) when Winpay returns `"UNPAID"` / `"01"`.

4. **Frontend**:
   - ✅ `TransactionHistory.jsx` displays `⌛ KEDALUWARSA` badge automatically when status is `EXPIRED`.
