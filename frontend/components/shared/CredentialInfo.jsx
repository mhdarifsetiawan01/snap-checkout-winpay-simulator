'use client';
import { useState, useEffect } from 'react';
import { useCustomPartnerId, useCustomCheckoutCredentials } from '@/lib/useEnv';

export default function CredentialInfo({ env }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [customPartnerId, setCustomPartnerId] = useCustomPartnerId();
  const [customCheckout, setCustomCheckout] = useCustomCheckoutCredentials();
  
  const [isEditingPartnerId, setIsEditingPartnerId] = useState(false);
  const [tempPartnerId, setTempPartnerId] = useState('');

  const [isEditingCheckout, setIsEditingCheckout] = useState(false);
  const [tempClientKey, setTempClientKey] = useState('');
  const [tempSecretKey, setTempSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);

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

  const handleStartEditPartnerId = () => {
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

  const handleStartEditCheckout = () => {
    setTempClientKey(customCheckout.clientKey || config?.checkout?.clientKey || '');
    setTempSecretKey(customCheckout.secretKey || config?.checkout?.secretKey || '');
    setIsEditingCheckout(true);
  };

  const handleSaveCustomCheckout = (e) => {
    e?.preventDefault();
    setCustomCheckout(tempClientKey.trim(), tempSecretKey.trim());
    setIsEditingCheckout(false);
  };

  const handleResetCheckout = () => {
    setCustomCheckout('', '');
    setIsEditingCheckout(false);
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
  const isCustomSnapActive = Boolean(customPartnerId && customPartnerId !== config.snap.partnerId);

  const activeCheckoutClientKey = customCheckout.clientKey || config.checkout.clientKey;
  const activeCheckoutSecretKey = customCheckout.secretKey || config.checkout.secretKey;
  const isCustomCheckoutActive = Boolean(
    (customCheckout.clientKey && customCheckout.clientKey !== config.checkout.clientKey) ||
    (customCheckout.secretKey && customCheckout.secretKey !== config.checkout.secretKey)
  );

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
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize: '15px' }}>🔐</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
            Active Credentials ({env})
          </span>
          {isCustomSnapActive && (
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
              CUSTOM SNAP PARTNER-ID
            </span>
          )}
          {isCustomCheckoutActive && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(192, 132, 252, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                fontWeight: 600,
              }}
            >
              CUSTOM CHECKOUT CREDENTIALS
            </span>
          )}
          {config.ipWhitelist && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: config.ipWhitelist.enabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                color: config.ipWhitelist.enabled ? '#4ade80' : '#94a3b8',
                border: `1px solid ${config.ipWhitelist.enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                fontWeight: 600,
              }}
            >
              {config.ipWhitelist.enabled ? `🛡️ WHITELIST ACTIVE (${config.ipWhitelist.allowedIpsCount} IP)` : '🌐 WHITELIST OFF'}
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
            border: isCustomSnapActive ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              SNAP X-PARTNER-ID {isCustomSnapActive ? '(Custom)' : '(Default .env)'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleStartEditPartnerId}
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
              {isCustomSnapActive && (
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
                color: isCustomSnapActive ? '#facc15' : '#38bdf8',
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

        {/* Checkout Client Key & Secret Key */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '10px 12px',
            borderRadius: 8,
            border: isCustomCheckoutActive ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              CHECKOUT CREDENTIALS {isCustomCheckoutActive ? '(Custom)' : '(Default .env)'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleStartEditCheckout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818cf8',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 5px',
                }}
                title="Ganti Client Key & Secret Key Checkout"
              >
                ✏️ Ubah
              </button>
              {isCustomCheckoutActive && (
                <button
                  type="button"
                  onClick={handleResetCheckout}
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
            </div>
          </div>

          {isEditingCheckout ? (
            <form onSubmit={handleSaveCustomCheckout} style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 6 }}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>
                  Client Key (X-Winpay-Key)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tempClientKey}
                  onChange={e => setTempClientKey(e.target.value)}
                  placeholder="Masukkan custom Client Key..."
                  style={{ fontSize: '11px', padding: '6px 8px' }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>
                  Secret Key
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tempSecretKey}
                  onChange={e => setTempSecretKey(e.target.value)}
                  placeholder="Masukkan custom Secret Key..."
                  style={{ fontSize: '11px', padding: '6px 8px' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                  Simpan
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditingCheckout(false)}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Client Key */}
              <div style={{ marginTop: 4 }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted" style={{ fontSize: '10px' }}>
                    Client Key (X-Winpay-Key):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeCheckoutClientKey, 'clientKey')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedKey === 'clientKey' ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '1px 4px',
                    }}
                  >
                    {copiedKey === 'clientKey' ? '✓' : '📋'}
                  </button>
                </div>
                <div
                  className="text-mono"
                  style={{
                    fontSize: '11px',
                    color: isCustomCheckoutActive ? '#c084fc' : '#a78bfa',
                    wordBreak: 'break-all',
                    fontWeight: 500,
                  }}
                >
                  {activeCheckoutClientKey || '—'}
                </div>
              </div>

              {/* Secret Key */}
              <div style={{ marginTop: 6 }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted" style={{ fontSize: '10px' }}>
                    Secret Key:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '1px 4px',
                      }}
                      title={showSecretKey ? 'Sembunyikan Secret Key' : 'Tampilkan Secret Key'}
                    >
                      {showSecretKey ? '🙈 Sembunyikan' : '👁️ Tampilkan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeCheckoutSecretKey, 'secretKey')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedKey === 'secretKey' ? '#10b981' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '1px 4px',
                      }}
                    >
                      {copiedKey === 'secretKey' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
                <div
                  className="text-mono"
                  style={{
                    fontSize: '11px',
                    color: showSecretKey ? '#ec4899' : 'var(--text-muted)',
                    wordBreak: 'break-all',
                    fontWeight: 500,
                  }}
                >
                  {showSecretKey
                    ? (activeCheckoutSecretKey || '—')
                    : (activeCheckoutSecretKey && activeCheckoutSecretKey !== '—'
                        ? '••••••••••••••••••••••••••••••••'
                        : '—')}
                </div>
              </div>
            </>
          )}

          <div className="text-xs text-muted" style={{ marginTop: 6, fontSize: '11px' }}>
            URL: <span className="text-mono" style={{ color: 'var(--text-secondary)' }}>{config.checkout.baseUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

