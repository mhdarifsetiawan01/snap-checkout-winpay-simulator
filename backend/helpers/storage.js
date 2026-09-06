const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

const file = path.join(__dirname, "../db.json");
const adapter = new FileSync(file);
const db = low(adapter);

// default data
db.defaults({
  lastContractId: null,
  lastTrxId: null,
  lastVirtualAccountNo: null,
  lastChannel: null,
  lastPartnerReferenceNo: null,
  lastWebRedirectUrl: null,
  lastAppRedirectUrl: null,
  lastInvoiceId: null,
  lastInvoiceRef: null,
  lastCallbackReceived: null,
  transactions: {
    va: [],
    qris: [],
    ewallet: [],
    checkout: [],
  },
}).write();

// simpan key apapun
function saveKey(key, value) {
  db.read();
  db.set(key, value).write();
}

// ambil key apapun
function getKey(key) {
  db.read();
  return db.get(key).value();
}

/**
 * Simpan transaksi baru ke kategori tertentu (Maksimal 10 transaksi terakhir per kategori)
 * @param {'va'|'qris'|'ewallet'|'checkout'} category
 * @param {Object} data
 */
function recordTransaction(category, data) {
  db.read();
  const validCategory = (category || "va").toLowerCase();
  const currentList = db.get(`transactions.${validCategory}`).value() || [];

  const newTx = {
    id: data.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: (data.type || validCategory).toUpperCase(),
    category: validCategory,
    channel: data.channel || "—",
    trxId: data.trxId || null,
    contractId: data.contractId || data.rawResponse?.virtualAccountData?.additionalInfo?.contractId || data.rawResponse?.additionalInfo?.contractId || null,
    partnerReferenceNo: data.partnerReferenceNo || data.trxId || null,
    virtualAccountNo: data.virtualAccountNo || null,
    invoiceId: data.invoiceId || null,
    amount: data.amount ? Number(data.amount) : 0,
    status: data.status || "PENDING", // PENDING | PAID | FAILED | EXPIRED
    errorMessage: data.errorMessage || null,
    env: data.env || process.env.NODE_ENV || "development",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paidAt: data.status === "PAID" ? new Date().toISOString() : null,
    qrContent: data.qrContent || null,
    webRedirectUrl: data.webRedirectUrl || null,
    appRedirectUrl: data.appRedirectUrl || null,
    interval: data.interval ? Number(data.interval) : (data.expiredMinutes ? Number(data.expiredMinutes) : (validCategory === "checkout" ? 5 : null)),
    rawResponse: data.rawResponse || null,
    callbackData: data.callbackData || null,
  };

  // Tambahkan di urutan paling atas dan batasi maksimal 10
  const updatedList = [newTx, ...currentList.filter(tx => tx.id !== newTx.id)].slice(0, 10);
  db.set(`transactions.${validCategory}`, updatedList).write();

  return newTx;
}

/**
 * Update status transaksi berdasarkan query pencocokan (trxId, virtualAccountNo, partnerReferenceNo, invoiceId, atau id)
 * @param {Object} query - e.g. { trxId, virtualAccountNo, invoiceId, id, partnerReferenceNo }
 * @param {string} newStatus - 'PAID' | 'FAILED' | 'EXPIRED' | 'PENDING'
 * @param {Object} [extraData] - optional callback or inquiry response data
 */
function updateTransactionStatus(query, newStatus, extraData = {}) {
  db.read();
  const categories = ["va", "qris", "ewallet", "checkout"];
  let updatedTx = null;

  for (const cat of categories) {
    const list = db.get(`transactions.${cat}`).value() || [];
    const index = list.findIndex(tx => {
      if (query.id && tx.id === query.id) return true;
      if (query.trxId && tx.trxId === query.trxId) return true;
      if (query.partnerReferenceNo && tx.partnerReferenceNo === query.partnerReferenceNo) return true;
      if (query.virtualAccountNo && tx.virtualAccountNo && String(tx.virtualAccountNo).trim() === String(query.virtualAccountNo).trim()) return true;
      if (query.invoiceId && tx.invoiceId === query.invoiceId) return true;
      return false;
    });

    if (index !== -1) {
      const existing = list[index];
      const now = new Date().toISOString();
      const updated = {
        ...existing,
        ...extraData,
        status: newStatus.toUpperCase(),
        updatedAt: now,
        paidAt: (newStatus.toUpperCase() === "PAID" || newStatus.toUpperCase() === "SUCCESS") ? (existing.paidAt || now) : existing.paidAt,
        callbackData: extraData.callbackData || existing.callbackData || null,
      };

      list[index] = updated;
      db.set(`transactions.${cat}`, list).write();
      updatedTx = updated;
      break;
    }
  }

  return updatedTx;
}

/**
 * Periksa apakah transaksi sudah kadaluarsa berdasarkan kalkulasi waktu
 * @param {Object} tx
 * @returns {boolean}
 */
function checkIfTxExpired(tx) {
  if (!tx || (tx.status !== "PENDING" && tx.status !== "UNPAID")) return false;

  // 1. Checkout Page / Transaksi dengan parameter interval (menit)
  if (tx.category === "checkout" || tx.type === "INVOICE" || tx.interval) {
    const intervalMins = Number(tx.interval) > 0 ? Number(tx.interval) : 5;
    const createdTime = tx.createdAt ? new Date(tx.createdAt).getTime() : null;
    if (createdTime && !isNaN(createdTime)) {
      return Date.now() > (createdTime + intervalMins * 60 * 1000);
    }
  }

  // 2. SNAP VA / QRIS / eWallet dengan field expiredDate
  const expiredDateStr = tx.rawResponse?.virtualAccountData?.expiredDate || tx.rawResponse?.expiredDate;
  if (expiredDateStr) {
    const expTime = new Date(expiredDateStr).getTime();
    if (expTime && !isNaN(expTime)) {
      return Date.now() > expTime;
    }
  }

  return false;
}

/**
 * Ambil daftar transaksi (per kategori atau semua kategori digabung)
 * Secara otomatis mengevaluasi status EXPIRED jika waktu telah terlewat.
 * @param {'all'|'va'|'qris'|'ewallet'|'checkout'} [category='all']
 * @param {number} [limit=10]
 */
function getTransactions(category = "all", limit = 10) {
  db.read();
  const categories = ["va", "qris", "ewallet", "checkout"];
  let hasDbChanges = false;

  // Auto-sync status EXPIRED di DB untuk transaksi PENDING yang sudah melewati waktu
  for (const c of categories) {
    const list = db.get(`transactions.${c}`).value() || [];
    let listModified = false;
    for (const tx of list) {
      if (checkIfTxExpired(tx)) {
        tx.status = "EXPIRED";
        tx.updatedAt = new Date().toISOString();
        listModified = true;
        hasDbChanges = true;
      }
    }
    if (listModified) {
      db.set(`transactions.${c}`, list);
    }
  }
  if (hasDbChanges) {
    db.write();
  }

  const cat = (category || "all").toLowerCase();
  if (cat !== "all" && categories.includes(cat)) {
    return (db.get(`transactions.${cat}`).value() || []).slice(0, limit);
  }

  // Gabungkan semua dan urutkan berdasarkan createdAt descending
  const all = [
    ...(db.get("transactions.va").value() || []),
    ...(db.get("transactions.qris").value() || []),
    ...(db.get("transactions.ewallet").value() || []),
    ...(db.get("transactions.checkout").value() || []),
  ];

  return all
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

module.exports = {
  saveKey,
  getKey,
  recordTransaction,
  updateTransactionStatus,
  checkIfTxExpired,
  getTransactions,
};
