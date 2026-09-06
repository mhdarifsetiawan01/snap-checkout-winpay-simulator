import { API_URL, getForwardHeaders } from '@/lib/api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const url = `${API_URL}/api/checkout/invoice/last${queryString ? `?${queryString}` : ''}`;
  const res = await fetch(url, {
    headers: getForwardHeaders(request),
    cache: 'no-store',
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

