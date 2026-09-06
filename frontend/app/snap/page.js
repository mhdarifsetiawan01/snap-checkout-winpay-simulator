'use client';
import { useState } from 'react';
import CreateVAForm      from '@/components/snap/CreateVAForm';
import CreateQRISForm    from '@/components/snap/CreateQRISForm';
import CreateEwalletForm from '@/components/snap/CreateEwalletForm';
import InquiryPanel      from '@/components/snap/InquiryPanel';

const TABS = [
  { id: 'va',       label: '🏦 Virtual Account' },
  { id: 'qris',     label: '▣ QRIS' },
  { id: 'ewallet',  label: '◈ eWallet' },
  { id: 'inquiry',  label: '🔍 Inquiry & Status' },
];

const ENV_OPTIONS = ['development', 'sandbox', 'production'];

export default function SnapPage() {
  const [activeTab, setActiveTab] = useState('va');
  const [env, setEnv] = useState('development');

  return (
    <div>
      <div className="page-header">
        <h1>⬡ SNAP API</h1>
        <p>Simulate Virtual Account, QRIS, dan eWallet payment via SNAP BI standard.</p>
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

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="two-col">
        <div className="card">
          {activeTab === 'va'      && <CreateVAForm      env={env} />}
          {activeTab === 'qris'    && <CreateQRISForm    env={env} />}
          {activeTab === 'ewallet' && <CreateEwalletForm env={env} />}
          {activeTab === 'inquiry' && <InquiryPanel      env={env} />}
        </div>

        {/* Tips panel kanan */}
        <div>
          <div className="card">
            <div className="card-title">💡 Info</div>
            {activeTab === 'va' && (
              <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 2 }}>
                <li>VA Number akan disimpan otomatis ke db.json</li>
                <li>Gunakan tab <b>Inquiry & Status</b> untuk cek setelah transaksi</li>
                <li>Channel INDOMARET: gunakan <b>customerNo</b>, bukan VA number</li>
              </ul>
            )}
            {activeTab === 'qris' && (
              <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 2 }}>
                <li>Response berisi <b>qrContent</b> (string QR code)</li>
                <li>Gunakan QR renderer untuk tampilkan gambar QR</li>
              </ul>
            )}
            {activeTab === 'ewallet' && (
              <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 2 }}>
                <li><b>SPAY</b>: ShopeePay — butuh webRedirectUrl</li>
                <li><b>DANA</b>: DANA — butuh webRedirectUrl</li>
                <li><b>OVO</b>: Push notification ke app OVO</li>
                <li><b>SC</b>: Speedcash</li>
                <li><b>ASTRA</b>: AstraPay</li>
              </ul>
            )}
            {activeTab === 'inquiry' && (
              <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 2 }}>
                <li>Data diambil dari <b>db.json</b> (request terakhir)</li>
                <li>Pastikan sudah ada VA yang berhasil dibuat</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
