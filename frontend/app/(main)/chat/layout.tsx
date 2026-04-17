// (main) layout의 Header 높이(81px)를 제외한 나머지 뷰포트를 채운다
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-[calc(100dvh-81px)] flex flex-col overflow-hidden">{children}</div>;
}
