import React, { useCallback, useEffect, useState } from 'react';
import { Drawer, Space, Typography, message } from 'antd';
import { documentsApi } from '@/api/documentsApi';
import type { DocumentItem } from '@/types/claim.types';
import DocumentList from './DocumentList';
import FileUploadZone from '@/components/shared/FileUploadZone';

const { Text } = Typography;

interface DocumentDrawerProps {
  open: boolean;
  claimId: string | null;
  onClose: () => void;
}

const DocumentDrawer: React.FC<DocumentDrawerProps> = ({ open, claimId, onClose }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const loadDocuments = useCallback(async () => {
    if (!claimId) return;
    try {
      const response = await documentsApi.getDocuments(claimId);
      setDocuments(response.documents);
    } catch {
      void message.error('Failed to load documents.');
    }
  }, [claimId]);

  useEffect(() => {
    if (open) {
      void loadDocuments();
    }
  }, [loadDocuments, open]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={`Documents — ${claimId?.slice(0, 8) ?? ''}`}
      destroyOnClose
    >
      {claimId ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <FileUploadZone claimId={claimId} documentCount={documents.length} onUploaded={() => void loadDocuments()} />
          <div>
            <Text type="secondary">{documents.length} of 5 documents used</Text>
            <DocumentList claimId={claimId} documents={documents} onDeleted={() => void loadDocuments()} />
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
};

export default DocumentDrawer;
