import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Layout, Typography } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import LoginForm from '@/components/auth/LoginForm';
import { useAuthStore } from '@/stores/useAuthStore';

const { Content } = Layout;
const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate          = useNavigate();
  const isAuthenticated   = useAuthStore((s) => s.isAuthenticated);

  // Set document title
  useEffect(() => {
    document.title = 'Login \u2014 Healthcare Claims';
    return () => {
      document.title = 'Healthcare Claims';
    };
  }, []);

  // Redirect already-authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/claims', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '24px',
        }}
      >
        <Card
          style={{ width: '100%', maxWidth: 440 }}
          styles={{ body: { padding: '40px 32px' } }}
        >
          {/* Branding header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <MedicineBoxOutlined style={{ fontSize: 40, color: '#1677ff' }} />
            <Title level={3} style={{ margin: '12px 0 4px' }}>
              Healthcare Claims
            </Title>
            <Text type="secondary">CMS-1500 Claims Management Portal</Text>
          </div>

          <LoginForm />
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;
