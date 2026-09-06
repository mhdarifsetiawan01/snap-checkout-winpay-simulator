'use client';
import { useState, useCallback } from 'react';

const STATE_LABELS = {
  lastContractId:         { label: 'Contract ID',    icon: '🔑' },
  lastTrxId:              { label: 'TRX ID',         icon: '🧾' },
  lastVirtualAccountNo:   { label: 'VA Number',      icon: '🏦' },
  lastChannel:            { label: 'Channel',        icon: '📡' },
  lastPartnerReferenceNo: { label: 'Partner Ref No', icon: '🔗' },
  lastWebRedirectUrl:     { label: 'Web Redirect',   icon: '🌐' },
  lastInvoiceId:          { label: 'Invoice ID',     icon: '📄' },
  lastInvoiceRef:         { label: 'Invoice Ref',    icon: '🏷️' },
};

export default function StatePanel({ initialState }) {
  const [state, setState] = useState(initialState || {});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/state');
      const json = await r.json();
      if (json.success) setState(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const entries = Object.entries(STATE_LABELS).filter(
    ([key]) => key !== 'lastWebRedirectUrl'
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title" style={{ margin: 0 }}>💾 Transaction State</h2>
        <button
          className="btn btn-secondary"
          onClick={refresh}
          disabled={loading}
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          {loading ? <span className="spinner" /> : '↻ Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        {entries.map(([key, { label, icon }]) => (
          <div key={key} className="card">
            <div className="card-title">{icon} {label}</div>
            <div className={`card-value small ${!state[key] ? 'text-muted' : ''}`}>
              {state[key] ?? '—'}
            </div>
          </div>
        ))}

        {/* Web Redirect khusus sebagai link */}
        {state.lastWebRedirectUrl && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-title">🌐 Last Web Redirect URL</div>
            <a
              href={state.lastWebRedirectUrl}
              target="_blank"
              rel="noreferrer"
              className="redirect-link"
            >
              ↗ Buka URL Pembayaran
            </a>
            <div className="text-mono mt-4" style={{ marginTop: 8 }}>
              {state.lastWebRedirectUrl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
