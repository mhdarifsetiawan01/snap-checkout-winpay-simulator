'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';

export default function InquiryPanel({ env }) {
  const [inquiryResult, setInquiryResult] = useState(null);
  const [statusResult,  setStatusResult]  = useState(null);
  const [loadingInq,    setLoadingInq]    = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isErrInq,      setIsErrInq]      = useState(false);
  const [isErrStatus,   setIsErrStatus]   = useState(false);

  const doInquiry = async () => {
    setLoadingInq(true); setInquiryResult(null);
    try {
      const r = await fetch('/api/snap/inquiry-va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env }),
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
    setLoadingStatus(true); setStatusResult(null);
    try {
      const r = await fetch('/api/snap/status-va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env }),
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

  return (
    <div>
      <p className="text-sm text-muted mb-4" style={{ marginBottom: 16 }}>
        Menggunakan data VA terakhir yang tersimpan di db.json (lastVirtualAccountNo, lastContractId).
      </p>
      <div className="flex gap-3 mb-4" style={{ gap: 12, marginBottom: 16 }}>
        <button className="btn btn-secondary" onClick={doInquiry} disabled={loadingInq} style={{ flex: 1 }}>
          {loadingInq ? <><span className="spinner" /> Checking...</> : '🔍 Inquiry VA'}
        </button>
        <button className="btn btn-secondary" onClick={doStatus} disabled={loadingStatus} style={{ flex: 1 }}>
          {loadingStatus ? <><span className="spinner" /> Checking...</> : '📊 Payment Status'}
        </button>
      </div>
      {inquiryResult && <ResponseViewer data={inquiryResult} isError={isErrInq} />}
      {statusResult  && <ResponseViewer data={statusResult}  isError={isErrStatus} />}
    </div>
  );
}
