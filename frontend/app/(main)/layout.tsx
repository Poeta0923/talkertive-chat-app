import Header from '@/components/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <footer className="mt-auto py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Talkertive. All rights reserved.</p>
        <p>
          <a href="mailto:gimgwangsu0@gmail.com" className="hover:text-gray-600">
            gimgwangsu0@gmail.com
          </a>
        </p>
      </footer>
    </>
  );
}
