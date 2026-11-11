import { Suspense } from 'react';
import { PageLoading } from '@/components/PageLoading';
import Link from 'next/link';
import { Card, StatCard, StatusBadge } from '@/components/ui';
import { requireUser } from '@/server/auth';
import { performanceFor } from '@/server/campaigns';
import { db } from '@/server/db';
import { formatKes } from '@/server/domain';
import { engagementOf } from '@/server/metrics';

async function PerformancePageContent() {
  const user = await requireUser('INFLUENCER');
  const { summary, rows } = await performanceFor(db, user);
  const delivered = rows.filter((row) => row.status === 'APPROVED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-slate-500">How your approved posts did against each brand&apos;s target.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Approval rate"
          value={summary.approvalRate === null ? 'No reviews yet' : `${Math.round(summary.approvalRate * 100)}%`}
          hint={`${summary.approved} approved, ${summary.rejected} sent back`}
        />
        <StatCard label="Total engagement" value={summary.totalEngagement.toLocaleString('en-KE')} />
        <StatCard label="Earned" value={formatKes(summary.earnedKes)} />
        <StatCard label="Campaigns" value={summary.total} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Approved posts</h2>
        {delivered.length === 0 ? (
          <p className="text-slate-500">Approved posts and their engagement will show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Campaign</th>
                  <th className="py-2 pr-4 font-medium">Engagement</th>
                  <th className="py-2 pr-4 font-medium">Target</th>
                  <th className="py-2 pr-4 font-medium">Fee</th>
                  <th className="py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {delivered.map((row) => {
                  const engagement = engagementOf(row.latestSubmission);
                  const hit = engagement >= row.minimumEngagement;
                  return (
                    <tr key={row.id}>
                      <td className="py-3 pr-4">
                        <Link href={`/campaigns/${row.id}`} className="font-medium text-violet-700 hover:underline">
                          {row.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">{engagement.toLocaleString('en-KE')}</td>
                      <td className="py-3 pr-4">{row.minimumEngagement.toLocaleString('en-KE')}</td>
                      <td className="py-3 pr-4">{formatKes(row.feeKes)}</td>
                      <td className="py-3">
                        {hit ? <StatusBadge status="APPROVED" /> : <span className="text-xs font-semibold text-amber-700">Below target</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PerformancePageContent />
    </Suspense>
  );
}
