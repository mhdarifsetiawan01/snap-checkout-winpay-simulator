'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/',         icon: '◈', label: 'Dashboard' },
  { href: '/snap',     icon: '⬡', label: 'SNAP API' },
  { href: '/checkout', icon: '◻', label: 'Checkout Page' },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' });
        setApiOnline(r.ok);
      } catch {
        setApiOnline(false);
      }
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/" className="logo-mark">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            <span className="logo-title">Winpay Sim</span>
            <span className="logo-sub">API Simulator</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${pathname === href ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer — API Status */}
      <div className="sidebar-footer">
        <div className="api-status">
          <div className={`status-dot ${apiOnline === null ? '' : apiOnline ? 'online' : 'offline'}`} />
          <span>
            {apiOnline === null ? 'Checking...' : apiOnline ? 'API Online' : 'API Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
