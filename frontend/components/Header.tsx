import { auth } from '@/auth';
import SearchBar from '@/components/SearchBar';
import HeaderClient from '@/components/HeaderClient';
import Link from 'next/link';

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="relative flex items-center pl-8 pr-0 py-4 border-b border-border">
      <Link href="/" className="text-5xl font-bold tracking-widest shrink-0">
        TALKERTIVE
      </Link>

      <div className="absolute left-1/2 -translate-x-1/2">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center shrink-0 pr-8">
        {user ? (
          <HeaderClient userId={user.id} userName={user.name ?? '사용자'} />
        ) : (
          <Link
            href="/signin"
            className="shrink-0 px-5 py-2 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
