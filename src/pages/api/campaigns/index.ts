import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

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
    const campaigns = await prisma.campaign.findMany({
      where: {
        influencerID: session.user.id,
      },
      orderBy: {
        deadline: 'asc',
      },
      include: {
        submission: true,
      },
    });

    return res.status(200).json(campaigns);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
} 