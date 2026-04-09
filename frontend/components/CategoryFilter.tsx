'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Dumbbell, UtensilsCrossed, Plane, Palette, Drama, Laptop, LayoutGrid } from 'lucide-react';

const CATEGORIES = [
  { key: 'STUDY', label: '스터디', icon: BookOpen },
  { key: 'SPORTS', label: '스포츠', icon: Dumbbell },
  { key: 'FOOD', label: '맛집', icon: UtensilsCrossed },
  { key: 'TRAVEL', label: '여행', icon: Plane },
  { key: 'HOBBY', label: '취미', icon: Palette },
  { key: 'CULTURE', label: '문화/예술', icon: Drama },
  { key: 'TECH', label: 'IT/기술', icon: Laptop },
  { key: 'ETC', label: '기타', icon: LayoutGrid },
] as const;

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get('category');

  const handleClick = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selected === key) {
      params.delete('category');
    } else {
      params.set('category', key);
    }
    // 카테고리 변경 시 페이지 초기화
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex justify-center gap-8 py-8">
      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            onClick={() => handleClick(key)}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground group-hover:border-foreground'
              }`}
            >
              <Icon className="w-7 h-7" />
            </div>
            <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
