import { API_URL } from '@/lib/api';

export async function GET() {
  const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

