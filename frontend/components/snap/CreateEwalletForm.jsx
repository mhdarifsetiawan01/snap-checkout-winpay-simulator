'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';
import { useCustomPartnerId } from '@/lib/useEnv';

const EWALLET_CHANNELS = [
  { value: 'SPAY',  label: 'ShopeePay' },
  { value: 'DANA',  label: 'DANA' },
  { value: 'OVO',   label: 'OVO' },
  { value: 'SC',    label: 'Speedcash' },
  { value: 'ASTRA', label: 'AstraPay' },
];

export default function CreateEwalletForm({ env }) {
  const [channel,        setChannel]        = useState('SPAY');
  const [amount,         setAmount]         = useState('10000');
  const [expiredMinutes, setExpiredMinutes] = useState('5');
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [isError,        setIsError]        = useState(false);
  const [customPartnerId] = useCustomPartnerId();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/snap/ewallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          amount,
          expiredMinutes: Number(expiredMinutes) || 5,
          env,
          partnerId: customPartnerId || undefined,
        }),
      });
      const data = await r.json();

      setIsError(!r.ok || !data.success);
      setResult(data);
      // Tampilkan redirect URL jika ada
    } catch (err) {
      setIsError(true);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const redirectUrl = result?.data?.webRedirectUrl;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">eWallet Provider</label>
          <select className="form-select" value={channel} onChange={e => setChannel(e.target.value)}>
            {EWALLET_CHANNELS.map(({ value, label }) => (
              <option key={value} value={value}>{label} ({value})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Amount (Rp)</label>
          <input
            className="form-input" type="number" min="1000"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="10000"
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
          {loading ? <><span className="spinner" /> Sending...</> : '◈ Create eWallet Payment'}
        </button>
      </form>

      {/* Redirect URL shortcut */}
      {redirectUrl && (
        <a href={redirectUrl} target="_blank" rel="noreferrer" className="redirect-link">
          ↗ Buka Halaman Pembayaran eWallet
        </a>
      )}

      <ResponseViewer data={result} isError={isError} />
    </div>
  );
}
