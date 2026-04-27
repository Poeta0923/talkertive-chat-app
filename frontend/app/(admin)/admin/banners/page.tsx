import BannerCreateDialog from '@/components/admin/BannerCreateDialog';
import BannerEditDialog from '@/components/admin/BannerEditDialog';
import DeleteBannerButton from '@/components/admin/DeleteBannerButton';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  createdAt: string;
}

export default async function AdminBannersPage() {
  const res = await fetch(`${API_URL}/banner`, { cache: 'no-store' });
  const banners: Banner[] = res.ok ? await res.json() : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">배너 관리</h1>
        <BannerCreateDialog />
      </div>

      {banners.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 배너가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-lg border border-border overflow-hidden">
              <img
                src={banner.imageUrl}
                alt="배너 이미지"
                className="w-full h-36 object-cover"
              />
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground truncate" title={banner.linkUrl}>
                  {banner.linkUrl}
                </p>
                <div className="flex justify-end gap-1">
                  <BannerEditDialog banner={banner} />
                  <DeleteBannerButton bannerId={banner.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
