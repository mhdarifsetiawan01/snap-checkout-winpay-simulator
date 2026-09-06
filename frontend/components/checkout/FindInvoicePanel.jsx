'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';

export default function FindInvoicePanel({ env }) {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [isError, setIsError] = useState(false);

  const handleFind = async () => {
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`/api/checkout/invoice/last${env ? `?env=${env}` : ''}`);
      const data = await r.json();
      setIsError(!r.ok || !data.success);
      setResult(data);
    } catch (err) {
      setIsError(true);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
        Menggunakan <span className="font-mono">lastInvoiceId</span> yang tersimpan di db.json.
      </p>
      <button className="btn btn-secondary btn-full" onClick={handleFind} disabled={loading}>
        {loading ? <><span className="spinner" /> Fetching...</> : '🔍 Find Last Invoice'}
      </button>
      <ResponseViewer data={result} isError={isError} />
    </div>
  );
}
