import Banner from '@/components/Banner';
import CategoryFilter from '@/components/CategoryFilter';
import { bannerControllerFindAll } from '@/generated/openapi-client';

export default async function Home() {
  const { data: banners } = await bannerControllerFindAll();

  return (
    <div>
      <Banner banners={banners ?? []} />
      <CategoryFilter />
    </div>
  );
}
