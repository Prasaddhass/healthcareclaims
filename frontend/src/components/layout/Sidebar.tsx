import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Dropdown, Menu, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { ROUTES } from '@/constants/routes';
import AIAssistPanel from '@/components/shared/AIAssistPanel';

const { Text } = Typography;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'username', label: <Text strong>{user?.username}</Text>, disabled: true },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: () => void handleLogout() },
  ];

  const navItems: MenuProps['items'] = [
    { key: ROUTES.CLAIMS, icon: <FileTextOutlined />, label: <Link to={ROUTES.CLAIMS}>Claims List</Link> },
    { key: ROUTES.CLAIMS_NEW, icon: <PlusOutlined />, label: <Link to={ROUTES.CLAIMS_NEW}>New Claim</Link> },
    { key: ROUTES.DASHBOARD, icon: <BarChartOutlined />, label: <Link to={ROUTES.DASHBOARD}>Dashboard</Link> },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #303030' }}>
          <MedicineBoxOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <div style={{ color: '#fff', marginTop: 8, fontSize: 13, fontWeight: 600 }}>Healthcare Claims</div>
        </div>

        <Menu theme="dark" mode="inline" items={navItems} style={{ flex: 1, borderRight: 0 }} />

        <div style={{ padding: '0 16px 12px' }}>
          <Button icon={<RobotOutlined />} block onClick={() => setIsAiOpen(true)} aria-label="Open AI assist panel">
            AI Assist
          </Button>
        </div>

        {user ? (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #303030' }}>
            <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
              <Space style={{ cursor: 'pointer', color: '#fff' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <Text style={{ color: '#fff', fontSize: 13 }}>{user.username}</Text>
              </Space>
            </Dropdown>
          </div>
        ) : null}
      </div>
      <AIAssistPanel open={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
};

export default Sidebar;
