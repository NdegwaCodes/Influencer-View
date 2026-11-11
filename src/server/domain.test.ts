import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canReview, canSubmit, formatKes, linkMatchesPlatform, reviewSchema, submissionSchema } from './domain';
import { daysUntil, summarise, type MetricsCampaign } from './metrics';

describe('linkMatchesPlatform', () => {
  it('accepts https links on the campaign platform, with or without www', () => {
    assert.equal(linkMatchesPlatform('https://www.tiktok.com/@wanjiru/video/123', 'TikTok'), true);
    assert.equal(linkMatchesPlatform('https://vm.tiktok.com/ZM123/', 'TikTok'), true);
    assert.equal(linkMatchesPlatform('https://instagram.com/reel/abc', 'Instagram'), true);
    assert.equal(linkMatchesPlatform('https://youtu.be/xyz', 'YouTube'), true);
    assert.equal(linkMatchesPlatform('https://m.youtube.com/shorts/xyz', 'YouTube'), true);
  });

  it('rejects other platforms, plain http, look-alike hosts and junk', () => {
    assert.equal(linkMatchesPlatform('https://instagram.com/reel/abc', 'TikTok'), false);
    assert.equal(linkMatchesPlatform('http://tiktok.com/@a/video/1', 'TikTok'), false);
    assert.equal(linkMatchesPlatform('https://tiktok.com.evil.example/video', 'TikTok'), false);
    assert.equal(linkMatchesPlatform('https://notinstagram.com/p/1', 'Instagram'), false);
    assert.equal(linkMatchesPlatform('not a link', 'TikTok'), false);
    assert.equal(linkMatchesPlatform('https://tiktok.com/x', 'MySpace'), false);
  });
});

describe('schemas', () => {
  it('trims submissions and drops empty notes', () => {
    const parsed = submissionSchema.parse({ link: '  https://x.com/a/status/1 ', notes: '   ' });
    assert.deepEqual(parsed, { link: 'https://x.com/a/status/1', notes: undefined });
    assert.equal(submissionSchema.safeParse({ link: '' }).success, false);
  });

  it('needs a note to reject, and coerces engagement numbers', () => {
    assert.equal(reviewSchema.safeParse({ decision: 'REJECTED' }).success, false);
    assert.equal(reviewSchema.safeParse({ decision: 'REJECTED', note: 'Show the logo' }).success, true);
    const approved = reviewSchema.parse({ decision: 'APPROVED', likes: '1200', comments: '80', shares: '15' });
    assert.deepEqual([approved.likes, approved.comments, approved.shares], [1200, 80, 15]);
    assert.equal(reviewSchema.safeParse({ decision: 'APPROVED', likes: '-3' }).success, false);
  });
});

describe('status rules', () => {
  it('lets creators submit while pending or after a rejection, and brands review only submitted work', () => {
    assert.deepEqual(
      ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => canSubmit(status as never)),
      [true, false, false, true]
    );
    assert.deepEqual(
      ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => canReview(status as never)),
      [false, true, false, false]
    );
  });
});

describe('metrics', () => {
  const now = new Date('2026-11-11T12:00:00Z');
  const base = { minimumEngagement: 0, deadline: new Date('2026-12-01'), latestSubmission: null };
  const campaigns: MetricsCampaign[] = [
    { ...base, id: '1', title: 'A', status: 'APPROVED', feeKes: 15000, latestSubmission: { submittedAt: now, likes: 1000, comments: 50, shares: 10 } },
    { ...base, id: '2', title: 'B', status: 'APPROVED', feeKes: 8000, latestSubmission: { submittedAt: now, likes: 400, comments: null, shares: 5 } },
    { ...base, id: '3', title: 'C', status: 'REJECTED', feeKes: 5000 },
    { ...base, id: '4', title: 'D', status: 'SUBMITTED', feeKes: 12000 },
    { ...base, id: '5', title: 'E', status: 'PENDING', feeKes: 6000, deadline: new Date('2026-11-01') },
  ];

  it('summarises counts, approval rate, engagement and money', () => {
    const summary = summarise(campaigns, now);
    assert.equal(summary.total, 5);
    assert.equal(summary.open, 2);
    assert.equal(summary.awaitingReview, 1);
    assert.equal(summary.approved, 2);
    assert.equal(summary.approvalRate, 2 / 3);
    assert.equal(summary.totalEngagement, 1465);
    assert.equal(summary.earnedKes, 23000);
    assert.equal(summary.potentialKes, 23000);
    assert.equal(summary.overdue, 1);
  });

  it('has no approval rate before anything is reviewed', () => {
    assert.equal(summarise([], now).approvalRate, null);
  });

  it('counts days to a deadline and formats shillings', () => {
    assert.equal(daysUntil(new Date('2026-11-14T12:00:00Z'), now), 3);
    assert.equal(daysUntil(new Date('2026-11-10T12:00:00Z'), now), -1);
    assert.equal(formatKes(15000), 'KSh 15,000');
  });
});
