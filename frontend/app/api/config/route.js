import { API_URL } from '@/lib/api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const env = searchParams.get('env') || '';
  const url = `${API_URL}/api/config${env ? `?env=${env}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
