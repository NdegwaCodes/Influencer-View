import { z } from 'zod';

export const ROLES = ['INFLUENCER', 'BRAND'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const;
export type CampaignStatus = (typeof STATUSES)[number];

export const PLATFORMS = {
  TikTok: ['tiktok.com', 'vm.tiktok.com'],
  Instagram: ['instagram.com'],
  YouTube: ['youtube.com', 'youtu.be'],
  X: ['x.com', 'twitter.com'],
  Facebook: ['facebook.com', 'fb.watch'],
} as const;
export type Platform = keyof typeof PLATFORMS;

export interface Actor {
  id: string;
  role: Role;
}

export class DomainError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'FORBIDDEN' | 'INVALID' | 'CONFLICT',
    message: string
  ) {
    super(message);
  }
}

export function isPlatform(value: string): value is Platform {
  return Object.prototype.hasOwnProperty.call(PLATFORMS, value);
}

export function linkMatchesPlatform(link: string, platform: string): boolean {
  if (!isPlatform(platform)) {
    return false;
  }
  let host: string;
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:') {
      return false;
    }
    host = url.hostname.toLowerCase().replace(/^www\.|^m\./, '');
  } catch {
    return false;
  }
  return PLATFORMS[platform].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export const submissionSchema = z.object({
  link: z.string().trim().min(1, 'Paste the link to your post').max(500),
  notes: z
    .string()
    .trim()
    .max(1000, 'Keep notes under 1,000 characters')
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const reviewSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    note: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((value) => (value ? value : undefined)),
    likes: z.coerce.number().int().min(0).optional(),
    comments: z.coerce.number().int().min(0).optional(),
    shares: z.coerce.number().int().min(0).optional(),
  })
  .refine((review) => review.decision === 'APPROVED' || Boolean(review.note), {
    message: 'Tell the creator what to change',
    path: ['note'],
  });

export type SubmissionInput = z.input<typeof submissionSchema>;
export type ReviewInput = z.input<typeof reviewSchema>;

export function canSubmit(status: CampaignStatus): boolean {
  return status === 'PENDING' || status === 'REJECTED';
}

export function canReview(status: CampaignStatus): boolean {
  return status === 'SUBMITTED';
}

export function formatKes(amount: number): string {
  return `KSh ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`;
}
