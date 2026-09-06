'use client';
import { ENV_OPTIONS } from '@/lib/useEnv';

export default function EnvSwitcher({ env, setEnv }) {
  return (
    <div className="flex items-center gap-3 mb-6" style={{ marginBottom: 24 }}>
      <span className="text-sm text-muted">Environment:</span>
      <div className="flex items-center gap-2">
        {ENV_OPTIONS.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => setEnv(e)}
            className={`env-badge ${e === 'production' ? 'production' : e === 'sandbox' ? 'sandbox' : 'dev'}`}
            style={{
              opacity: env === e ? 1 : 0.45,
              cursor: 'pointer',
              fontWeight: env === e ? '700' : '500',
              transform: env === e ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.2s ease',
              boxShadow: env === e ? '0 0 10px rgba(99, 102, 241, 0.25)' : 'none',
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
