'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';
import { useCustomPartnerId } from '@/lib/useEnv';

export default function InquiryPanel({ env }) {
  const [inquiryResult, setInquiryResult] = useState(null);
  const [statusResult,  setStatusResult]  = useState(null);
  const [deleteResult,  setDeleteResult]  = useState(null);
  const [loadingInq,    setLoadingInq]    = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isErrInq,      setIsErrInq]      = useState(false);
  const [isErrStatus,   setIsErrStatus]   = useState(false);
  const [isErrDelete,   setIsErrDelete]   = useState(false);
  const [customPartnerId] = useCustomPartnerId();

  const doInquiry = async () => {
    setLoadingInq(true); setInquiryResult(null); setDeleteResult(null);
    try {
      const r = await fetch('/api/snap/inquiry-va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env,
          partnerId: customPartnerId || undefined,
        }),
      });
      const data = await r.json();
      setIsErrInq(!r.ok || !data.success);
      setInquiryResult(data);
    } catch (err) {
      setIsErrInq(true); setInquiryResult({ error: err.message });
    } finally {
      setLoadingInq(false);
    }
  };

  const doStatus = async () => {
    setLoadingStatus(true); setStatusResult(null); setDeleteResult(null);
    try {
      const r = await fetch('/api/snap/status-va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env,
          partnerId: customPartnerId || undefined,
        }),
      });
      const data = await r.json();

      setIsErrStatus(!r.ok || !data.success);
      setStatusResult(data);
    } catch (err) {
      setIsErrStatus(true); setStatusResult({ error: err.message });
    } finally {
      setLoadingStatus(false);
    }
  };

  const doDeleteVA = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan / menghapus Virtual Account aktif terakhir?')) {
      return;
    }
    setLoadingDelete(true); setDeleteResult(null);
    try {
      const r = await fetch('/api/snap/delete-va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env,
          partnerId: customPartnerId || undefined,
        }),
      });
      const data = await r.json();
      setIsErrDelete(!r.ok || !data.success);
      setDeleteResult(data);
    } catch (err) {
      setIsErrDelete(true); setDeleteResult({ error: err.message });
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted mb-4" style={{ marginBottom: 16 }}>
        Menggunakan data VA terakhir yang tersimpan di db.json (lastVirtualAccountNo, lastContractId, lastTrxId).
      </p>
      <div className="flex gap-3 mb-4" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={doInquiry} disabled={loadingInq} style={{ flex: '1 1 120px' }}>
          {loadingInq ? <><span className="spinner" /> Checking...</> : '🔍 Inquiry VA'}
        </button>
        <button className="btn btn-secondary" onClick={doStatus} disabled={loadingStatus} style={{ flex: '1 1 120px' }}>
          {loadingStatus ? <><span className="spinner" /> Checking...</> : '📊 Payment Status'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={doDeleteVA}
          disabled={loadingDelete}
          style={{
            flex: '1 1 120px',
            color: '#f87171',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          {loadingDelete ? <><span className="spinner" /> Deleting...</> : '🗑️ Delete VA'}
        </button>
      </div>
      {inquiryResult && <ResponseViewer data={inquiryResult} isError={isErrInq} />}
      {statusResult  && <ResponseViewer data={statusResult}  isError={isErrStatus} />}
      {deleteResult  && <ResponseViewer data={deleteResult}  isError={isErrDelete} />}
    </div>
  );
}
