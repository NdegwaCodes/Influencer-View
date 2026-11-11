import { Suspense } from 'react';
import { PageLoading } from '@/components/PageLoading';
import { redirect } from 'next/navigation';
import { SignInButtons } from '@/components/AuthButtons';
import { currentUser, DEMO_ACCOUNTS, demoLoginEnabled, googleEnabled } from '@/server/auth';

async function HomeContent() {
  const user = await currentUser();
  if (user) {
    redirect(user.role === 'BRAND' ? '/review' : '/campaigns');
  }

  const demoAccounts = demoLoginEnabled
    ? [
        { key: 'creator', label: DEMO_ACCOUNTS.creator.label, description: 'See briefs, submit posts and track earnings' },
        { key: 'brand', label: DEMO_ACCOUNTS.brand.label, description: 'Review submissions and approve or request changes' },
      ]
    : [];

  return (
    <div className="grid items-center gap-10 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Every brand deal, from brief to payout.</h1>
        <p className="mt-4 text-lg text-slate-600">
          Influencer View keeps creators and brands on the same page: campaign briefs with clear requirements, one place to
          submit posts, fast reviews with feedback, and a running total of what you have earned.
        </p>
        <ul className="mt-6 space-y-2 text-slate-700">
          <li>Links are checked against the campaign platform before they are sent</li>
          <li>Brands approve or request changes, and creators can resubmit</li>
          <li>Engagement and fees in KES roll up into a performance view</li>
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          {demoAccounts.length > 0 ? 'Pick a demo account to explore both sides.' : 'Sign in with your Google account.'}
        </p>
        {demoAccounts.length === 0 && !googleEnabled ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No sign-in method is configured. Set DEMO_LOGIN or Google credentials in the environment.
          </p>
        ) : (
          <SignInButtons demoAccounts={demoAccounts} google={googleEnabled} />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomeContent />
    </Suspense>
  );
}
