import { Suspense } from 'react';
import { PageLoading } from '@/components/PageLoading';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SubmitForm } from '@/components/SubmitForm';
import { Card, deadlineText, formatDate, StatusBadge } from '@/components/ui';
import { requireUser } from '@/server/auth';
import { getCampaign } from '@/server/campaigns';
import { db } from '@/server/db';
import { canSubmit, DomainError, formatKes, type CampaignStatus } from '@/server/domain';
import { daysUntil, engagementOf } from '@/server/metrics';

async function load(user: Awaited<ReturnType<typeof requireUser>>, id: string) {
  try {
    return await getCampaign(db, user, id);
  } catch (error) {
    if (error instanceof DomainError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}

async function CampaignPageContent({ params }: PageProps<'/campaigns/[id]'>) {
  const user = await requireUser('INFLUENCER');
  const { id } = await params;
  const campaign = await load(user, id);
  const days = daysUntil(campaign.deadline);
  const open = canSubmit(campaign.status as CampaignStatus);
  const late = days < 0;
  const latest = campaign.submissions[0];

  return (
    <div className="space-y-6">
      <Link href="/campaigns" className="text-sm font-medium text-violet-700 hover:underline">
        Back to campaigns
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">{campaign.brandName}</p>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <p className="mt-1 text-slate-600">{campaign.description}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Fee</p>
          <p className="text-lg font-bold">{formatKes(campaign.feeKes)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Platform</p>
          <p className="text-lg font-bold">
            {campaign.platform} {campaign.contentType}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Minimum engagement</p>
          <p className="text-lg font-bold">{campaign.minimumEngagement.toLocaleString('en-KE')}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Deadline</p>
          <p className="text-lg font-bold">{formatDate(campaign.deadline)}</p>
          {open ? <p className={`text-xs ${late ? 'text-rose-600' : 'text-slate-500'}`}>{deadlineText(days)}</p> : null}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Brief</h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">{campaign.instructions}</p>
      </Card>

      {campaign.status === 'REJECTED' && latest?.reviewNote ? (
        <Card className="border-rose-200 bg-rose-50">
          <h2 className="font-semibold text-rose-800">Changes requested</h2>
          <p className="mt-1 text-rose-900">{latest.reviewNote}</p>
        </Card>
      ) : null}

      {open ? (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{campaign.status === 'REJECTED' ? 'Resubmit your post' : 'Submit your post'}</h2>
          {late ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              The deadline has passed. Contact {campaign.brandName} to agree a new date.
            </p>
          ) : (
            <SubmitForm campaignId={campaign.id} platform={campaign.platform} resubmitting={campaign.status === 'REJECTED'} />
          )}
        </Card>
      ) : null}

      {campaign.submissions.length > 0 ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Submission history</h2>
          <ol className="space-y-4">
            {campaign.submissions.map((submission) => (
              <li key={submission.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a href={submission.link} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-violet-700 hover:underline">
                    {submission.link}
                  </a>
                  <span className="text-xs text-slate-500">Sent {formatDate(submission.submittedAt)}</span>
                </div>
                {submission.notes ? <p className="mt-1 text-sm text-slate-600">{submission.notes}</p> : null}
                {submission.decision ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <StatusBadge status={submission.decision} />
                    {submission.decision === 'APPROVED' ? (
                      <span className="text-slate-600">
                        {engagementOf(submission).toLocaleString('en-KE')} engagements ({submission.likes ?? 0} likes, {submission.comments ?? 0}{' '}
                        comments, {submission.shares ?? 0} shares)
                      </span>
                    ) : null}
                    {submission.reviewNote && submission.decision === 'APPROVED' ? (
                      <span className="text-slate-600">{submission.reviewNote}</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-sky-700">Waiting for the brand to review</p>
                )}
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </div>
  );
}

export default function CampaignPage(props: PageProps<'/campaigns/[id]'>) {
  return (
    <Suspense fallback={<PageLoading />}>
      <CampaignPageContent {...props} />
    </Suspense>
  );
}
