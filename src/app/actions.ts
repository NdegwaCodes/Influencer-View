'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/server/auth';
import { reviewSubmission, submitContent } from '@/server/campaigns';
import { db } from '@/server/db';
import { DomainError } from '@/server/domain';

export interface FormState {
  error?: string;
  success?: string;
}

function field(form: FormData, name: string): string | undefined {
  const value = form.get(name);
  return typeof value === 'string' ? value : undefined;
}

function failure(error: unknown): FormState {
  if (error instanceof DomainError) {
    return { error: error.message };
  }
  console.error(error);
  return { error: 'Something went wrong. Try again.' };
}

export async function submitContentAction(campaignId: string, _state: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser('INFLUENCER');
  try {
    await submitContent(db, user, campaignId, { link: field(form, 'link') ?? '', notes: field(form, 'notes') });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: 'Submitted. The brand will review it soon.' };
}

export async function reviewAction(campaignId: string, _state: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser('BRAND');
  const optionalNumber = (name: string) => {
    const value = field(form, name)?.trim();
    return value ? value : undefined;
  };
  try {
    await reviewSubmission(db, user, campaignId, {
      decision: field(form, 'decision') as 'APPROVED' | 'REJECTED',
      note: field(form, 'note'),
      likes: optionalNumber('likes'),
      comments: optionalNumber('comments'),
      shares: optionalNumber('shares'),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/review');
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: 'Review saved.' };
}
