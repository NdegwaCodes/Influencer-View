'use client';

import { useActionState } from 'react';
import { reviewAction, type FormState } from '@/app/actions';

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200';

export function ReviewForm({ campaignId }: { campaignId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reviewAction.bind(null, campaignId), {});

  if (state.success) {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {(['likes', 'comments', 'shares'] as const).map((name) => (
          <div key={name}>
            <label htmlFor={`${campaignId}-${name}`} className="block text-xs font-medium capitalize text-slate-600">
              {name}
            </label>
            <input id={`${campaignId}-${name}`} name={name} type="number" min={0} inputMode="numeric" className={inputClass} />
          </div>
        ))}
      </div>
      <div>
        <label htmlFor={`${campaignId}-note`} className="block text-xs font-medium text-slate-600">
          Feedback for the creator <span className="font-normal text-slate-400">(required to request changes)</span>
        </label>
        <textarea id={`${campaignId}-note`} name="note" rows={2} maxLength={1000} className={inputClass} />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="APPROVED"
          disabled={pending}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="REJECTED"
          disabled={pending}
          className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
        >
          Request changes
        </button>
      </div>
    </form>
  );
}
