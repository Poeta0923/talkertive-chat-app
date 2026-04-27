import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import DeleteRoomButton from './DeleteRoomButton';
import { CATEGORY_LABELS } from '@/types/admin';
import type { AdminRoomListResponse } from '@/types/admin';

interface Props {
  data: AdminRoomListResponse;
  currentSkip: number;
  take: number;
  searchParams: Record<string, string>;
}

export default function AdminRoomTable({ data, currentSkip, take, searchParams }: Props) {
  const { items, total } = data;
  const hasPrev = currentSkip > 0;
  const hasNext = currentSkip + take < total;

  function buildPageHref(skip: number) {
    const params = new URLSearchParams(searchParams);
    params.set('skip', String(skip));
    return `?${params.toString()}`;
  }

  return (
    <div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">모임 이름</th>
              <th className="text-left px-4 py-3 font-medium">카테고리</th>
              <th className="text-left px-4 py-3 font-medium">방장</th>
              <th className="text-left px-4 py-3 font-medium">멤버</th>
              <th className="text-left px-4 py-3 font-medium">모임 일정</th>
              <th className="text-left px-4 py-3 font-medium">생성일</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                  모임이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((room) => {
                const owner = room.members.find((m) => m.role === 'OWNER');
                return (
                  <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/rooms/${room.id}`}
                        className="font-medium hover:underline"
                      >
                        {room.name ?? '(이름 없음)'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {room.category ? (
                        <Badge variant="outline">
                          {CATEGORY_LABELS[room.category] ?? room.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {owner?.user.name ?? '-'}
                    </td>
                    <td className="px-4 py-3">{room._count.members}명</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {room.date
                        ? new Date(room.date).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(room.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteRoomButton roomId={room.id} roomName={room.name} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>전체 {total.toLocaleString()}개</span>
        <div className="flex gap-2">
          {hasPrev ? (
            <Link
              href={buildPageHref(Math.max(0, currentSkip - take))}
              className="px-3 py-1 border border-border rounded hover:bg-muted transition-colors"
            >
              이전
            </Link>
          ) : (
            <span className="px-3 py-1 text-muted-foreground/50">이전</span>
          )}
          {hasNext ? (
            <Link
              href={buildPageHref(currentSkip + take)}
              className="px-3 py-1 border border-border rounded hover:bg-muted transition-colors"
            >
              다음
            </Link>
          ) : (
            <span className="px-3 py-1 text-muted-foreground/50">다음</span>
          )}
        </div>
      </div>
    </div>
  );
}
