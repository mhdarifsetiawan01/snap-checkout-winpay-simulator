'use client';
import { useState, useCallback } from 'react';

export default function CallbackLog({ initialCallback }) {
  const [cb, setCb]     = useState(initialCallback || null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/state');
      const json = await r.json();
      if (json.success) setCb(json.data.lastCallbackReceived);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title" style={{ margin: 0 }}>📥 Last Callback from Winpay</h2>
        <button
          className="btn btn-secondary"
          onClick={refresh}
          disabled={loading}
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          {loading ? <span className="spinner" /> : '↻ Refresh'}
        </button>
      </div>

      {!cb ? (
        <div className="empty-state">Belum ada callback diterima.</div>
      ) : (
        <div>
          {/* Meta row */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`callback-type-badge ${(cb.type || '').toLowerCase()}`}>
              {cb.type || 'UNKNOWN'}
            </span>
            <span className={cb.isSignatureValid ? 'sig-valid' : 'sig-invalid'}>
              {cb.isSignatureValid ? '✓ Signature Valid' : '⚠ Signature Invalid'}
            </span>
            <span className="text-xs text-muted">
              {cb.timestamp ? new Date(cb.timestamp).toLocaleString('id-ID') : ''}
            </span>
          </div>

          {/* Path */}
          <div className="text-xs text-muted mb-4">
            Path: <span className="font-mono">{cb.path}</span>
          </div>

          {/* Body */}
          <div className="card-title" style={{ marginBottom: 8 }}>Payload</div>
          <div className="response-body" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
            <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(cb.body, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
