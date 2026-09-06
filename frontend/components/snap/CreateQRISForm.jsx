'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';
import { useCustomPartnerId } from '@/lib/useEnv';

export default function CreateQRISForm({ env }) {
  const [amount,         setAmount]         = useState('25000');
  const [expiredMinutes, setExpiredMinutes] = useState('5');
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [isError,        setIsError]        = useState(false);
  const [customPartnerId] = useCustomPartnerId();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/snap/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          expiredMinutes: Number(expiredMinutes) || 5,
          env,
          partnerId: customPartnerId || undefined,
        }),
      });
      const data = await r.json();

      setIsError(!r.ok || !data.success);
      setResult(data);

      if (data.success && data.data) {
        const { saveLocalTransaction } = await import('@/lib/txStorage');
        saveLocalTransaction({
          type: 'QRIS',
          category: 'qris',
          channel: 'QRIS',
          trxId: data.data?.trxId || data.data?.partnerReferenceNo,
          partnerReferenceNo: data.data?.partnerReferenceNo || data.data?.trxId,
          amount: Number(amount) || 0,
          status: 'PENDING',
          env: env || 'development',
          qrContent: data.data?.qrContent || data.data?.qrCode,
          rawResponse: data.data,
        });
      }
    } catch (err) {
      setIsError(true);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Amount (Rp)</label>
          <input
            className="form-input" type="number" min="1000"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="25000"
          />
        </div>
        <div className="form-group">
          <div className="flex justify-between items-center">
            <label className="form-label">Expired Time (Menit)</label>
            <span className="text-xs text-muted">Default: 5 Menit</span>
          </div>
          <input
            className="form-input"
            type="number"
            min="1"
            max="43200"
            value={expiredMinutes}
            onChange={e => setExpiredMinutes(e.target.value)}
            placeholder="5"
          />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Generating...</> : '▣ Generate QRIS'}
        </button>
      </form>
      <ResponseViewer data={result} isError={isError} />
    </div>
  );
}
