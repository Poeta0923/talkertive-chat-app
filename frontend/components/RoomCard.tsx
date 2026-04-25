import Image from 'next/image';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import type { Room } from '@/generated/openapi-client';

export default function RoomCard({ room }: { room: Room }) {
  return (
    <Link href={`/rooms/${room.id}`} className="flex flex-col group">
      {/* 커버 이미지 */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center">
        {room.coverImage ? (
          <Image
            src={room.coverImage}
            alt={room.name ?? '채팅방'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ImageOff className="w-10 h-10 text-muted-foreground/40" />
        )}
      </div>

      {/* 텍스트 */}
      <div className="mt-2 px-1">
        <p className="font-semibold text-sm truncate">{room.name}</p>
        {room.shortDescription && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{room.shortDescription}</p>
        )}
      </div>
    </Link>
  );
}
