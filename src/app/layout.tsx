import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { Suspense } from 'react';
import { SignOutButton } from '@/components/AuthButtons';
import { currentUser } from '@/server/auth';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Influencer View',
  description: 'Campaign briefs, content submissions and brand reviews for creators in Kenya.',
};

async function HeaderNav() {
  const user = await currentUser();
  const links =
    user?.role === 'BRAND'
      ? [{ href: '/review', label: 'Review queue' }]
      : user
        ? [
            { href: '/campaigns', label: 'Campaigns' },
            { href: '/performance', label: 'Performance' },
          ]
        : [];

  return (
    <>
      <nav className="flex flex-1 gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{user.name}</span>
          <SignOutButton />
        </div>
      ) : null}
    </>
  );
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-sm text-white">IV</span>
              Influencer View
            </Link>
            <Suspense fallback={<div className="flex-1" />}>
              <HeaderNav />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          Influencer View is a portfolio project by Brian Ndegwa. Brands and campaigns are sample data.
        </footer>
      </body>
    </html>
  );
}
