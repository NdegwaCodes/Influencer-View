import { Suspense } from 'react';
import { PageLoading } from '@/components/PageLoading';
import Link from 'next/link';
import { Card, deadlineText, formatDate, StatCard, StatusBadge } from '@/components/ui';
import { requireUser } from '@/server/auth';
import { listCampaigns, performanceFor } from '@/server/campaigns';
import { db } from '@/server/db';
import { formatKes, STATUSES } from '@/server/domain';
import { daysUntil } from '@/server/metrics';

const filters = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'To do' },
  { value: 'REJECTED', label: 'Changes requested' },
  { value: 'SUBMITTED', label: 'In review' },
  { value: 'APPROVED', label: 'Approved' },
];

async function CampaignsPageContent({ searchParams }: PageProps<'/campaigns'>) {
  const user = await requireUser('INFLUENCER');
  const { status: rawStatus } = await searchParams;
  const status = typeof rawStatus === 'string' && (STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : '';
  const [campaigns, { summary }] = await Promise.all([
    listCampaigns(db, user, status || undefined),
    performanceFor(db, user),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hi {user.name.split(' ')[0]}</h1>
        <p className="text-slate-500">Here is where your brand deals stand.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="To do" value={summary.open} hint={summary.overdue ? `${summary.overdue} overdue` : 'Nothing overdue'} />
        <StatCard label="In review" value={summary.awaitingReview} />
        <StatCard label="Earned" value={formatKes(summary.earnedKes)} hint={`${summary.approved} approved`} />
        <StatCard label="Still to earn" value={formatKes(summary.potentialKes)} />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter campaigns">
          {filters.map((filter) => {
            const active = filter.value === status;
            return (
              <Link
                key={filter.label}
                role="tab"
                aria-selected={active}
                href={filter.value ? `/campaigns?status=${filter.value}` : '/campaigns'}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {campaigns.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No campaigns here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {campaigns.map((campaign) => {
              const days = daysUntil(campaign.deadline);
              const waiting = campaign.status === 'PENDING' || campaign.status === 'REJECTED';
              return (
                <li key={campaign.id}>
                  <Link href={`/campaigns/${campaign.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{campaign.title}</p>
                      <p className="text-sm text-slate-500">
                        {campaign.brandName} · {campaign.platform} {campaign.contentType}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-slate-900">{formatKes(campaign.feeKes)}</p>
                      <p className={waiting && days < 0 ? 'text-rose-600' : 'text-slate-500'}>
                        {waiting ? deadlineText(days) : `Due ${formatDate(campaign.deadline)}`}
                      </p>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function CampaignsPage(props: PageProps<'/campaigns'>) {
  return (
    <Suspense fallback={<PageLoading />}>
      <CampaignsPageContent {...props} />
    </Suspense>
  );
}
