import type { PrismaClient } from '@prisma/client';
import {
  canReview,
  canSubmit,
  DomainError,
  linkMatchesPlatform,
  reviewSchema,
  submissionSchema,
  type Actor,
  type CampaignStatus,
  type ReviewInput,
  type SubmissionInput,
} from './domain';
import { summarise, type MetricsCampaign } from './metrics';

const latestSubmission = { orderBy: { submittedAt: 'desc' as const }, take: 1 };

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Check the form and try again';
}

export async function listCampaigns(db: PrismaClient, actor: Actor, status?: string) {
  if (actor.role !== 'INFLUENCER') {
    throw new DomainError('FORBIDDEN', 'Only creators have a campaign list');
  }
  return db.campaign.findMany({
    where: { influencerId: actor.id, ...(status ? { status } : {}) },
    orderBy: [{ deadline: 'asc' }, { title: 'asc' }],
    include: { submissions: latestSubmission },
  });
}

export async function getCampaign(db: PrismaClient, actor: Actor, campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      submissions: { orderBy: { submittedAt: 'desc' } },
      influencer: { select: { name: true, handle: true } },
    },
  });
  if (!campaign || (actor.role === 'INFLUENCER' && campaign.influencerId !== actor.id)) {
    throw new DomainError('NOT_FOUND', 'Campaign not found');
  }
  return campaign;
}

export async function performanceFor(db: PrismaClient, actor: Actor, now: Date = new Date()) {
  const campaigns = await listCampaigns(db, actor);
  const rows: MetricsCampaign[] = campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    feeKes: campaign.feeKes,
    minimumEngagement: campaign.minimumEngagement,
    deadline: campaign.deadline,
    latestSubmission: campaign.submissions[0] ?? null,
  }));
  return { summary: summarise(rows, now), rows };
}

export async function submitContent(
  db: PrismaClient,
  actor: Actor,
  campaignId: string,
  input: SubmissionInput,
  now: Date = new Date()
) {
  if (actor.role !== 'INFLUENCER') {
    throw new DomainError('FORBIDDEN', 'Only the assigned creator can submit content');
  }
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError('INVALID', firstIssue(parsed.error));
  }
  const campaign = await getCampaign(db, actor, campaignId);
  if (!canSubmit(campaign.status as CampaignStatus)) {
    throw new DomainError('CONFLICT', 'This campaign is not waiting for content');
  }
  if (campaign.deadline.getTime() < now.getTime()) {
    throw new DomainError('CONFLICT', 'The deadline for this campaign has passed');
  }
  if (!linkMatchesPlatform(parsed.data.link, campaign.platform)) {
    throw new DomainError('INVALID', `Use the https link to your ${campaign.platform} post`);
  }

  await db.$transaction(async (tx) => {
    const updated = await tx.campaign.updateMany({
      where: { id: campaignId, status: campaign.status },
      data: { status: 'SUBMITTED' },
    });
    if (updated.count !== 1) {
      throw new DomainError('CONFLICT', 'This campaign changed while you were submitting. Refresh and try again.');
    }
    await tx.submission.create({
      data: { campaignId, link: parsed.data.link, notes: parsed.data.notes, submittedAt: now },
    });
  });
}

export async function listForReview(db: PrismaClient, actor: Actor) {
  if (actor.role !== 'BRAND') {
    throw new DomainError('FORBIDDEN', 'Only brand reviewers can review submissions');
  }
  return db.campaign.findMany({
    where: { status: 'SUBMITTED' },
    orderBy: { updatedAt: 'asc' },
    include: { submissions: latestSubmission, influencer: { select: { name: true, handle: true } } },
  });
}

export async function reviewSubmission(
  db: PrismaClient,
  actor: Actor,
  campaignId: string,
  input: ReviewInput,
  now: Date = new Date()
) {
  if (actor.role !== 'BRAND') {
    throw new DomainError('FORBIDDEN', 'Only brand reviewers can review submissions');
  }
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError('INVALID', firstIssue(parsed.error));
  }
  const campaign = await getCampaign(db, actor, campaignId);
  const submission = campaign.submissions[0];
  if (!canReview(campaign.status as CampaignStatus) || !submission) {
    throw new DomainError('CONFLICT', 'There is no submission waiting for review');
  }

  const review = parsed.data;
  await db.$transaction(async (tx) => {
    const updated = await tx.campaign.updateMany({
      where: { id: campaignId, status: 'SUBMITTED' },
      data: { status: review.decision },
    });
    if (updated.count !== 1) {
      throw new DomainError('CONFLICT', 'Someone else reviewed this submission first');
    }
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        decision: review.decision,
        reviewNote: review.note,
        reviewedAt: now,
        likes: review.likes,
        comments: review.comments,
        shares: review.shares,
      },
    });
  });
}
