// pages/index.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Input, Steps, Typography, message } from 'antd';
import { LinkOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Campaign } from '@/interfaces/campaigns';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function CampaignDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submission, setSubmission] = useState({ link: '', notes: '' });

  const fetchCampaignDetails = useCallback(async () => {
    if (!id) return;
    const response = await fetch(`/api/campaigns/${id}`);
    if (response.ok) {
      const data = await response.json();
      setCampaign(data);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  const handleSubmit = async () => {
    const response = await fetch(`/api/campaigns/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });

    if (response.ok) {
      message.success('Submission successful!');
      fetchCampaignDetails();
    } else {
      message.error('Failed to submit');
    }
  };

  if (!campaign) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={2}>{campaign.title}</Title>
      
      <Card className="mb-6">
        <Title level={4}>Campaign Instructions</Title>
        <Paragraph>{campaign.instructions}</Paragraph>
        
        <div className="mt-4">
          <Steps
            current={getStepNumber(campaign.status)}
            items={[
              { title: 'Assigned', icon: <CheckCircleOutlined /> },
              { title: 'Submitted', icon: <LinkOutlined /> },
              { title: 'Reviewed', icon: <CheckCircleOutlined /> },
            ]}
          />
        </div>
      </Card>

      <Card title="Submit Your Content">
        <Input
          prefix={<LinkOutlined />}
          placeholder="Paste your content link here"
          value={submission.link}
          onChange={e => setSubmission({ ...submission, link: e.target.value })}
          className="mb-4"
        />
        
        <TextArea
          placeholder="Additional notes (optional)"
          value={submission.notes}
          onChange={e => setSubmission({ ...submission, notes: e.target.value })}
          className="mb-4"
        />

        <Button type="primary" onClick={handleSubmit}>
          Submit Content
        </Button>
      </Card>
    </div>
  );
}

const getStepNumber = (status: Campaign['status']) => {
  const steps: Record<Campaign['status'], number> = {
    'pending': 0,
    'submitted': 1,
    'approved': 2,
    'rejected': 1
  };
  return steps[status] || 0;
};
