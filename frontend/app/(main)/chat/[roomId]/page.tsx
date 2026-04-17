import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getSessionToken } from '@/lib/session-token';
import ChatRoom from './ChatRoom';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

interface Member {
  userId: string;
  role: string;
  leftAt: string | null;
  user: { id: string; name: string | null; image: string | null };
}

interface Room {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  coverImage: string | null;
  members: Member[];
}

async function getRoom(roomId: string): Promise<Room | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/rooms/my`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const rooms = (await res.json()) as Room[];
  return rooms.find((r) => r.id === roomId) ?? null;
}

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const [session, room] = await Promise.all([auth(), getRoom(roomId)]);

  if (!session?.user?.id || !room) notFound();

  const currentMember = room.members.find((m) => m.userId === session.user!.id);
  if (!currentMember) notFound();

  // DIRECT: 상대방 이름, GROUP: 방 이름으로 표시
  const roomName =
    room.type === 'DIRECT'
      ? (room.members.find((m) => m.userId !== session.user!.id)?.user.name ?? '알 수 없음')
      : (room.name ?? '(이름 없음)');

  return (
    <ChatRoom
      roomId={roomId}
      roomName={roomName}
      roomType={room.type}
      currentUserId={session.user.id}
      currentUserRole={currentMember.role}
      members={room.members}
    />
  );
}
