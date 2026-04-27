import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import DeleteUserButton from './DeleteUserButton';
import type { AdminUserListResponse } from '@/types/admin';

interface Props {
  data: AdminUserListResponse;
  currentSkip: number;
  take: number;
  searchParams: Record<string, string>;
}

export default function AdminUserTable({ data, currentSkip, take, searchParams }: Props) {
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
              <th className="text-left px-4 py-3 font-medium">이름</th>
              <th className="text-left px-4 py-3 font-medium">이메일</th>
              <th className="text-left px-4 py-3 font-medium">역할</th>
              <th className="text-left px-4 py-3 font-medium">참여 모임</th>
              <th className="text-left px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                  유저가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium hover:underline"
                    >
                      {user.name ?? '(이름 없음)'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{user._count.roomMembers}개</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteUserButton userId={user.id} userName={user.name} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>전체 {total.toLocaleString()}명</span>
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
