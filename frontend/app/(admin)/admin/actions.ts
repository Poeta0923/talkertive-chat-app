'use server';

import { getSessionToken } from '@/lib/session-token';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

export async function deleteUser(userId: string): Promise<void> {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('유저 삭제에 실패했습니다.');
  revalidatePath('/admin/users');
}

export async function deleteRoom(roomId: string): Promise<void> {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/admin/rooms/${roomId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('모임 삭제에 실패했습니다.');
  revalidatePath('/admin/rooms');
}
