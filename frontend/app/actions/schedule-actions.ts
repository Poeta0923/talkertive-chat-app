'use server';

import {
  schedulesControllerCreateSchedule,
  schedulesControllerDeleteSchedule,
  schedulesControllerFindMySchedules,
  schedulesControllerFindRoomSchedules,
  schedulesControllerUpdateSchedule,
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

export async function createSchedule(
  roomId: string,
  name: string,
  time: string,
): Promise<RoomSchedule | null> {
  const { data, error } = await schedulesControllerCreateSchedule({
    path: { roomId },
    body: { name, time },
  });

  if (error || !data) {
    return null;
  }

  return data as unknown as RoomSchedule;
}

export async function deleteSchedule(roomId: string, scheduleId: string): Promise<boolean> {
  const { error } = await schedulesControllerDeleteSchedule({
    path: { roomId, scheduleId },
  });

  return !error;
}

export async function updateSchedule(
  roomId: string,
  scheduleId: string,
  name: string,
  time: string,
): Promise<RoomSchedule | null> {
  const { data, error } = await schedulesControllerUpdateSchedule({
    path: { roomId, scheduleId },
    body: { name, time },
  });

  if (error || !data) {
    return null;
  }

  return data as unknown as RoomSchedule;
}
