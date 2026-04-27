import { adminControllerFindAllUsers } from '@/generated/openapi-client';
import AdminUserFilterBar from '@/components/admin/AdminUserFilterBar';
import AdminUserTable from '@/components/admin/AdminUserTable';
import type { AdminUserListResponse } from '@/types/admin';

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ skip?: string; search?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const skip = params.skip ? Number(params.skip) : 0;

  const { data } = await adminControllerFindAllUsers({
    query: {
      skip,
      take: PAGE_SIZE,
      ...(params.search && { search: params.search }),
      ...(params.role && { role: params.role }),
    },
  });

  const listData = (data ?? { items: [], total: 0 }) as AdminUserListResponse;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">유저 관리</h1>
      <AdminUserFilterBar />
      <AdminUserTable
        data={listData}
        currentSkip={skip}
        take={PAGE_SIZE}
        searchParams={params as Record<string, string>}
      />
    </div>
  );
}
