import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { adminControllerFindOneRoom } from '@/generated/openapi-client';
import AdminRoomDetail from '@/components/admin/AdminRoomDetail';
import DeleteRoomButton from '@/components/admin/DeleteRoomButton';
import type { AdminRoomDetail as AdminRoomDetailType } from '@/types/admin';

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function AdminRoomDetailPage({ params }: Props) {
  const { roomId } = await params;
  const { data, error } = await adminControllerFindOneRoom({ path: { id: roomId } });

  if (error || !data) return notFound();

  const room = data as AdminRoomDetailType;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/rooms"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          모임 목록
        </Link>
        <DeleteRoomButton roomId={room.id} roomName={room.name} />
      </div>
      <AdminRoomDetail room={room} />
    </div>
  );
}
