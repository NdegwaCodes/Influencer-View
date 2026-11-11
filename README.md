# Influencer View

[![CI](https://github.com/NdegwaCodes/Influencer-View/actions/workflows/ci.yml/badge.svg)](https://github.com/NdegwaCodes/Influencer-View/actions/workflows/ci.yml)

A campaign workspace for creators and the brands that hire them. Creators see their briefs, submit posts and track what they have earned. Brand reviewers approve posts or send them back with feedback, and record how each post performed.

## Features

**Creators**
- A dashboard of brand deals with what is to do, in review and approved, and money earned and still to earn in KES
- Filters by status, and deadlines shown as days left or overdue
- Campaign pages with the brief, platform, fee, minimum engagement and deadline
- Submitting a post checks that the link is an https link on the campaign's platform (a TikTok campaign needs a TikTok link), and blocks submissions after the deadline
- Feedback from the brand shows on the campaign, and the creator can resubmit; every attempt stays in the submission history
- A performance page with approval rate, total engagement and each approved post against its target

**Brand reviewers**
- A review queue, oldest first, with the creator, link, notes and target
- Approve with likes, comments and shares, or request changes (feedback is required)

**Security and correctness**
- Every read and write goes through a service layer that takes the signed-in user: creators only ever see their own campaigns (another creator's campaign is a 404), and only reviewers can review
- Status changes are guarded in a transaction (`PENDING` or `REJECTED` to `SUBMITTED`, `SUBMITTED` to `APPROVED` or `REJECTED`), so a double click or two reviewers at once cannot apply twice
- Input is validated with Zod on the server

## Tech stack

| Area | Technology |
| --- | --- |
| App | Next.js 16 (App Router, Server Actions, Cache Components with Suspense streaming), React 19, TypeScript |
| Data | Prisma 6 with SQLite locally (switch the datasource to PostgreSQL for production) |
| Auth | NextAuth: Google sign-in, plus demo accounts for trying both roles |
| Styling | Tailwind CSS 4 |
| Quality | Node test runner with tsx (service tests run against a real database), ESLint, GitHub Actions |

## Running it

```bash
cp .env.example .env
npm install
npm run db:setup     # creates prisma/dev.db and loads sample campaigns
npm run dev
```

Open http://localhost:3000 and pick a demo account: **Creator: Wanjiru Kamau** or **Brand reviewer: Savanna Brands**. To use Google sign-in, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; set `DEMO_LOGIN=false` to turn the demo accounts off.

## Project structure

```
prisma/              schema and seed data
src/server/          domain rules, metrics, campaign service, auth, database client
src/app/             pages (campaigns, campaigns/[id], performance, review) and server actions
src/components/      forms, sign-in buttons, shared UI
```

## Checks

```bash
npm run lint
npm run typecheck
npm test             # 17 tests: link and status rules, metrics, and the campaign service against SQLite
npm run build
```

## History

The first version of this repository mixed two data layers (Prisma and raw MongoDB calls on a different collection), had API routes that returned every campaign without sign-in and let anyone update any campaign, and linked to pages that did not exist. This version rebuilds it on one service layer with authorisation, tests and CI.
