import { Suspense } from 'react';
import { PageLoading } from '@/components/PageLoading';
import { ReviewForm } from '@/components/ReviewForm';
import { Card, formatDate } from '@/components/ui';
import { requireUser } from '@/server/auth';
import { listForReview } from '@/server/campaigns';
import { db } from '@/server/db';
import { formatKes } from '@/server/domain';

async function ReviewPageContent() {
  const user = await requireUser('BRAND');
  const queue = await listForReview(db, user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review queue</h1>
        <p className="text-slate-500">
          {queue.length === 0 ? 'Nothing waiting. New submissions will appear here.' : `${queue.length} waiting for review, oldest first.`}
        </p>
      </div>

      {queue.map((campaign) => {
        const submission = campaign.submissions[0];
        return (
          <Card key={campaign.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-violet-700">{campaign.brandName}</p>
                <h2 className="text-lg font-semibold">{campaign.title}</h2>
                <p className="text-sm text-slate-500">
                  {campaign.influencer.name}
                  {campaign.influencer.handle ? ` (${campaign.influencer.handle})` : ''} · {campaign.platform} {campaign.contentType} ·{' '}
                  {formatKes(campaign.feeKes)}
                </p>
              </div>
              {submission ? <p className="text-xs text-slate-500">Sent {formatDate(submission.submittedAt)}</p> : null}
            </div>
            {submission ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <a href={submission.link} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-violet-700 hover:underline">
                    {submission.link}
                  </a>
                  {submission.notes ? <p className="mt-1 text-sm text-slate-600">{submission.notes}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">Target: {campaign.minimumEngagement.toLocaleString('en-KE')} engagements</p>
                </div>
                <ReviewForm campaignId={campaign.id} />
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ReviewPageContent />
    </Suspense>
  );
}
