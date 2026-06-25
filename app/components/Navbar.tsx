"use client";

import Link from 'next/link';

export default function Navbar() {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="text-lg font-semibold text-white">Study Agent</div>
        <nav className="flex items-center gap-3 text-sm text-slate-400">
          <Link href="/" className="rounded-full border border-transparent px-4 py-2 transition hover:border-slate-700 hover:text-white">
            Chat
          </Link>
          <Link href="/dashboard" className="rounded-full border border-transparent px-4 py-2 transition hover:border-slate-700 hover:text-white">
            Dashboard
          </Link>
        </nav>
      </div>
    </div>
  );
}
