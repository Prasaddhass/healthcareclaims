import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you are looking for does not exist."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTES.CLAIMS)}>
          Back to Claims
        </Button>
      }
    />
  );
};

export default NotFoundPage;
