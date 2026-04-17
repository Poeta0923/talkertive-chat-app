import { atom } from 'jotai';

export const chatSidebarOpenAtom = atom(false);

// 사이드바가 열린 뒤 자동으로 열릴 채팅방 ID
// ChatSidebar가 rooms를 불러온 후 해당 방을 찾아 선택하고 이 값을 null로 초기화한다
export const pendingChatRoomIdAtom = atom<string | null>(null);
