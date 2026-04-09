import Banner from '@/components/Banner';
import CategoryFilter from '@/components/CategoryFilter';
import RoomCard from '@/components/RoomCard';
import { bannerControllerFindAll, roomsControllerFindAllGroupRooms } from '@/generated/openapi-client';
import type { RoomsControllerFindAllGroupRoomsData } from '@/generated/openapi-client';
import Link from 'next/link';

const PAGE_SIZE = 15;

interface HomeProps {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { page: pageParam, category, search } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const skip = (page - 1) * PAGE_SIZE;

  const [{ data: banners }, { data: rooms }] = await Promise.all([
    bannerControllerFindAll(),
    roomsControllerFindAllGroupRooms({
      query: {
        skip,
        take: PAGE_SIZE + 1,
        ...(category && { category: category as NonNullable<RoomsControllerFindAllGroupRoomsData['query']>['category'] }),
        ...(search && { search }),
      },
    }),
  ]);

  // PAGE_SIZE + 1개를 가져와서 다음 페이지 존재 여부 확인
  const hasNext = (rooms?.length ?? 0) > PAGE_SIZE;
  const displayRooms = rooms?.slice(0, PAGE_SIZE) ?? [];

  return (
    <div>
      <Banner banners={banners ?? []} />
      <CategoryFilter />

      {/* 방 목록 */}
      <section className="px-12 pb-12">
        {displayRooms.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">모임이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-5 gap-6">
            {displayRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {(page > 1 || hasNext) && (
          <div className="flex justify-center items-center gap-4 mt-10">
            {page > 1 ? (
              <Link
                href={`?${new URLSearchParams({ ...(category && { category }), ...(search && { search }), page: String(page - 1) })}`}
                className="px-5 py-2 border border-border rounded-full text-sm hover:bg-muted transition-colors"
              >
                이전
              </Link>
            ) : (
              <span className="px-5 py-2 text-sm text-muted-foreground">이전</span>
            )}

            <span className="text-sm font-medium">{page}</span>

            {hasNext ? (
              <Link
                href={`?${new URLSearchParams({ ...(category && { category }), ...(search && { search }), page: String(page + 1) })}`}
                className="px-5 py-2 border border-border rounded-full text-sm hover:bg-muted transition-colors"
              >
                다음
              </Link>
            ) : (
              <span className="px-5 py-2 text-sm text-muted-foreground">다음</span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
