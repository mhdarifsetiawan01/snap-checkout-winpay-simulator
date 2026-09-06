'use client';
import { useState, useEffect, useCallback } from 'react';
import EnvSwitcher from '@/components/shared/EnvSwitcher';
import CredentialInfo from '@/components/shared/CredentialInfo';
import { useEnv, useCustomPartnerId } from '@/lib/useEnv';

// Helper to format date into YYYY-MM-DDTHH:mm:ss+07:00
function formatToIsoOffset(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
}

// Format date for datetime-local input (YYYY-MM-DDTHH:mm)
function formatForInput(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ReportVaPage() {
  const [env, setEnv] = useEnv();
  const [customPartnerId] = useCustomPartnerId();

  // Default filter: 7 hari terakhir
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    d.setHours(0, 0, 0, 0);
    return formatForInput(d);
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return formatForInput(d);
  });
  const [pageSize, setPageSize] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);
  const [partnerRef, setPartnerRef] = useState('');

  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const applyPreset = (days) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    setFromDate(formatForInput(start));
    setToDate(formatForInput(end));
    setPageNumber(1);
  };

  const handleFetchReport = useCallback(async (customPage) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const startIso = `${fromDate}:00+07:00`;
      const endIso = `${toDate}:59+07:00`;
      const targetPage = customPage !== undefined ? customPage : pageNumber;

      const payload = {
        env,
        fromDateTime: startIso,
        toDateTime: endIso,
        pageSize: Number(pageSize),
        pageNumber: Number(targetPage),
        partnerReferenceNo: partnerRef.trim() || undefined,
        partnerId: customPartnerId || undefined,
      };

      const res = await fetch('/api/snap/report/transaction-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setRawResponse(json);

      if (json.success && json.data) {
        setResultData(json.data);
      } else {
        const errMsg = json.error || (typeof json.data === 'object' ? json.data?.responseMessage : null) || 'Gagal mengambil data laporan';
        setErrorMsg(errMsg);
        setResultData(null);
      }
    } catch (err) {
      setErrorMsg(`Error jaringan: ${err.message}`);
      setResultData(null);
    } finally {
      setLoading(false);
    }
  }, [env, fromDate, toDate, pageSize, pageNumber, partnerRef, customPartnerId]);

  // Initial load & automatic reload whenever page is visited / focused
  useEffect(() => {
    handleFetchReport();

    const onFocus = () => {
      handleFetchReport();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFetchReport();
      }
    });

    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [handleFetchReport]);

  const listItems = Array.isArray(resultData?.detailData) ? resultData.detailData : [];
  const totalAmount = listItems.reduce((acc, item) => {
    const val = Number(item.amount?.value || item.additionalInfo?.amountDetail?.amount?.value || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <h1>📊 Report Transaction List VA</h1>
        <p>Laporan daftar transaksi Virtual Account resmi dari server Winpay via SNAP BI (Service Code: 12).</p>
      </div>

      {/* Environment Switcher */}
      <EnvSwitcher env={env} setEnv={setEnv} />

      {/* Active Credential Info */}
      <CredentialInfo env={env} />

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍</span> Filter Rentang Waktu & Parameter
          </h3>
          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Preset:</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => applyPreset(0)}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => applyPreset(7)}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => applyPreset(30)}
            >
              30 Hari Terakhir
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Dari Tanggal (fromDateTime)
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Sampai Tanggal (toDateTime)
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Jumlah Data (pageSize)
            </label>
            <select
              className="input-field"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageNumber(1);
              }}
              style={{ width: '100%', fontSize: '13px' }}
            >
              <option value="10">10 Data (Default)</option>
              <option value="20">20 Data</option>
              <option value="50">50 Data</option>
              <option value="100">100 Data</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Halaman ke- (pageNumber)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pageNumber <= 1 || loading}
                onClick={() => {
                  const p = Math.max(1, pageNumber - 1);
                  setPageNumber(p);
                  handleFetchReport(p);
                }}
                style={{ padding: '6px 12px' }}
              >
                ◀
              </button>
              <input
                type="number"
                className="input-field"
                min="1"
                value={pageNumber}
                onChange={(e) => setPageNumber(Number(e.target.value) || 1)}
                style={{ width: '100%', textAlign: 'center', fontSize: '13px' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading || listItems.length < pageSize}
                onClick={() => {
                  const p = pageNumber + 1;
                  setPageNumber(p);
                  handleFetchReport(p);
                }}
                style={{ padding: '6px 12px' }}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Partner Ref No (Opsional, otomatis digenerate jika kosong)"
              value={partnerRef}
              onChange={(e) => setPartnerRef(e.target.value)}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={() => handleFetchReport()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '🔄'}
              <span>Ambil Data Laporan</span>
            </button>
            {rawResponse && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRawJson(!showRawJson)}
                style={{ fontSize: '12px' }}
              >
                {showRawJson ? '✕ Tutup JSON' : '🔍 Raw Response JSON'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Raw JSON View if toggled */}
      {showRawJson && rawResponse && (
        <div className="card" style={{ marginBottom: '20px', background: '#0a0d14', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>📄 Response Payload (SNAP Service Code: 12)</span>
            <button className="btn-copy" onClick={() => navigator.clipboard.writeText(JSON.stringify(rawResponse, null, 2))}>
              Salin JSON
            </button>
          </div>
          <pre style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', maxHeight: '280px', overflowY: 'auto' }}>
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>⚠️ Respon dari Winpay: {errorMsg}</div>
            {String(errorMsg).includes('Feature Not Allowed') && (
              <div style={{ fontSize: '12px', marginTop: '6px', color: '#fecaca', lineHeight: 1.5 }}>
                💡 <strong>Catatan:</strong> Fitur Report Transaction List (Service Code 12) membutuhkan hak akses khusus yang perlu diaktifkan di sisi konfigurasi merchant Winpay Dashboard.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Data Ditampilkan</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
            {loading ? '...' : `${listItems.length} Transaksi`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Halaman {pageNumber} (PageSize: {pageSize})</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Nominal di Halaman Ini</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>
            {loading ? '...' : `Rp ${totalAmount.toLocaleString('id-ID')}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Mata Uang: IDR</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status SNAP Response</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: resultData?.responseCode === '2001200' ? '#34d399' : 'var(--text-muted)' }}>
            {resultData?.responseCode || '—'} {resultData?.responseMessage ? `(${resultData.responseMessage})` : ''}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ref: {resultData?.referenceNo ? `${resultData.referenceNo.substring(0, 16)}...` : '—'}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
            📋 Hasil Laporan Transaksi Virtual Account
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {listItems.length > 0 ? `Menampilkan ${listItems.length} baris data` : 'Belum ada data transaksi'}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 10px', width: '24px', height: '24px' }} />
            <p style={{ margin: 0 }}>Mengambil data transaksi dari server Winpay...</p>
          </div>
        ) : listItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Tidak ada transaksi ditemukan pada rentang waktu ini</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Coba ubah filter rentang tanggal atau gunakan preset 30 Hari Terakhir.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Waktu Transaksi</th>
                  <th>Channel / Bank</th>
                  <th>Nomor VA / Winpay Reff</th>
                  <th>Merchant Ref / Trx ID</th>
                  <th>Nominal (IDR)</th>
                  <th>Fee</th>
                  <th>Status Transaksi</th>
                  <th>Callback</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {listItems.map((item, idx) => {
                  const addInfo = item.additionalInfo || {};
                  const amountVal = Number(item.amount?.value || addInfo.amountDetail?.amount?.value || 0);
                  const feeVal = Number(addInfo.amountDetail?.fee?.value || 0);
                  const st = (item.status || item.type || '').toUpperCase();
                  const cbStatus = (addInfo.callbackDetail?.status || '').toUpperCase();

                  let statusBadge = (
                    <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      {item.status || item.type || '—'}
                    </span>
                  );

                  if (st === 'SUCCESS' || st === 'PAID' || st === 'SETTLED') {
                    statusBadge = (
                      <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        ✓ {st}
                      </span>
                    );
                  } else if (st === 'EXPIRED') {
                    statusBadge = (
                      <span style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        ⌛ EXPIRED
                      </span>
                    );
                  } else if (st === 'INIT' || st === 'PENDING') {
                    statusBadge = (
                      <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        ⏳ {st}
                      </span>
                    );
                  } else if (st === 'FAILED' || st === 'CANCELLED') {
                    statusBadge = (
                      <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        ✕ {st}
                      </span>
                    );
                  }

                  return (
                    <tr key={idx}>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {item.dateTime ? item.dateTime.replace('T', ' ').replace('+07:00', '') : '—'}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 500 }}>
                        {addInfo.channel || '—'}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <code style={{ fontSize: '11px' }}>{addInfo.winpayReff || '—'}</code>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: 500 }}>{addInfo.merchantReff || '—'}</div>
                        {addInfo.transactionId && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {addInfo.transactionId}</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                        Rp {amountVal.toLocaleString('id-ID')}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {feeVal > 0 ? `Rp ${feeVal.toLocaleString('id-ID')}` : 'Rp 0'}
                      </td>
                      <td>{statusBadge}</td>
                      <td style={{ fontSize: '11px' }}>
                        {cbStatus ? (
                          <span style={{ color: cbStatus === 'SUCCESS' ? '#34d399' : 'var(--text-muted)' }}>
                            {cbStatus}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setSelectedItem(item)}
                        >
                          🔍 Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bottom Bar */}
        {listItems.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Halaman {pageNumber} • Menampilkan {listItems.length} transaksi
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pageNumber <= 1 || loading}
                onClick={() => {
                  const p = Math.max(1, pageNumber - 1);
                  setPageNumber(p);
                  handleFetchReport(p);
                }}
                style={{ fontSize: '12px' }}
              >
                ◀ Sebelumnya
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading || listItems.length < pageSize}
                onClick={() => {
                  const p = pageNumber + 1;
                  setPageNumber(p);
                  handleFetchReport(p);
                }}
                style={{ fontSize: '12px' }}
              >
                Selanjutnya ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '650px',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#0d1117',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>
                📄 Detail Transaksi Report
              </h3>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => setSelectedItem(null)}
              >
                ✕ Tutup
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Channel</span>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedItem.additionalInfo?.channel || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nomor VA / Winpay Reff</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>{selectedItem.additionalInfo?.winpayReff || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Merchant Reference</span>
                <div style={{ fontSize: '13px' }}>{selectedItem.additionalInfo?.merchantReff || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transaction ID</span>
                <div style={{ fontSize: '13px' }}>{selectedItem.additionalInfo?.transactionId || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nominal</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                  Rp {Number(selectedItem.amount?.value || selectedItem.additionalInfo?.amountDetail?.amount?.value || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Waktu Transaksi</span>
                <div style={{ fontSize: '12px' }}>{selectedItem.dateTime || '—'}</div>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Raw Item JSON:</span>
                <button
                  className="btn-copy"
                  style={{ fontSize: '10px' }}
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedItem, null, 2))}
                >
                  Salin JSON
                </button>
              </div>
              <pre style={{ margin: 0, padding: '12px', background: '#07090e', borderRadius: '6px', fontSize: '11px', color: '#cbd5e1', overflowX: 'auto' }}>
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
