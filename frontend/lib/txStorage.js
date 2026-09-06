'use client';

const TX_STORAGE_KEY = 'winpay_sim_transactions';

export function getLocalTransactions(category = 'all') {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];

    if (category === 'all') {
      return list.slice(0, 10);
    }
    const cat = category.toLowerCase();
    return list.filter((tx) => (tx.category || tx.type || '').toLowerCase() === cat).slice(0, 10);
  } catch (err) {
    console.error('Failed to read local transactions:', err);
    return [];
  }
}

export function saveLocalTransaction(tx) {
  if (typeof window === 'undefined' || !tx) return;
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Filter duplicate by id or trxId or invoiceId
    list = list.filter((item) => {
      if (tx.id && item.id === tx.id) return false;
      if (tx.trxId && item.trxId && item.trxId === tx.trxId) return false;
      if (tx.invoiceId && item.invoiceId && item.invoiceId === tx.invoiceId) return false;
      return true;
    });

    const newTx = {
      ...tx,
      id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: tx.createdAt || new Date().toISOString(),
      status: tx.status || 'PENDING',
    };

    list.unshift(newTx);
    // Keep maximum 50 transactions in local storage
    list = list.slice(0, 50);

    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('winpay-transactions-updated', { detail: list }));
  } catch (err) {
    console.error('Failed to save local transaction:', err);
  }
}

export function updateLocalTransactionStatus(query, status, extraData = {}) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return;

    let modified = false;
    list = list.map((tx) => {
      const matchId = query.id && tx.id === query.id;
      const matchTrx = query.trxId && tx.trxId === query.trxId;
      const matchInvoice = query.invoiceId && tx.invoiceId === query.invoiceId;
      const matchVa = query.virtualAccountNo && tx.virtualAccountNo === query.virtualAccountNo;

      if (matchId || matchTrx || matchInvoice || matchVa) {
        modified = true;
        return {
          ...tx,
          ...extraData,
          status: String(status || tx.status).toUpperCase(),
          updatedAt: new Date().toISOString(),
        };
      }
      return tx;
    });

    if (modified) {
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('winpay-transactions-updated', { detail: list }));
    }
  } catch (err) {
    console.error('Failed to update local transaction status:', err);
  }
}

export function deleteLocalTransaction(idOrTrxId) {
  if (typeof window === 'undefined' || !idOrTrxId) return;
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return;

    list = list.filter((tx) => tx.id !== idOrTrxId && tx.trxId !== idOrTrxId && tx.virtualAccountNo !== idOrTrxId);
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('winpay-transactions-updated', { detail: list }));
  } catch (err) {
    console.error('Failed to delete local transaction:', err);
  }
}

/**
 * Merge local transactions with server transactions (Union by ID/trxId, local status takes precedence if newer)
 */
export function mergeTransactions(serverList = [], localList = []) {
  const map = new Map();

  // Load server list first
  if (Array.isArray(serverList)) {
    for (const tx of serverList) {
      const key = tx.id || tx.trxId || tx.invoiceId || tx.virtualAccountNo;
      if (key) map.set(key, tx);
    }
  }

  // Merge/override with local list
  if (Array.isArray(localList)) {
    for (const tx of localList) {
      const key = tx.id || tx.trxId || tx.invoiceId || tx.virtualAccountNo;
      if (key) {
        const existing = map.get(key);
        if (existing) {
          // Merge properties, keep latest status
          map.set(key, { ...existing, ...tx });
        } else {
          map.set(key, tx);
        }
      }
    }
  }

  const merged = Array.from(map.values());
  return merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}
