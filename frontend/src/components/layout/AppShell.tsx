import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const { Sider, Content } = Layout;

/**
 * AppShell — main authenticated layout.
 * Contains the sidebar navigation and the content area (Outlet renders child routes).
 */
const AppShell: React.FC = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Sider width={220} theme="dark" collapsible breakpoint="lg">
      <Sidebar />
    </Sider>
    <Layout>
      <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
        <Outlet />
      </Content>
    </Layout>
  </Layout>
);

export default AppShell;
