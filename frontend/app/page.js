import StatePanel          from '@/components/shared/StatePanel';
import CallbackLog         from '@/components/shared/CallbackLog';
import DashboardEnvSection from '@/components/dashboard/DashboardEnvSection';
import { API_URL }         from '@/lib/api';

async function getState() {
  try {
    const res = await fetch(`${API_URL}/api/state`, { cache: 'no-store' });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const state = await getState();

  return (
    <div>
      <div className="page-header">
        <h1>◈ Dashboard</h1>
        <p>Monitor status transaksi dan callback terakhir dari Winpay.</p>
      </div>

      <DashboardEnvSection />
      <StatePanel  initialState={state} />
      <CallbackLog initialCallback={state?.lastCallbackReceived} />
    </div>
  );
}

