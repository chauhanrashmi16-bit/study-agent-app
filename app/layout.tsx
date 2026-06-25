import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Study Agent',
  description: 'A study assistant for concept-based learning.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-background text-slate-100">
      <body>
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-lg font-semibold text-white">
              Study Agent
            </Link>
            <nav className="flex items-center gap-3 text-sm text-slate-400">
              <Link href="/" className="rounded-full border border-transparent px-4 py-2 transition hover:border-slate-700 hover:text-white">
                Chat
              </Link>
              <Link href="/dashboard" className="rounded-full border border-transparent px-4 py-2 transition hover:border-slate-700 hover:text-white">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
