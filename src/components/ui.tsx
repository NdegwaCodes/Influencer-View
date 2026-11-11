import type { ReactNode } from 'react';

const statusStyles: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'To do', className: 'bg-amber-100 text-amber-800 ring-amber-200' },
  SUBMITTED: { label: 'In review', className: 'bg-sky-100 text-sky-800 ring-sky-200' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  REJECTED: { label: 'Changes requested', className: 'bg-rose-100 text-rose-800 ring-rose-200' },
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? { label: status, className: 'bg-slate-100 text-slate-700 ring-slate-200' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.className}`}>
      {style.label}
    </span>
  );
}

export function statusLabel(status: string): string {
  return statusStyles[status]?.label ?? status;
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

export function deadlineText(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`;
  }
  if (days === 0) {
    return 'Due today';
  }
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}
