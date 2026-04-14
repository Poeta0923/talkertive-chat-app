import MyPageSidebar from '@/components/MyPageSidebar';

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <MyPageSidebar />
      <main className="flex-1 px-12 py-10">{children}</main>
    </div>
  );
}
