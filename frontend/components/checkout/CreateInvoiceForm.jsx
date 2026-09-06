'use client';
import { useState } from 'react';
import ResponseViewer from '@/components/shared/ResponseViewer';

export default function CreateInvoiceForm({ env }) {
  const [price,       setPrice]       = useState('100000');
  const [productName, setProductName] = useState('Produk A');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [isError,     setIsError]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/checkout/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(price), productName, env }),
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

  const redirectUrl = result?.data?.responseData?.redirectUrl;

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
