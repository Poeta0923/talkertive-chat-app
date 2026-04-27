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

export async function createBanner(formData: FormData): Promise<void> {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/media/banners`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('배너 생성에 실패했습니다.');
  revalidatePath('/admin/banners');
}

export async function updateBanner(id: string, formData: FormData): Promise<void> {
  const token = await getSessionToken();
  const file = formData.get('file') as File | null;
  const linkUrl = formData.get('linkUrl') as string;
  const originalLinkUrl = formData.get('originalLinkUrl') as string;

  if (file && file.size > 0) {
    const imageFormData = new FormData();
    imageFormData.append('file', file);
    const res = await fetch(`${API_URL}/media/banners/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: imageFormData,
    });
    if (!res.ok) throw new Error('이미지 교체에 실패했습니다.');
  }

  if (linkUrl !== originalLinkUrl) {
    const res = await fetch(`${API_URL}/banner/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkUrl }),
    });
    if (!res.ok) throw new Error('링크 수정에 실패했습니다.');
  }

  revalidatePath('/admin/banners');
}

export async function deleteBanner(bannerId: string): Promise<void> {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/banner/${bannerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('배너 삭제에 실패했습니다.');
  revalidatePath('/admin/banners');
}
