import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Campaign } from '@/interfaces/campaigns';

interface CampaignWithDetails extends Omit<Campaign, 'submission'> {
  submission?: {
    submittedAt: Date;
    engagement?: {
      likes: number;
      shares: number;
      comments: number;
    };
  };
}

interface RecentSubmission {
  campaignTitle: string;
  submittedAt: Date | null;
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metrics = await prisma.campaign.findMany({
      where: {
        influencerID: session.user.id,
      },
      include: {
        submission: {
          include: {
            engagement: true
          }
        }
      }
    }) as unknown as CampaignWithDetails[];

    const performanceMetrics = {
      totalCampaigns: metrics.length,
      submittedCampaigns: metrics.filter((c: CampaignWithDetails) => c.status === 'submitted').length,
      approvedCampaigns: metrics.filter((c: CampaignWithDetails) => c.status === 'approved').length,
      totalEngagement: metrics.reduce((sum: number, campaign: CampaignWithDetails) => {
        const engagement = campaign.submission?.engagement;
        if (engagement) {
          return sum + engagement.likes + engagement.shares + engagement.comments;
        }
        return sum;
      }, 0),
      recentSubmissions: metrics
        .filter((c: CampaignWithDetails) => c.submission)
        .map((c: CampaignWithDetails): RecentSubmission => ({
          campaignTitle: c.title,
          submittedAt: c.submission?.submittedAt || null,
          engagement: c.submission?.engagement
        }))
        .sort((a: RecentSubmission, b: RecentSubmission) => 
          (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0)
        )
        .slice(0, 5)
    };

    return res.status(200).json(performanceMetrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
} 