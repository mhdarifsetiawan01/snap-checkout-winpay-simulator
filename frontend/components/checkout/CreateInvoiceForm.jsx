'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';
import { useCustomCheckoutCredentials } from '@/lib/useEnv';

export default function CreateInvoiceForm({ env }) {
  const [price,          setPrice]          = useState('100000');
  const [productName,    setProductName]    = useState('Produk A');
  const [expiredMinutes, setExpiredMinutes] = useState('5');
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [isError,        setIsError]        = useState(false);
  const [customCheckout]                    = useCustomCheckoutCredentials();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/checkout/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Number(price),
          productName,
          interval: Number(expiredMinutes) || 5,
          env,
          clientKey: customCheckout.clientKey || undefined,
          secretKey: customCheckout.secretKey || undefined,
        }),
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

  const redirectUrl =
    result?.data?.responseData?.redirect_url ||
    result?.data?.responseData?.redirectUrl ||
    result?.data?.redirect_url ||
    result?.data?.redirectUrl ||
    result?.data?.url;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Harga (Rp)</label>
          <input
            className="form-input" type="number" min="1000"
            value={price} onChange={e => setPrice(e.target.value)}
            placeholder="100000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Nama Produk</label>
          <input
            className="form-input" type="text"
            value={productName} onChange={e => setProductName(e.target.value)}
            placeholder="Produk A"
          />
        </div>
        <div className="form-group">
          <div className="flex justify-between items-center">
            <label className="form-label">Expired Time / Interval (Menit)</label>
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
          {loading ? <><span className="spinner" /> Creating...</> : '◻ Create Invoice'}
        </button>
      </form>

      {redirectUrl && (
        <a href={redirectUrl} target="_blank" rel="noreferrer" className="redirect-link">
          ↗ Buka Halaman Pembayaran Invoice
        </a>
      )}

      <ResponseViewer data={result} isError={isError} />
    </div>
  );
}
