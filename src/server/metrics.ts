import type { CampaignStatus } from './domain';

export interface MetricsCampaign {
  id: string;
  title: string;
  status: CampaignStatus | string;
  feeKes: number;
  minimumEngagement: number;
  deadline: Date;
  latestSubmission?: {
    submittedAt: Date;
    likes: number | null;
    comments: number | null;
    shares: number | null;
  } | null;
}

export interface PerformanceSummary {
  total: number;
  open: number;
  awaitingReview: number;
  approved: number;
  rejected: number;
  approvalRate: number | null;
  totalEngagement: number;
  earnedKes: number;
  potentialKes: number;
  overdue: number;
}

export function engagementOf(submission: MetricsCampaign['latestSubmission']): number {
  if (!submission) {
    return 0;
  }
  return (submission.likes ?? 0) + (submission.comments ?? 0) + (submission.shares ?? 0);
}

export function summarise(campaigns: MetricsCampaign[], now: Date = new Date()): PerformanceSummary {
  const count = (status: string) => campaigns.filter((campaign) => campaign.status === status).length;
  const approved = count('APPROVED');
  const rejected = count('REJECTED');
  const reviewed = approved + rejected;

  return {
    total: campaigns.length,
    open: count('PENDING') + rejected,
    awaitingReview: count('SUBMITTED'),
    approved,
    rejected,
    approvalRate: reviewed === 0 ? null : approved / reviewed,
    totalEngagement: campaigns.reduce((sum, campaign) => sum + engagementOf(campaign.latestSubmission), 0),
    earnedKes: campaigns
      .filter((campaign) => campaign.status === 'APPROVED')
      .reduce((sum, campaign) => sum + campaign.feeKes, 0),
    potentialKes: campaigns
      .filter((campaign) => campaign.status !== 'APPROVED')
      .reduce((sum, campaign) => sum + campaign.feeKes, 0),
    overdue: campaigns.filter(
      (campaign) =>
        (campaign.status === 'PENDING' || campaign.status === 'REJECTED') && campaign.deadline.getTime() < now.getTime()
    ).length,
  };
}

export function daysUntil(deadline: Date, now: Date = new Date()): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.ceil((deadline.getTime() - now.getTime()) / day);
}
