'use client';
import { useState } from 'react';
import CreateInvoiceForm from '@/components/checkout/CreateInvoiceForm';
import FindInvoicePanel  from '@/components/checkout/FindInvoicePanel';

const ENV_OPTIONS = ['development', 'sandbox', 'production'];

export default function CheckoutPage() {
  const [env, setEnv] = useState('development');

  return (
    <div>
      <div className="page-header">
        <h1>◻ Checkout Page</h1>
        <p>Buat dan cek Invoice via Winpay Checkout Page API.</p>
      </div>

      {/* Environment Switcher */}
      <div className="flex items-center gap-3 mb-6" style={{ marginBottom: 24 }}>
        <span className="text-sm text-muted">Environment:</span>
        {ENV_OPTIONS.map(e => (
          <button
            key={e}
            onClick={() => setEnv(e)}
            className={`env-badge ${e === 'production' ? 'production' : e === 'sandbox' ? 'sandbox' : 'dev'}`}
            style={{ opacity: env === e ? 1 : 0.45 }}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="two-col">
        {/* Create Invoice */}
        <div>
          <div className="card mb-4" style={{ marginBottom: 16 }}>
            <div className="card-title">◻ Create Invoice</div>
            <CreateInvoiceForm env={env} />
          </div>

          {/* Find Invoice */}
          <div className="card">
            <div className="card-title">🔍 Find Last Invoice</div>
            <FindInvoicePanel env={env} />
          </div>
        </div>

        {/* Tips kanan */}
        <div className="card">
          <div className="card-title">💡 Info Checkout Page</div>
          <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 2.2 }}>
            <li>Invoice ID disimpan otomatis setelah berhasil dibuat</li>
            <li>Response berisi <b>redirectUrl</b> — teruskan ke customer untuk bayar</li>
            <li><b>Find Invoice</b> menggunakan ID dari request terakhir</li>
            <li>Expired time default: 60 menit dari waktu pembuatan</li>
          </ul>
          <div className="divider" />
          <div className="card-title">🔗 Endpoint Callback</div>
          <div className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            POST /api/callback/checkout
          </div>
        </div>
      </div>
    </div>
  );
}
