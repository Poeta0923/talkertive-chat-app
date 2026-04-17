import { getSessionToken } from '@/lib/session-token';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

export async function GET() {
  const token = await getSessionToken();
  if (!token) return Response.json([], { status: 401 });

  const res = await fetch(`${API_URL}/rooms/my`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return Response.json([], { status: res.status });

  const data = await res.json();
  return Response.json(data);
}
