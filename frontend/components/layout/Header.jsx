'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useEnv, useCustomPartnerId } from '@/lib/useEnv';

const pageTitles = {
  '/':         { icon: '◈', title: 'Dashboard',     sub: 'Overview & Status' },
  '/snap':     { icon: '⬡', title: 'SNAP API',       sub: 'VA · QRIS · eWallet' },
  '/checkout': { icon: '◻', title: 'Checkout Page',  sub: 'Invoice Management' },
};

export default function Header() {
  const pathname = usePathname();
  const [env, setEnv, isMounted] = useEnv('development');
  const [customPartnerId] = useCustomPartnerId();
  const [defaultPartnerId, setDefaultPartnerId] = useState(null);
  const page = pageTitles[pathname] || pageTitles['/'];

  useEffect(() => {
    if (isMounted) {
      fetch(`/api/config?env=${env}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) setDefaultPartnerId(res.data.snap.partnerId);
        })
        .catch(() => {});
    }
  }, [env, isMounted]);

  const activePartnerId = customPartnerId || defaultPartnerId;
  const isCustom = Boolean(customPartnerId && customPartnerId !== defaultPartnerId);

  return (
    <header className="header">
      <div className="flex items-center gap-3 flex-1">
        <span style={{ fontSize: '18px' }}>{page.icon}</span>
        <div>
          <div className="header-title">{page.title}</div>
          <div className="text-xs text-muted">{page.sub}</div>
        </div>
      </div>

      {isMounted && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Active Env:</span>
          <span className={`env-badge ${env === 'production' ? 'production' : env === 'sandbox' ? 'sandbox' : 'dev'}`}>
            ● {env}
          </span>
          {activePartnerId && (
            <span
              className="text-mono text-xs text-muted"
              style={{
                background: isCustom ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255,255,255,0.04)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: isCustom ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(255,255,255,0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title={`Full X-PARTNER-ID: ${activePartnerId} ${isCustom ? '(Custom)' : '(Default .env)'}`}
            >
              <span style={{ color: isCustom ? '#facc15' : 'var(--text-secondary)' }}>ID:</span>
              <span style={{ color: isCustom ? '#facc15' : '#38bdf8', fontWeight: 600 }}>
                {activePartnerId.length > 12 ? `${activePartnerId.slice(0, 8)}...` : activePartnerId}
              </span>
              {isCustom && <span style={{ fontSize: '9px', color: '#facc15' }}>★</span>}
            </span>
          )}
        </div>
      )}
    </header>
  );
}



