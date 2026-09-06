'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';

export default function CreateQRISForm({ env }) {
  const [amount,  setAmount]  = useState('25000');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/snap/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, env }),
      });
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
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Amount (Rp)</label>
          <input
            className="form-input" type="number" min="1000"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="25000"
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
