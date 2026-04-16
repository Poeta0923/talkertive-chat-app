'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RoomCategory, UpdateGroupRoomDto } from '@/generated/openapi-client';
import { updateGroupRoom, uploadRoomCover } from './actions';

const CATEGORY_LABEL: Record<RoomCategory, string> = {
  STUDY: '스터디',
  SPORTS: '스포츠',
  FOOD: '맛집',
  TRAVEL: '여행',
  HOBBY: '취미',
  CULTURE: '문화/예술',
  TECH: 'IT/기술',
  ETC: '기타',
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as RoomCategory[];

interface Props {
  roomId: string;
  initialData: {
    name: string | null;
    description: string | null;
    shortDescription: string | null;
    memberLimit: number | null;
    category: RoomCategory | null;
    address: string | null;
    date: string | null;
    coverImage: string | null;
  };
}

export default function GroupRoomEditor({ roomId, initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [coverImage, setCoverImage] = useState(initialData.coverImage ?? null);
  const [name, setName] = useState(initialData.name ?? '');
  const [description, setDescription] = useState(initialData.description ?? '');
  const [shortDescription, setShortDescription] = useState(initialData.shortDescription ?? '');
  const [memberLimit, setMemberLimit] = useState(initialData.memberLimit?.toString() ?? '');
  const [category, setCategory] = useState<RoomCategory | ''>(initialData.category ?? '');
  const [address, setAddress] = useState(initialData.address ?? '');
  const [date, setDate] = useState(
    initialData.date ? new Date(initialData.date).toISOString().slice(0, 16) : '',
  );

  const handleCoverImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const url = await uploadRoomCover(roomId, formData);
      setCoverImage(url);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const body: UpdateGroupRoomDto = {
        name: name || undefined,
        description: description || undefined,
        shortDescription: shortDescription || undefined,
        memberLimit: memberLimit ? parseInt(memberLimit, 10) : undefined,
        category: category || undefined,
        address: address || undefined,
        date: date ? new Date(date).toISOString() : undefined,
      };
      await updateGroupRoom(roomId, body);
      router.push(`/rooms/${roomId}`);
      router.refresh();
    } catch {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">모임 정보 수정</h1>

      <div className="flex flex-col gap-6">
        {/* 커버 이미지 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">커버 이미지</label>
          <div
            onClick={handleCoverImageClick}
            className="relative w-full aspect-5/1 bg-muted rounded-lg overflow-hidden cursor-pointer group"
          >
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="커버 이미지" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                이미지 없음
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                수정하기
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* 모임 이름 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">모임 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>

        {/* 한 줄 소개 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">한 줄 소개</label>
          <input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={150}
            placeholder="목록에서 표시될 짧은 소개"
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>

        {/* 상세 설명 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">상세 설명 (마크다운 지원)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder="모임에 대한 상세한 설명을 입력하세요"
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
          />
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RoomCategory | '')}
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground bg-background"
          >
            <option value="">선택 안 함</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        {/* 최대 인원 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">최대 인원</label>
          <input
            type="number"
            value={memberLimit}
            onChange={(e) => setMemberLimit(e.target.value)}
            min={2}
            placeholder="비워두면 무제한"
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>

        {/* 장소 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">모임 장소</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="장소 주소"
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>

        {/* 모임 일정 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">모임 일정</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 mt-10">
        <button
          onClick={handleSave}
          disabled={isLoading || !name.trim()}
          className="px-6 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? '저장 중...' : '저장하기'}
        </button>
        <button
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-6 py-2 border border-border text-sm font-medium rounded-md hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}
