'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminUserFilterBar() {
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
        placeholder="이름 또는 이메일 검색"
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
          // 타이핑 중 매번 push하면 히스토리 과다 생성 — 디바운스 없이 단순 replace 사용
          router.replace(`?${params.toString()}`);
        }}
      />
      <Select
        defaultValue={searchParams.get('role') ?? 'ALL'}
        onValueChange={(v) => update('role', v === 'ALL' ? '' : v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="역할" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">전체</SelectItem>
          <SelectItem value="USER">USER</SelectItem>
          <SelectItem value="ADMIN">ADMIN</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
