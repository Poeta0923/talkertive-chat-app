import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { adminControllerFindOneUser } from '@/generated/openapi-client';
import AdminUserDetail from '@/components/admin/AdminUserDetail';
import DeleteUserButton from '@/components/admin/DeleteUserButton';
import type { AdminUserDetail as AdminUserDetailType } from '@/types/admin';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params;
  const { data, error } = await adminControllerFindOneUser({ path: { id: userId } });

  if (error || !data) return notFound();

  const user = data as AdminUserDetailType;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          유저 목록
        </Link>
        <DeleteUserButton userId={user.id} userName={user.name} />
      </div>
      <AdminUserDetail user={user} />
    </div>
  );
}
