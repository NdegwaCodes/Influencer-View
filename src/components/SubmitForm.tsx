'use client';

import { useActionState } from 'react';
import { submitContentAction, type FormState } from '@/app/actions';

export function SubmitForm({ campaignId, platform, resubmitting }: { campaignId: string; platform: string; resubmitting: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitContentAction.bind(null, campaignId),
    {}
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="link" className="block text-sm font-medium text-slate-700">
          Link to your {platform} post
        </label>
        <input
          id="link"
          name="link"
          type="url"
          required
          inputMode="url"
          placeholder={`https://${platform === 'X' ? 'x' : platform.toLowerCase()}.com/...`}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          Notes for the brand <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder={resubmitting ? 'What did you change?' : 'Anything the brand should know'}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? 'Submitting...' : resubmitting ? 'Resubmit content' : 'Submit content'}
      </button>
    </form>
  );
}
