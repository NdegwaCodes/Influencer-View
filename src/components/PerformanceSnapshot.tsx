import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag } from 'antd';
import { LikeOutlined, ShareAltOutlined, CommentOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';

interface PerformanceMetrics {
  totalCampaigns: number;
  submittedCampaigns: number;
  approvedCampaigns: number;
  totalEngagement: number;
  recentSubmissions: {
    campaignTitle: string;
    submittedAt: string;
    engagement?: {
      likes: number;
      shares: number;
      comments: number;
    };
  }[];
}

interface Props {
  className?: string;
}

export default function PerformanceSnapshot({ className = '' }: Props) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/campaigns/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Campaigns"
              value={metrics?.totalCampaigns || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Submitted"
              value={metrics?.submittedCampaigns || 0}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Approved"
              value={metrics?.approvedCampaigns || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Engagement"
              value={metrics?.totalEngagement || 0}
              prefix={<LikeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Submissions" className="mt-6" loading={loading}>
        <List
          dataSource={metrics?.recentSubmissions || []}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={item.campaignTitle}
                description={new Date(item.submittedAt).toLocaleDateString()}
              />
              {item.engagement && (
                <div className="flex space-x-4">
                  <Tag icon={<LikeOutlined />} color="blue">
                    {item.engagement.likes}
                  </Tag>
                  <Tag icon={<ShareAltOutlined />} color="green">
                    {item.engagement.shares}
                  </Tag>
                  <Tag icon={<CommentOutlined />} color="orange">
                    {item.engagement.comments}
                  </Tag>
                </div>
              )}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
} 