'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Banner as BannerType } from '@/generated/openapi-client';

const INTERVAL_MS = 5000;

interface BannerProps {
  banners: BannerType[];
}

export default function Banner({ banners }: BannerProps) {
  const [current, setCurrent] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count]);

  const prev = () => setCurrent((c) => (c - 1 + count) % count);
  const next = () => setCurrent((c) => (c + 1) % count);

  if (count === 0) return null;

  return (
    <div className="w-full bg-black flex justify-center">
      <div className="relative w-2/3 aspect-3/1 overflow-hidden">
        {/* 슬라이드 이미지 */}
        {banners.map((banner, i) => (
          <Link key={banner.id} href={banner.linkUrl} className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
            <Image
              src={banner.imageUrl}
              alt={`배너 ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </Link>
        ))}

        {/* 이전 버튼 */}
        {count > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-black/60 text-white rounded-full hover:bg-black transition-colors z-10"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* 다음 버튼 */}
        {count > 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-black/60 text-white rounded-full hover:bg-black transition-colors z-10"
            aria-label="다음 슬라이드"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* 인디케이터 */}
        {count > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === current ? 'bg-black border border-black' : 'bg-white border border-white'
                }`}
                aria-label={`${i + 1}번 슬라이드`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
