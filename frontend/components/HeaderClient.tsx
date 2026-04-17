'use client';

import { useAtom } from 'jotai';
import UserMenu from './UserMenu';
import ChatSidebar from './ChatSidebar';
import { chatSidebarOpenAtom } from '@/store/chatSidebar';

interface HeaderClientProps {
  userId: string | undefined;
  userName: string;
}

export default function HeaderClient({ userId, userName }: HeaderClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(chatSidebarOpenAtom);

  return (
    <>
      <UserMenu name={userName} onChatClick={() => setIsSidebarOpen(true)} />
      <ChatSidebar
        currentUserId={userId}
        currentUserName={userName}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}
