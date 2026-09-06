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
  db.set(key, value).write();
}

// ambil key apapun
function getKey(key) {
  return db.get(key).value();
}

/**
 * Simpan transaksi baru ke kategori tertentu (Maksimal 10 transaksi terakhir per kategori)
 * @param {'va'|'qris'|'ewallet'|'checkout'} category
 * @param {Object} data
 */
function recordTransaction(category, data) {
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
 * Ambil daftar transaksi (per kategori atau semua kategori digabung)
 * @param {'all'|'va'|'qris'|'ewallet'|'checkout'} [category='all']
 * @param {number} [limit=10]
 */
function getTransactions(category = "all", limit = 10) {
  const cat = (category || "all").toLowerCase();
  if (cat !== "all" && ["va", "qris", "ewallet", "checkout"].includes(cat)) {
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
  getTransactions,
};
