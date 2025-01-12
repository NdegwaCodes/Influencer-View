export interface Campaign {
  id: string;
  title: string;
  description: string;
  instructions: string;
  deadline: Date;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  influencerID: string;
  requirements: {
    platform: string;
    contentType: string;
    minimumEngagement?: number;
  };
  submission?: {
    link: string;
    notes?: string;
    submittedAt: Date;
    engagement?: {
      likes: number;
      shares: number;
      comments: number;
    };
  };
  campaignID: string;
  approved: boolean;
}

export interface SubmissionData {
  link: string;
  notes?: string;
}
