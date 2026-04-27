import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS } from '@/types/admin';
import type { AdminRoomDetail as AdminRoomDetailType } from '@/types/admin';

interface Props {
  room: AdminRoomDetailType;
}

export default function AdminRoomDetail({ room }: Props) {
  return (
    <div className="space-y-6">
      {/* 모임 기본 정보 */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-base font-semibold mb-4">모임 정보</h2>
        {room.coverImage && (
          <div className="relative w-full h-40 rounded-md overflow-hidden mb-4">
            <Image src={room.coverImage} alt="커버" fill className="object-cover" />
          </div>
        )}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">이름</dt>
            <dd className="mt-0.5 font-medium">{room.name ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">카테고리</dt>
            <dd className="mt-0.5">
              {room.category ? (
                <Badge variant="outline">{CATEGORY_LABELS[room.category] ?? room.category}</Badge>
              ) : (
                '-'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">모임 일정</dt>
            <dd className="mt-0.5">
              {room.date ? new Date(room.date).toLocaleString('ko-KR') : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">최대 인원</dt>
            <dd className="mt-0.5">{room.memberLimit ? `${room.memberLimit}명` : '무제한'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">장소</dt>
            <dd className="mt-0.5">{room.address ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">생성일</dt>
            <dd className="mt-0.5">{new Date(room.createdAt).toLocaleDateString('ko-KR')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">메시지 수</dt>
            <dd className="mt-0.5">{room._count.messages.toLocaleString()}개</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">좋아요</dt>
            <dd className="mt-0.5">{room._count.likes.toLocaleString()}개</dd>
          </div>
          {room.shortDescription && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">한 줄 소개</dt>
              <dd className="mt-0.5">{room.shortDescription}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 멤버 목록 */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-base font-semibold mb-4">
          멤버 <span className="text-muted-foreground font-normal">({room.members.length}명)</span>
        </h2>
        {room.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">멤버 없음</p>
        ) : (
          <ul className="divide-y divide-border">
            {room.members.map((member) => (
              <li key={member.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {member.user.image ? (
                    <Image
                      src={member.user.image}
                      alt={member.user.name ?? ''}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {member.user.name?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div>
                    <Link href={`/admin/users/${member.user.id}`} className="text-sm font-medium hover:underline">
                      {member.user.name ?? '(이름 없음)'}
                    </Link>
                    <p className="text-xs text-muted-foreground">{member.user.email ?? ''}</p>
                  </div>
                </div>
                <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 일정 목록 */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-base font-semibold mb-4">
          일정 <span className="text-muted-foreground font-normal">({room.schedules.length}개)</span>
        </h2>
        {room.schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">일정 없음</p>
        ) : (
          <ul className="divide-y divide-border">
            {room.schedules.map((schedule) => (
              <li key={schedule.id} className="py-3 flex items-center justify-between">
                <span className="text-sm font-medium">{schedule.name}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(schedule.time).toLocaleString('ko-KR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
