'use client'

import { logout } from '@/app/actions/auth-actions';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface UserMenuProps {
  name: string;
}

export default function UserMenu({ name }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-5 py-2 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-80 transition-opacity cursor-pointer"
      >
        {name}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <Link
            href="/mypage"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
          >
            마이페이지
          </Link>
          <Link
            href="/chat"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
          >
            내 채팅
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
