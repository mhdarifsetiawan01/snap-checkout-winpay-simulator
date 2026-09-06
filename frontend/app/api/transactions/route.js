import { API_URL, getForwardHeaders } from '@/lib/api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const limit = searchParams.get('limit') || '10';

  const res = await fetch(`${API_URL}/api/transactions?category=${category}&limit=${limit}`, {
    headers: getForwardHeaders(request),
    cache: 'no-store',
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
