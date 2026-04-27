import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS } from '@/types/admin';
import type { AdminUserDetail as AdminUserDetailType } from '@/types/admin';

interface Props {
  user: AdminUserDetailType;
}

export default function AdminUserDetail({ user }: Props) {
  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-base font-semibold mb-4">기본 정보</h2>
        <div className="flex items-center gap-4 mb-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? '프로필'}
              width={56}
              height={56}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl text-muted-foreground">
              {user.name?.charAt(0) ?? '?'}
            </div>
          )}
          <div>
            <p className="font-medium text-lg">{user.name ?? '(이름 없음)'}</p>
            <p className="text-sm text-muted-foreground">{user.email ?? '-'}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">역할</dt>
            <dd className="mt-0.5">
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">가입일</dt>
            <dd className="mt-0.5">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</dd>
          </div>
          {user.description && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">자기소개</dt>
              <dd className="mt-0.5">{user.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 주관 모임 */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-base font-semibold mb-4">
          주관 중인 모임 <span className="text-muted-foreground font-normal">({user.ownedRooms.length})</span>
        </h2>
        {user.ownedRooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">없음</p>
        ) : (
          <ul className="divide-y divide-border">
            {user.ownedRooms.map((room) => (
              <li key={room.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link href={`/admin/rooms/${room.id}`} className="font-medium hover:underline">
                    {room.name ?? '(이름 없음)'}
                  </Link>
                  {room.category && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[room.category] ?? room.category}
                    </span>
                  )}
                </div>
                {room.date && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(room.date).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 참가 모임 */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-base font-semibold mb-4">
          참가 중인 모임 <span className="text-muted-foreground font-normal">({user.joinedRooms.length})</span>
        </h2>
        {user.joinedRooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">없음</p>
        ) : (
          <ul className="divide-y divide-border">
            {user.joinedRooms.map((room) => (
              <li key={room.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link href={`/admin/rooms/${room.id}`} className="font-medium hover:underline">
                    {room.name ?? '(이름 없음)'}
                  </Link>
                  {room.category && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[room.category] ?? room.category}
                    </span>
                  )}
                </div>
                {room.date && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(room.date).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
