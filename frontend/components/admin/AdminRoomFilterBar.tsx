'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_LABELS } from '@/types/admin';

const CATEGORIES = Object.keys(CATEGORY_LABELS);

export default function AdminRoomFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('skip');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex gap-3 mb-4">
      <Input
        placeholder="모임 이름 검색"
        defaultValue={searchParams.get('search') ?? ''}
        className="max-w-64"
        onChange={(e) => {
          const value = e.target.value;
          const params = new URLSearchParams(searchParams.toString());
          if (value) {
            params.set('search', value);
          } else {
            params.delete('search');
          }
          params.delete('skip');
          router.replace(`?${params.toString()}`);
        }}
      />
      <Select
        defaultValue={searchParams.get('category') ?? 'ALL'}
        onValueChange={(v) => update('category', v === 'ALL' ? '' : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">전체</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
