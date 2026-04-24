import { auth } from '@/auth';
import { roomsControllerFindOneGroupRoom } from '@/generated/openapi-client';
import { notFound, redirect } from 'next/navigation';
import GroupRoomEditor from './GroupRoomEditor';

interface EditRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const { roomId } = await params;

  const [{ data: room, error }, session] = await Promise.all([
    roomsControllerFindOneGroupRoom({ path: { roomId } }),
    auth(),
  ]);

  if (error || !room) {
    notFound();
  }

  const owner = room.members.find((m) => m.role === 'OWNER');
  const isOwner = session?.user?.id === owner?.user.id;

  // OWNER가 아닌 사람이 직접 URL로 접근하는 경우 상세 페이지로 돌려보냄
  if (!isOwner) {
    redirect(`/rooms/${roomId}`);
  }

  return (
    <GroupRoomEditor
      roomId={roomId}
      initialData={{
        name: room.name ?? null,
        description: room.description ?? null,
        shortDescription: room.shortDescription ?? null,
        memberLimit: room.memberLimit ?? null,
        category: room.category ?? null,
        address: room.address ?? null,
        date: room.date ?? null,
        coverImage: room.coverImage ?? null,
        profileImage: room.profileImage ?? null,
      }}
    />
  );
}
