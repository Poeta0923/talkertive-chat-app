'use server';

import {
  schedulesControllerFindMySchedules,
  schedulesControllerFindRoomSchedules,
} from '@/generated/openapi-client';

export interface MySchedule {
  id: string;
  roomId: string;
  name: string;
  time: string;
  roomName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSchedule {
  id: string;
  roomId: string;
  name: string;
  time: string;
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

export async function getRoomSchedules(roomId: string): Promise<RoomSchedule[]> {
  const { data, error } = await schedulesControllerFindRoomSchedules({ path: { roomId } });

  if (error || !data) {
    return [];
  }

  return data as unknown as RoomSchedule[];
}
