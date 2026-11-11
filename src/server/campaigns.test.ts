import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  getCampaign,
  listCampaigns,
  listForReview,
  performanceFor,
  reviewSubmission,
  submitContent,
} from './campaigns';
import { DomainError, type Actor } from './domain';

const url = 'file:./campaigns-test.db';
let db: PrismaClient;
let wanjiru: Actor;
let otieno: Actor;
let brand: Actor;
let tiktokId: string;
let otienoCampaignId: string;

const now = new Date('2026-11-11T09:00:00Z');
const later = new Date('2026-12-15T00:00:00Z');

async function rejects(promise: Promise<unknown>, code: DomainError['code'], message?: RegExp) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof DomainError, `expected DomainError, got ${String(error)}`);
    assert.equal(error.code, code);
    if (message) {
      assert.match(error.message, message);
    }
    return true;
  });
}

before(() => {
  rmSync(path.join('prisma', 'campaigns-test.db'), { force: true });
  rmSync(path.join('prisma', 'campaigns-test.db-journal'), { force: true });
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'ignore',
  });
  db = new PrismaClient({ datasourceUrl: url });
});

after(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.submission.deleteMany();
  await db.campaign.deleteMany();
  await db.user.deleteMany();
  const w = await db.user.create({ data: { email: 'wanjiru@example.com', name: 'Wanjiru', role: 'INFLUENCER' } });
  const o = await db.user.create({ data: { email: 'otieno@example.com', name: 'Otieno', role: 'INFLUENCER' } });
  const b = await db.user.create({ data: { email: 'brand@example.com', name: 'Savanna Brands', role: 'BRAND' } });
  wanjiru = { id: w.id, role: 'INFLUENCER' };
  otieno = { id: o.id, role: 'INFLUENCER' };
  brand = { id: b.id, role: 'BRAND' };
  const base = {
    brandName: 'Jua Juice',
    description: 'Launch of a mango juice',
    instructions: 'Show the bottle in the first 3 seconds',
    contentType: 'Video',
    minimumEngagement: 500,
    feeKes: 15000,
    deadline: later,
  };
  tiktokId = (await db.campaign.create({ data: { ...base, title: 'Mango launch', platform: 'TikTok', influencerId: w.id } })).id;
  await db.campaign.create({ data: { ...base, title: 'Old reel', platform: 'Instagram', status: 'APPROVED', influencerId: w.id } });
  otienoCampaignId = (await db.campaign.create({ data: { ...base, title: 'Otieno only', platform: 'YouTube', influencerId: o.id } })).id;
});

describe('visibility', () => {
  it('shows creators only their own campaigns, filtered by status', async () => {
    assert.deepEqual((await listCampaigns(db, wanjiru)).map((c) => c.title), ['Mango launch', 'Old reel']);
    assert.deepEqual((await listCampaigns(db, wanjiru, 'APPROVED')).map((c) => c.title), ['Old reel']);
  });

  it("hides another creator's campaign as not found", async () => {
    await rejects(getCampaign(db, wanjiru, otienoCampaignId), 'NOT_FOUND');
    assert.equal((await getCampaign(db, brand, otienoCampaignId)).title, 'Otieno only');
  });

  it('keeps the campaign list and review queue to the right roles', async () => {
    await rejects(listCampaigns(db, brand), 'FORBIDDEN');
    await rejects(listForReview(db, wanjiru), 'FORBIDDEN');
  });
});

describe('submitting content', () => {
  it('records the submission and moves the campaign to SUBMITTED', async () => {
    await submitContent(db, wanjiru, tiktokId, { link: 'https://www.tiktok.com/@wanjiru/video/1', notes: 'Posted at 7pm' }, now);
    const campaign = await getCampaign(db, wanjiru, tiktokId);
    assert.equal(campaign.status, 'SUBMITTED');
    assert.equal(campaign.submissions.length, 1);
    assert.equal(campaign.submissions[0].notes, 'Posted at 7pm');
  });

  it('rejects links from the wrong platform and submissions after the deadline', async () => {
    await rejects(submitContent(db, wanjiru, tiktokId, { link: 'https://instagram.com/reel/1' }, now), 'INVALID', /TikTok/);
    await rejects(submitContent(db, wanjiru, tiktokId, { link: 'https://tiktok.com/@w/video/1' }, new Date('2027-01-01')), 'CONFLICT', /deadline/);
  });

  it("does not let creators submit twice, submit to someone else's campaign, or brands submit", async () => {
    await submitContent(db, wanjiru, tiktokId, { link: 'https://tiktok.com/@w/video/1' }, now);
    await rejects(submitContent(db, wanjiru, tiktokId, { link: 'https://tiktok.com/@w/video/2' }, now), 'CONFLICT');
    await rejects(submitContent(db, otieno, tiktokId, { link: 'https://tiktok.com/@o/video/1' }, now), 'NOT_FOUND');
    await rejects(submitContent(db, brand, tiktokId, { link: 'https://tiktok.com/@b/video/1' }, now), 'FORBIDDEN');
  });
});

describe('reviewing', () => {
  beforeEach(async () => {
    await submitContent(db, wanjiru, tiktokId, { link: 'https://tiktok.com/@w/video/1' }, now);
  });

  it('approves with engagement numbers and counts the fee as earned', async () => {
    assert.deepEqual((await listForReview(db, brand)).map((c) => c.title), ['Mango launch']);
    await reviewSubmission(db, brand, tiktokId, { decision: 'APPROVED', likes: 1200, comments: 90, shares: 30 }, now);
    const campaign = await getCampaign(db, wanjiru, tiktokId);
    assert.equal(campaign.status, 'APPROVED');
    assert.equal(campaign.submissions[0].likes, 1200);
    const { summary } = await performanceFor(db, wanjiru, now);
    assert.equal(summary.earnedKes, 30000);
    assert.equal(summary.totalEngagement, 1320);
    assert.equal((await listForReview(db, brand)).length, 0);
  });

  it('rejects with feedback, then accepts a resubmission', async () => {
    await rejects(reviewSubmission(db, brand, tiktokId, { decision: 'REJECTED' }, now), 'INVALID', /what to change/);
    await reviewSubmission(db, brand, tiktokId, { decision: 'REJECTED', note: 'Show the bottle earlier' }, now);
    assert.equal((await getCampaign(db, wanjiru, tiktokId)).status, 'REJECTED');

    await submitContent(db, wanjiru, tiktokId, { link: 'https://tiktok.com/@w/video/2' }, now);
    const campaign = await getCampaign(db, wanjiru, tiktokId);
    assert.equal(campaign.status, 'SUBMITTED');
    assert.equal(campaign.submissions.length, 2);
    assert.equal(campaign.submissions[1].reviewNote, 'Show the bottle earlier');
  });

  it('allows only one review per submission and only by brands', async () => {
    await rejects(reviewSubmission(db, wanjiru, tiktokId, { decision: 'APPROVED' }, now), 'FORBIDDEN');
    await reviewSubmission(db, brand, tiktokId, { decision: 'APPROVED' }, now);
    await rejects(reviewSubmission(db, brand, tiktokId, { decision: 'APPROVED' }, now), 'CONFLICT');
  });
});
