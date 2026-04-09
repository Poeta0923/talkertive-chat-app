import { auth, signOut } from '@/auth';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

export default async function Header() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <header className="relative flex items-center pl-8 pr-0 py-4 border-b border-border">
      <Link href="/" className="text-5xl font-bold tracking-widest shrink-0">
        TALKERTIVE
      </Link>

      <div className="absolute left-1/2 -translate-x-1/2">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center shrink-0">
        {isLoggedIn && (
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium hover:opacity-60 transition-opacity"
            >
              로그아웃
            </button>
          </form>
        )}
        <Link
          href={isLoggedIn ? '/chat' : '/signin'}
          className="shrink-0 px-5 py-2 bg-foreground text-background text-sm font-medium rounded-l-full rounded-r-none hover:opacity-80 transition-opacity"
        >
          {isLoggedIn ? '채팅' : '로그인'}
        </Link>
      </div>
    </header>
  );
}
