import { auth } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  const { name, email, image } = session.user;

  return (
    <div className="flex items-start gap-16">
      {/* 프로필 이미지 */}
      <Avatar className="w-36 h-36 shrink-0">
        <AvatarImage src={image ?? undefined} alt={name ?? '프로필'} />
        <AvatarFallback>
          <UserRound className="w-16 h-16 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      {/* 이름 + 이메일 */}
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-xl font-semibold">{name}</span>
        <span className="text-muted-foreground underline">{email}</span>
      </div>

      {/* 수정하기 버튼 */}
      <button className="px-5 py-2 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-80 transition-opacity cursor-pointer shrink-0">
        수정하기
      </button>
    </div>
  );
}
