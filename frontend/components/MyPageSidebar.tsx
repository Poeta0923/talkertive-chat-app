'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '내 정보', href: '/mypage' },
  { label: '소속중인 모임', href: '/mypage/joined' },
  { label: '주관중인 모임', href: '/mypage/owned' },
];

export default function MyPageSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border px-6 py-10 shrink-0">
      <h1 className="text-2xl font-bold mb-8">마이페이지</h1>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
