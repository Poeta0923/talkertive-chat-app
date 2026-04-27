'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteRoom } from '@/app/(admin)/admin/actions';

interface Props {
  roomId: string;
  roomName: string | null;
}

export default function DeleteRoomButton({ roomId, roomName }: Props) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      await deleteRoom(roomId);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
        disabled={pending}
      >
        <Trash2 size={15} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>모임 강제 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{roomName ?? '(이름 없음)'}</strong> 모임을 삭제합니다.
            모든 채팅 메시지, 멤버 이력, 일정이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={pending}
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
