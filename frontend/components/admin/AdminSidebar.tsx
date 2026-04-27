'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '대시보드', href: '/admin/dashboard' },
  { label: '유저 관리', href: '/admin/users' },
  { label: '모임 관리', href: '/admin/rooms' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border px-6 py-10 shrink-0">
      <h1 className="text-lg font-bold mb-8">관리자</h1>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted'
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
