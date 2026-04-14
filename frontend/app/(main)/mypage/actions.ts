'use server';

import { getSessionToken } from '@/lib/session-token';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

export async function uploadUserProfile(formData: FormData) {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/media/users/profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다.');
  return res.json() as Promise<{ image: string }>;
}

export async function updateUserProfile(userId: string, body: { name: string; description: string }) {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('프로필 저장에 실패했습니다.');
}
