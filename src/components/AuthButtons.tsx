'use client';

import { signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

interface DemoAccount {
  key: string;
  label: string;
  description: string;
}

export function SignInButtons({ demoAccounts, google }: { demoAccounts: DemoAccount[]; google: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {demoAccounts.map((account) => (
        <button
          key={account.key}
          type="button"
          disabled={busy !== null}
          onClick={() => {
            setBusy(account.key);
            void signIn('demo', { account: account.key, callbackUrl: '/' });
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-violet-400 hover:shadow disabled:opacity-60"
        >
          <span className="block font-semibold text-slate-900">
            {busy === account.key ? 'Signing in...' : account.label}
          </span>
          <span className="block text-sm text-slate-500">{account.description}</span>
        </button>
      ))}
      {google ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => {
            setBusy('google');
            void signIn('google', { callbackUrl: '/' });
          }}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          Continue with Google
        </button>
      ) : null}
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: '/' })}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    >
      Sign out
    </button>
  );
}
