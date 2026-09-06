'use client';
import { usePathname } from 'next/navigation';
import { useEnv } from '@/lib/useEnv';

const pageTitles = {
  '/':         { icon: '◈', title: 'Dashboard',     sub: 'Overview & Status' },
  '/snap':     { icon: '⬡', title: 'SNAP API',       sub: 'VA · QRIS · eWallet' },
  '/checkout': { icon: '◻', title: 'Checkout Page',  sub: 'Invoice Management' },
};

export default function Header() {
  const pathname = usePathname();
  const [env, setEnv, isMounted] = useEnv('development');
  const page = pageTitles[pathname] || pageTitles['/'];

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
        </div>
      )}
    </header>
  );
}

