import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function CreateRoomCard() {
  return (
    <Link href="/rooms/new" className="flex flex-col group">
      {/* 커버 이미지 영역 — RoomCard와 동일한 크기 */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-dashed border-border flex items-center justify-center group-hover:border-foreground/40 transition-colors">
        <Plus className="w-10 h-10 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </div>

      {/* 텍스트 */}
      <div className="mt-2 px-1">
        <p className="font-semibold text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          새 모임 만들기
        </p>
      </div>
    </Link>
  );
}
