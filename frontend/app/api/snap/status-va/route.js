import { API_URL, getForwardHeaders } from '@/lib/api';

export async function POST(request) {
  const body = await request.json();
  const res = await fetch(`${API_URL}/api/snap/status-va`, {
    method: 'POST',
    headers: getForwardHeaders(request),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}


