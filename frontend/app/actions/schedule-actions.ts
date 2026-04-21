'use server';

import { schedulesControllerFindMySchedules } from '@/generated/openapi-client';

export interface MySchedule {
  id: string;
  roomId: string;
  name: string;
  time: string;
  roomName: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getMySchedules(): Promise<MySchedule[]> {
  const { data, error } = await schedulesControllerFindMySchedules();

  if (error || !data) {
    return [];
  }

  // findMySchedules API는 roomName을 추가 필드로 반환한다 (서비스 레이어에서 room.name을 flatten)
  return data as unknown as MySchedule[];
}
