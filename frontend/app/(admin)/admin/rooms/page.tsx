import { adminControllerFindAllRooms } from '@/generated/openapi-client';
import AdminRoomFilterBar from '@/components/admin/AdminRoomFilterBar';
import AdminRoomTable from '@/components/admin/AdminRoomTable';
import type { AdminRoomListResponse } from '@/types/admin';
import type { AdminControllerFindAllRoomsData } from '@/generated/openapi-client';

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ skip?: string; search?: string; category?: string }>;
}

export default async function AdminRoomsPage({ searchParams }: Props) {
  const params = await searchParams;
  const skip = params.skip ? Number(params.skip) : 0;

  type CategoryType = NonNullable<AdminControllerFindAllRoomsData['query']>['category'];

  const { data } = await adminControllerFindAllRooms({
    query: {
      skip,
      take: PAGE_SIZE,
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category as CategoryType }),
    },
  });

  const listData = (data ?? { items: [], total: 0 }) as AdminRoomListResponse;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">모임 관리</h1>
      <AdminRoomFilterBar />
      <AdminRoomTable
        data={listData}
        currentSkip={skip}
        take={PAGE_SIZE}
        searchParams={params as Record<string, string>}
      />
    </div>
  );
}
