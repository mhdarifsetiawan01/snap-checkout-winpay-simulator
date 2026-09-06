'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';

const VA_CHANNELS = ['PERMATA', 'BRI', 'BNI', 'BCA', 'MANDIRI', 'INDOMARET', 'BTN', 'CIMB'];

export default function CreateVAForm({ env }) {
  const [channel, setChannel] = useState('PERMATA');
  const [amount,  setAmount]  = useState('15000');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/snap/va', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, amount, env }),
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
          <label className="form-label">Bank / Channel</label>
          <select className="form-select" value={channel} onChange={e => setChannel(e.target.value)}>
            {VA_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Amount (Rp)</label>
          <input
            className="form-input" type="number" min="1000"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="15000"
          />
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Sending...</> : '⬡ Create Virtual Account'}
        </button>
      </form>
      <ResponseViewer data={result} isError={isError} />
    </div>
  );
}
