import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout, Card, Button, List, Tag, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { Campaign } from '@/interfaces/campaigns';
import PerformanceSnapshot from '@/components/PerformanceSnapshot';

const { Title } = Typography;
const { Content } = Layout;

export default function CampaignList() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaign');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      submitted: 'blue',
      approved: 'green',
      rejected: 'red'
    };
    return colors[status] || 'default';
  };

  return (
    <Layout className="min-h-screen bg-white">
      <Content className="p-6 max-w-6xl mx-auto">
        <Title level={2} className="mb-8">Campaign Dashboard</Title>
        
        <PerformanceSnapshot className="mb-8" />

        <Card className="mb-8">
          <List
            loading={loading}
            dataSource={campaigns}
            renderItem={(campaign) => (
              <List.Item
                actions={[
                  <Button 
                    key="view"
                    type="primary"
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  >
                    View Details
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{campaign.title}</span>
                      <Tag color={getStatusColor(campaign.status)}>
                        {campaign.status.toUpperCase()}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="mt-2">
                      <p className="text-gray-600">
                        <CalendarOutlined className="mr-2" />
                        Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 mt-1">{campaign.description}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Content>
    </Layout>
  );
}
