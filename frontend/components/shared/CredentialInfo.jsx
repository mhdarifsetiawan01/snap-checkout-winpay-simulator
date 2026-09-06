'use client';
import { useState, useEffect } from 'react';
import { useCustomPartnerId } from '@/lib/useEnv';

export default function CredentialInfo({ env }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [customPartnerId, setCustomPartnerId, isCustomMounted] = useCustomPartnerId();
  const [isEditingPartnerId, setIsEditingPartnerId] = useState(false);
  const [tempPartnerId, setTempPartnerId] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/config?env=${env}`)
      .then(r => r.json())
      .then(res => {
        if (isMounted && res.success) {
          setConfig(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [env]);

  const copyToClipboard = (text, key) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartEdit = () => {
    setTempPartnerId(customPartnerId || config?.snap?.partnerId || '');
    setIsEditingPartnerId(true);
  };

  const handleSaveCustomPartnerId = (e) => {
    e?.preventDefault();
    setCustomPartnerId(tempPartnerId.trim());
    setIsEditingPartnerId(false);
  };

  const handleResetPartnerId = () => {
    setCustomPartnerId('');
    setIsEditingPartnerId(false);
  };

  if (!config && loading) {
    return (
      <div className="card mb-6" style={{ padding: '12px 16px' }}>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="spinner" /> Memuat informasi kredensial...
        </div>
      </div>
    );
  }

  if (!config) return null;

  const activeSnapPartnerId = customPartnerId || config.snap.partnerId;
  const isCustomActive = Boolean(customPartnerId && customPartnerId !== config.snap.partnerId);

  return (
    <div
      className="card mb-6"
      style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(30, 41, 59, 0.4))',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 12,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '15px' }}>🔐</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
            Active Credentials ({env})
          </span>
          {isCustomActive && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                fontWeight: 600,
              }}
            >
              CUSTOM PARTNER-ID ACTIVE
            </span>
          )}
        </div>
        <span
          className={`env-badge ${env === 'production' ? 'production' : env === 'sandbox' ? 'sandbox' : 'dev'}`}
          style={{ fontSize: '11px', padding: '2px 8px' }}
        >
          {env.toUpperCase()}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {/* SNAP Merchant Key / X-PARTNER-ID */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '10px 12px',
            borderRadius: 8,
            border: isCustomActive ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              SNAP X-PARTNER-ID {isCustomActive ? '(Custom)' : '(Default .env)'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleStartEdit}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818cf8',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 5px',
                }}
                title="Ganti X-PARTNER-ID untuk request ini"
              >
                ✏️ Ubah
              </button>
              {isCustomActive && (
                <button
                  type="button"
                  onClick={handleResetPartnerId}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 5px',
                  }}
                  title="Reset kembali ke default .env"
                >
                  ↺ Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => copyToClipboard(activeSnapPartnerId, 'partnerId')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copiedKey === 'partnerId' ? '#10b981' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 5px',
                }}
              >
                {copiedKey === 'partnerId' ? '✓' : '📋 Salin'}
              </button>
            </div>
          </div>

          {isEditingPartnerId ? (
            <form onSubmit={handleSaveCustomPartnerId} style={{ marginTop: 8 }}>
              <input
                type="text"
                className="form-input"
                value={tempPartnerId}
                onChange={e => setTempPartnerId(e.target.value)}
                placeholder="Masukkan custom X-PARTNER-ID..."
                style={{ fontSize: '11px', padding: '6px 8px', marginBottom: 6 }}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                  Simpan
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditingPartnerId(false)}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div
              className="text-mono"
              style={{
                fontSize: '12px',
                color: isCustomActive ? '#facc15' : '#38bdf8',
                marginTop: 4,
                wordBreak: 'break-all',
                fontWeight: 500,
              }}
            >
              {activeSnapPartnerId}
            </div>
          )}

          <div className="text-xs text-muted" style={{ marginTop: 4, fontSize: '11px' }}>
            URL: <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>{config.snap.baseUrl}</span>
          </div>
        </div>

        {/* Checkout Client Key / X-Winpay-Key */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">CHECKOUT X-Winpay-Key</span>
            <button
              type="button"
              onClick={() => copyToClipboard(config.checkout.clientKey, 'clientKey')}
              style={{
                background: 'transparent',
                border: 'none',
                color: copiedKey === 'clientKey' ? '#10b981' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px 6px',
              }}
            >
              {copiedKey === 'clientKey' ? '✓ Disalin' : '📋 Salin'}
            </button>
          </div>
          <div
            className="text-mono"
            style={{
              fontSize: '12px',
              color: '#a78bfa',
              marginTop: 4,
              wordBreak: 'break-all',
              fontWeight: 500,
            }}
          >
            {config.checkout.clientKey}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 4, fontSize: '11px' }}>
            URL: <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>{config.checkout.baseUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
