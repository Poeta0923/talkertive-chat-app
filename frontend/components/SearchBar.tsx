'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useRef } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const value = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    // 검색어 변경 시 페이지 초기화
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 px-4 h-11 border border-border rounded-full w-[40vw]">
      <button
        type="button"
        onClick={handleSearch}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>
      <input
        ref={inputRef}
        type="text"
        defaultValue={searchParams.get('search') ?? ''}
        placeholder="검색어로 그룹을 검색하세요!"
        className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch();
        }}
      />
    </div>
  );
}
