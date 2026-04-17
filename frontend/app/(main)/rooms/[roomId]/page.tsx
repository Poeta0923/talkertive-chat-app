import { auth } from '@/auth';
import { roomsControllerFindOneGroupRoom } from '@/generated/openapi-client';
import type { RoomCategory } from '@/generated/openapi-client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import InquiryButton from './InquiryButton';

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

interface RoomDetailPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { roomId } = await params;

  const [{ data: room, error }, session] = await Promise.all([
    roomsControllerFindOneGroupRoom({ path: { roomId } }),
    auth(),
  ]);

  if (error || !room) {
    notFound();
  }

  const owner = room.members.find((m) => m.role === 'OWNER');
  const isOwner = session?.user?.id === owner?.user.id;

  return (
    <div>
      {/* 커버 이미지 영역 — 배너 전체 영역(이미지+양측 검정)과 동일한 비율(9:2) */}
      <div className="w-full aspect-9/2 bg-black relative overflow-hidden">
        {room.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.coverImage}
            alt={room.name ?? '모임 커버 이미지'}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 본문 영역 */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">{room.name}</h1>
          {isOwner && (
            <Link
              href={`/rooms/${roomId}/edit`}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors shrink-0"
            >
              수정하기
            </Link>
          )}
        </div>

        {room.description ? (
          <div className="prose prose-neutral max-w-none">
            <ReactMarkdown>{room.description}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-muted-foreground">모임 설명이 없습니다.</p>
        )}

        {/* 모임 정보 박스 */}
        <div className="mt-10 border border-border rounded-lg p-6 flex flex-col gap-4">
          {room.category && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-20 shrink-0">카테고리</span>
              <span className="font-medium">{CATEGORY_LABEL[room.category]}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground w-20 shrink-0">참가 인원</span>
            <span className="font-medium">
              {room.members.filter((m) => !m.leftAt).length}
              {room.memberLimit ? `/${room.memberLimit}` : ''}명
            </span>
          </div>
          {room.address && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-20 shrink-0">장소</span>
              <span className="font-medium">{room.address}</span>
            </div>
          )}
          {room.date && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-20 shrink-0">모임 일정</span>
              <span className="font-medium">
                {new Date(room.date).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* OWNER 정보 박스 */}
        {owner && (
          <div className="mt-4 border border-border rounded-lg px-6 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
              {owner.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={owner.user.image}
                  alt={owner.user.name ?? '방장'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {owner.user.name?.[0] ?? '?'}
                </div>
              )}
            </div>
            <span className="font-medium flex-1">{owner.user.name ?? '알 수 없음'}</span>
            {session && !isOwner && owner && (
              <InquiryButton ownerUserId={owner.user.id} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
