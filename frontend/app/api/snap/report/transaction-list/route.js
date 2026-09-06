import { API_URL, getForwardHeaders } from '@/lib/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/api/snap/report/transaction-list`, {
      method: 'POST',
      headers: getForwardHeaders(request),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
