import { API_URL, getForwardHeaders } from '@/lib/api';

export async function GET(request) {
  const res = await fetch(`${API_URL}/api/state`, {
    headers: getForwardHeaders(request),
    cache: 'no-store',
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}


