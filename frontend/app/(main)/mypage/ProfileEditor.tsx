'use client';

import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound } from 'lucide-react';
import { uploadUserProfile, updateUserProfile } from './actions';

interface Props {
  initialUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    description?: string | null;
  };
}

export default function ProfileEditor({ initialUser }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(initialUser.name ?? '');
  const [description, setDescription] = useState(initialUser.description ?? '');
  const [image, setImage] = useState(initialUser.image ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const data = await uploadUserProfile(formData);
      setImage(data.image);
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile(initialUser.id, { name, description });
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-16">
      {/* 프로필 이미지 */}
      <div className="relative shrink-0" onClick={handleImageClick}>
        <Avatar className={`w-36 h-36 ${isEditing ? 'cursor-pointer' : ''}`}>
          <AvatarImage src={image ?? undefined} alt={name || '프로필'} />
          <AvatarFallback>
            <UserRound className="w-16 h-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        {isEditing && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="text-white text-xs font-medium">사진 변경</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 이름 + 이메일 + 자기소개 */}
      <div className="flex flex-col gap-2 flex-1">
        {isEditing ? (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="text-xl font-semibold bg-transparent border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <span className="text-muted-foreground underline">{initialUser.email}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="자기소개를 입력하세요"
              maxLength={150}
              rows={2}
              className="text-sm text-muted-foreground bg-transparent border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-foreground resize-none mt-1"
            />
          </>
        ) : (
          <>
            <span className="text-xl font-semibold">{name}</span>
            <span className="text-muted-foreground underline">{initialUser.email}</span>
            {description && (
              <span className="text-sm text-muted-foreground mt-1">{description}</span>
            )}
          </>
        )}
      </div>

      {/* 수정하기 / 저장하기 버튼 */}
      <button
        onClick={isEditing ? handleSave : () => setIsEditing(true)}
        disabled={isLoading}
        className="px-5 py-2 bg-foreground text-background text-sm font-medium rounded-full hover:opacity-80 transition-opacity cursor-pointer shrink-0 disabled:opacity-50"
      >
        {isEditing ? '저장하기' : '수정하기'}
      </button>
    </div>
  );
}
