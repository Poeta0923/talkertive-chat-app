'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RoomCategory } from '@/generated/openapi-client';
import { createGroupRoom, uploadRoomCover, uploadRoomProfile } from './actions';

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

export default function GroupRoomCreator() {
  const router = useRouter();
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [memberLimit, setMemberLimit] = useState('');
  const [category, setCategory] = useState<RoomCategory | ''>('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');

  const handleCoverImageClick = () => {
    coverFileInputRef.current?.click();
  };

  const handleProfileImageClick = (e: React.MouseEvent) => {
    // 커버 클릭 이벤트가 위로 전파되지 않도록 막는다
    e.stopPropagation();
    profileFileInputRef.current?.click();
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      // 1단계: 방 생성
      const roomId = await createGroupRoom({
        name,
        description: description || undefined,
        shortDescription: shortDescription || undefined,
        memberLimit: memberLimit ? parseInt(memberLimit, 10) : undefined,
        category: category || undefined,
        address: address || undefined,
        date: date ? new Date(date).toISOString() : undefined,
      });

      // 2단계: 이미지가 선택된 경우 업로드
      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        await uploadRoomCover(roomId, formData);
      }
      if (profileFile) {
        const formData = new FormData();
        formData.append('file', profileFile);
        await uploadRoomProfile(roomId, formData);
      }

      router.push(`/rooms/${roomId}`);
      router.refresh();
    } catch {
      alert('모임 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">모임 만들기</h1>

      <div className="flex flex-col gap-6">
        {/* 커버 이미지 + 프로필 이미지 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">커버 이미지</label>
          {/* overflow-hidden을 커버에만 적용하고, 바깥 wrapper를 relative로 두어 프로필 원이 잘리지 않게 한다 */}
          <div className="relative pb-5">
            <div
              onClick={handleCoverImageClick}
              className="relative w-full aspect-5/1 bg-muted rounded-lg overflow-hidden cursor-pointer group"
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="커버 이미지" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                  이미지 없음
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  이미지 선택
                </span>
              </div>
            </div>

            {/* 프로필 이미지 — 커버 좌하단에 원형으로 오버레이 */}
            <div
              onClick={handleProfileImageClick}
              className="absolute bottom-0 left-4 w-16 h-16 rounded-full overflow-hidden ring-2 ring-background bg-muted cursor-pointer group/profile flex items-center justify-center z-10"
            >
              {profilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePreview}
                  alt="프로필 이미지"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium text-muted-foreground">
                  {name[0] ?? '?'}
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover/profile:bg-black/40 transition-colors flex items-center justify-center rounded-full">
                <span className="text-white text-[10px] font-medium opacity-0 group-hover/profile:opacity-100 transition-opacity text-center leading-tight">
                  선택
                </span>
              </div>
            </div>
          </div>
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverFileChange}
          />
          <input
            ref={profileFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileFileChange}
          />
        </div>

        {/* 모임 이름 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">모임 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="모임 이름을 입력하세요"
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
          onClick={handleCreate}
          disabled={isLoading || !name.trim()}
          className="px-6 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? '생성 중...' : '만들기'}
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
