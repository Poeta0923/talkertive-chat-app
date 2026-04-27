'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createBanner } from '@/app/(admin)/admin/actions';

export default function BannerCreateDialog() {
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
    const file = fileRef.current?.files?.[0];
    const linkUrl = (form.elements.namedItem('linkUrl') as HTMLInputElement).value.trim();

    if (!file || !linkUrl) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('linkUrl', linkUrl);

    setPending(true);
    try {
      await createBanner(formData);
      setOpen(false);
      setPreview(null);
      form.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
        <Plus size={15} />
        배너 추가
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>배너 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">이미지</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-muted file:text-foreground cursor-pointer"
            />
            {preview && (
              <img src={preview} alt="미리보기" className="mt-2 w-full h-32 object-cover rounded-md border border-border" />
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="linkUrl" className="text-sm font-medium">링크 URL</label>
            <input
              id="linkUrl"
              name="linkUrl"
              type="url"
              required
              placeholder="https://example.com"
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
              {pending ? '업로드 중...' : '추가'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
