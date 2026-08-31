import React, { useMemo, useState } from 'react';
import { Button, Empty, List, Space, Tag, Typography, message } from 'antd';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { documentsApi } from '@/api/documentsApi';
import type { DocumentItem } from '@/types/claim.types';
import { FILE_TYPE_CONFIG, formatBytes } from '@/utils/fileUtils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const { Text } = Typography;

interface DocumentListProps {
  claimId: string;
  documents: DocumentItem[];
  onDeleted: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ claimId, documents, onDeleted }) => {
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedDocuments = useMemo(
    () => [...documents].sort((a, b) => new Date(b.uploaded_on).getTime() - new Date(a.uploaded_on).getTime()),
    [documents],
  );

  const getFileConfig = (doc: DocumentItem) => {
    const extension = doc.file_name.split('.').pop()?.toLowerCase() ?? doc.file_type.toLowerCase();
    return FILE_TYPE_CONFIG[extension as keyof typeof FILE_TYPE_CONFIG] ?? { color: 'default', label: extension.toUpperCase() };
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const { blob, filename } = await documentsApi.downloadDocument(claimId, doc.document_id);
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch {
      void message.error('Unable to download document.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await documentsApi.deleteDocument(claimId, deleteTarget.document_id);
      void message.success('Document deleted.');
      onDeleted();
      setDeleteTarget(null);
    } catch {
      void message.error('Unable to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (documents.length === 0) {
    return <Empty description="No documents uploaded yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <>
      <List
        dataSource={sortedDocuments}
        renderItem={(item) => {
          const config = getFileConfig(item);
          return (
            <List.Item
              actions={[
                <Button key="download" icon={<DownloadOutlined />} size="small" onClick={() => void handleDownload(item)}>
                  Download
                </Button>,
                <Button key="delete" danger icon={<DeleteOutlined />} size="small" onClick={() => setDeleteTarget(item)}>
                  Delete
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{item.file_name}</Text>
                    <Tag color={config.color}>{config.label}</Tag>
                    <Tag>{item.document_tag}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{formatBytes(item.file_size_bytes)}</Text>
                    <Text type="secondary">Uploaded {new Date(item.uploaded_on).toLocaleString()}</Text>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Document"
        description={deleteTarget ? `Delete ${deleteTarget.file_name}?` : ''}
        okText="Delete"
        okDanger
        loading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default DocumentList;
