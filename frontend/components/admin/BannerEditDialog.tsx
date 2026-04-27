'use client';

import { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { updateBanner } from '@/app/(admin)/admin/actions';

interface Props {
  banner: { id: string; imageUrl: string; linkUrl: string };
}

export default function BannerEditDialog({ banner }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = fileRef.current?.files?.[0] ?? null;
    const linkUrl = (form.elements.namedItem('linkUrl') as HTMLInputElement).value.trim();

    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('linkUrl', linkUrl);
    formData.append('originalLinkUrl', banner.linkUrl);

    setPending(true);
    try {
      await updateBanner(banner.id, formData);
      setOpen(false);
      setPreview(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
      >
        <Pencil size={15} />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>배너 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">이미지 교체 (선택)</label>
            <img
              src={preview ?? banner.imageUrl}
              alt="배너 이미지"
              className="w-full h-32 object-cover rounded-md border border-border"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-muted file:text-foreground cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-linkUrl" className="text-sm font-medium">링크 URL</label>
            <input
              id="edit-linkUrl"
              name="linkUrl"
              type="url"
              required
              defaultValue={banner.linkUrl}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {pending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
