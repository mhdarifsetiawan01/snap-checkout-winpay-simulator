'use client';
import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = [
  { id: 'all',      label: 'Semua Transaksi', icon: '◈' },
  { id: 'va',       label: 'Virtual Account', icon: '🏦' },
  { id: 'qris',     label: 'QRIS',           icon: '📱' },
  { id: 'ewallet',  label: 'eWallet',        icon: '👛' },
  { id: 'checkout', label: 'Checkout Page',  icon: '🧾' },
];

export default function TransactionHistory({ defaultCategory = 'all', title = 'Daftar 10 Transaksi Terakhir' }) {
  const [activeTab, setActiveTab] = useState(defaultCategory);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [inquiringId, setInquiringId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [inquiryModalData, setInquiryModalData] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?category=${activeTab}&limit=10&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTransactions(json.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTransactions();

    const onFocus = () => {
      fetchTransactions();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        fetchTransactions();
      }
    });

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchTransactions]);

  const handleCheckStatus = async (tx) => {
    setCheckingId(tx.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/transactions/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tx.id,
          type: tx.type,
          channel: tx.channel,
          trxId: tx.trxId,
          virtualAccountNo: tx.virtualAccountNo,
          invoiceId: tx.invoiceId,
          env: tx.env,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: 'success',
          msg: `Status transaksi ${tx.trxId || tx.virtualAccountNo || tx.id} berhasil diperbarui: ${json.status}`,
        });
        // Refresh local list
        fetchTransactions();
      } else {
        setFeedback({
          type: 'error',
          msg: `Gagal mengecek status: ${json.error || 'Unknown error'}`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: `Error jaringan: ${err.message}`,
      });
    } finally {
      setCheckingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleInquiryVA = async (tx) => {
    setInquiringId(tx.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/snap/inquiry-va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trxId: tx.trxId,
          contractId: tx.contractId || tx.rawResponse?.virtualAccountData?.additionalInfo?.contractId,
          virtualAccountNo: tx.virtualAccountNo,
          channel: tx.channel,
          env: tx.env,
        }),
      });
      const json = await res.json();
      setInquiryModalData({ tx, response: json, isError: !res.ok || !json.success });
      if (json.success && (json.data?.responseCode === '2003000' || json.data?.responseCode === '200')) {
        const vaData = json.data?.virtualAccountData || {};
        const exp = vaData.expiredDate ? ` | Expired: ${vaData.expiredDate}` : '';
        setFeedback({
          type: 'success',
          msg: `Inquiry VA Sukses: VA ${vaData.virtualAccountNo || tx.virtualAccountNo} (${vaData.virtualAccountName || 'Aktif'})${exp}`,
        });
        fetchTransactions();
      } else {
        const errMsg = json.data?.responseMessage || json.error || (typeof json.data === 'object' ? JSON.stringify(json.data) : 'Inquiry VA respon tidak sukses');
        setFeedback({
          type: 'error',
          msg: `Inquiry VA Respon: ${errMsg}`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: `Error jaringan: ${err.message}`,
      });
    } finally {
      setInquiringId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleDeleteVA = async (tx) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan / menghapus Virtual Account ${tx.virtualAccountNo || tx.trxId}?`)) {
      return;
    }
    setDeletingId(tx.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/snap/delete-va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtualAccountNo: tx.virtualAccountNo,
          trxId: tx.trxId,
          channel: tx.channel,
          contractId: tx.contractId || tx.rawResponse?.virtualAccountData?.additionalInfo?.contractId,
          env: tx.env,
        }),
      });
      const json = await res.json();
      if (json.success && (json.data?.responseCode === '2003100' || json.data?.responseCode === '200' || json.data?.responseMessage?.toLowerCase()?.includes('success'))) {
        setFeedback({
          type: 'success',
          msg: `Virtual Account ${tx.virtualAccountNo || tx.trxId} berhasil dihapus / dibatalkan.`,
        });
        fetchTransactions();
      } else {
        const errMsg = json.data?.responseMessage || json.error || (typeof json.data === 'object' ? JSON.stringify(json.data) : 'Gagal menghapus VA');
        setFeedback({
          type: 'error',
          msg: `Gagal menghapus VA: ${errMsg}`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: `Error jaringan: ${err.message}`,
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID' || s === 'SUCCESS' || s === 'SETTLED') {
      return (
        <span
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ✓ SUDAH DIBAYAR
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'DELETED') {
      return (
        <span
          style={{
            background: 'rgba(148, 163, 184, 0.15)',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ⊘ DIBATALKAN
        </span>
      );
    }
    if (s === 'EXPIRED') {
      return (
        <span
          style={{
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#fb923c',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ⌛ KEDALUWARSA
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ✗ GAGAL
        </span>
      );
    }
    return (
      <span
        style={{
          background: 'rgba(234, 179, 8, 0.15)',
          color: '#facc15',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ● BELUM DIBAYAR
      </span>
    );
  };

  return (
    <div className="card" style={{ marginTop: 24, padding: '20px' }}>
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="card-title" style={{ margin: 0, fontSize: '15px' }}>
            📜 {title}
          </h2>
          <p className="text-xs text-muted" style={{ marginTop: 2 }}>
            Simulasi Database Lokal (Maksimal 10 data terbaru per channel)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={fetchTransactions}
            disabled={loading}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            {loading ? <span className="spinner" /> : '↻ Refresh List'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 10,
          marginBottom: 16,
          overflowX: 'auto',
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: activeTab === cat.id ? '1px solid var(--accent)' : '1px solid transparent',
              background: activeTab === cat.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === cat.id ? 'var(--accent-light)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ marginRight: 6 }}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: 12,
            background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: feedback.type === 'success' ? '#4ade80' : '#f87171',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* Table Container */}
      {transactions.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '24px', display: 'block', marginBottom: 8 }}>📭</span>
          Belum ada riwayat transaksi pada kategori ini.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Waktu & Tipe</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Identitas Transaksi</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Nominal</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 600 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Waktu & Tipe */}
                  <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tx.type} • <span style={{ color: 'var(--accent-light)' }}>{tx.channel}</span>
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      <span className="env-badge" style={{ fontSize: '9px', padding: '1px 5px', marginLeft: 6 }}>
                        {tx.env || 'dev'}
                      </span>
                    </div>
                  </td>

                  {/* Identitas Transaksi */}
                  <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                    {tx.virtualAccountNo && (
                      <div className="font-mono text-xs" style={{ color: '#38bdf8', fontWeight: 600 }}>
                        VA: {tx.virtualAccountNo}
                      </div>
                    )}
                    {tx.invoiceId && (
                      <div className="font-mono text-xs" style={{ color: '#c084fc', fontWeight: 600 }}>
                        Inv: {tx.invoiceId}
                      </div>
                    )}
                    {tx.trxId && (
                      <div className="font-mono text-xs text-muted">
                        Ref: {tx.trxId}
                      </div>
                    )}
                    {tx.status === 'FAILED' && tx.errorMessage && (
                      <div className="text-xs" style={{ color: '#f87171', marginTop: 3, maxWidth: 260 }}>
                        ⚠️ {tx.errorMessage}
                      </div>
                    )}
                    {(() => {
                      const linkUrl =
                        tx.redirect_url ||
                        tx.webRedirectUrl ||
                        tx.redirectUrl ||
                        tx.rawResponse?.responseData?.redirect_url ||
                        tx.rawResponse?.responseData?.redirectUrl ||
                        tx.rawResponse?.redirect_url;
                      if (!linkUrl) return null;
                      return (
                        <div style={{ marginTop: 4 }}>
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11px',
                              color: '#38bdf8',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            🔗 Buka Link Bayar ↗
                          </a>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Nominal */}
                  <td style={{ padding: '10px 8px', verticalAlign: 'top', fontWeight: 600 }}>
                    Rp {Number(tx.amount || 0).toLocaleString('id-ID')}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                    {getStatusBadge(tx.status)}
                    {tx.paidAt && (
                      <div className="text-xs text-muted" style={{ marginTop: 3, fontSize: '10px' }}>
                        Lunas: {new Date(tx.paidAt).toLocaleTimeString('id-ID')}
                      </div>
                    )}
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '10px 8px', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {tx.type === 'VA' && tx.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleInquiryVA(tx)}
                          disabled={inquiringId === tx.id || checkingId === tx.id || deletingId === tx.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: '5px',
                            fontWeight: 500,
                            color: '#38bdf8',
                            borderColor: 'rgba(56, 189, 248, 0.3)',
                            background: 'rgba(56, 189, 248, 0.08)',
                          }}
                          title="Inquiry Virtual Account ke Winpay (Cek apakah VA aktif & expired date)"
                        >
                          {inquiringId === tx.id ? <span className="spinner" /> : '🔍 Inquiry VA'}
                        </button>
                      )}
                      {tx.status !== 'FAILED' && tx.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleCheckStatus(tx)}
                          disabled={checkingId === tx.id || deletingId === tx.id || inquiringId === tx.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: '5px',
                            fontWeight: 500,
                          }}
                          title="Cek Status Pembayaran"
                        >
                          {checkingId === tx.id ? <span className="spinner" /> : '↻ Cek Status'}
                        </button>
                      )}
                      {tx.type === 'VA' && tx.status !== 'PAID' && tx.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleDeleteVA(tx)}
                          disabled={deletingId === tx.id || checkingId === tx.id || inquiringId === tx.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: '5px',
                            fontWeight: 500,
                            color: '#f87171',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.08)',
                          }}
                          title="Batalkan / Hapus Virtual Account di Winpay"
                        >
                          {deletingId === tx.id ? <span className="spinner" /> : '🗑️ Delete VA'}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedTx(tx)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          borderRadius: '5px',
                          fontWeight: 500,
                        }}
                      >
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inquiry VA Result Modal */}
      {inquiryModalData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setInquiryModalData(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 680,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#13131c',
              border: inquiryModalData.isError
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(56, 189, 248, 0.4)',
              padding: 22,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔍</span> Respon Inquiry VA (Service Code: 30)
              </h3>
              <button
                onClick={() => setInquiryModalData(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Overview Banner */}
            <div
              style={{
                background: inquiryModalData.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                border: `1px solid ${inquiryModalData.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 16,
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                <div>
                  <span className="text-muted">Nomor VA: </span>
                  <strong style={{ color: '#38bdf8' }}>
                    {inquiryModalData.response?.data?.virtualAccountData?.virtualAccountNo ||
                     inquiryModalData.tx?.virtualAccountNo || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Nama: </span>
                  <strong>
                    {inquiryModalData.response?.data?.virtualAccountData?.virtualAccountName || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Expired Date: </span>
                  <strong style={{ color: inquiryModalData.response?.data?.virtualAccountData?.expiredDate ? '#fb923c' : 'inherit' }}>
                    {inquiryModalData.response?.data?.virtualAccountData?.expiredDate || 'Tidak ada di response'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Response Code: </span>
                  <strong style={{ color: inquiryModalData.isError ? '#f87171' : '#4ade80' }}>
                    {inquiryModalData.response?.data?.responseCode || inquiryModalData.response?.responseCode || (inquiryModalData.isError ? 'Error' : '2003000')}
                  </strong>
                </div>
              </div>
            </div>

            <div className="response-body" style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12 }}>
              <pre style={{ fontSize: '11px', lineHeight: 1.5, overflowX: 'auto', color: '#e2e8f0' }}>
                {JSON.stringify(inquiryModalData.response, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setInquiryModalData(null)} style={{ padding: '6px 14px' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal / Drawer */}
      {selectedTx && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 640,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#13131c',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                📋 Detail Transaksi: {selectedTx.type} ({selectedTx.channel})
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {getStatusBadge(selectedTx.status)}
              <span className="text-xs text-muted">ID: {selectedTx.id}</span>
            </div>

            <div className="response-body" style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12 }}>
              <pre style={{ fontSize: '11px', lineHeight: 1.5, overflowX: 'auto', color: '#e2e8f0' }}>
                {JSON.stringify(selectedTx, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedTx(null)} style={{ padding: '6px 14px' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
