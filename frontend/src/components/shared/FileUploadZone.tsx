import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { message, Typography, Upload } from 'antd';
import type { UploadProps } from 'antd/es/upload/interface';
import { documentsApi } from '@/api/documentsApi';

const { Text } = Typography;
const { Dragger } = Upload;
type CustomRequestOptions = Parameters<NonNullable<UploadProps['customRequest']>>[0];

export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'];
export const MAX_SIZE_BYTES = 10_485_760;

interface FileUploadZoneProps {
  claimId: string;
  documentCount: number;
  onUploaded: () => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ claimId, documentCount, onUploaded }) => {
  const disabled = documentCount >= 5;

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      void message.error('Only PDF, Word, text, JPG, and PNG files are allowed.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_SIZE_BYTES) {
      void message.error('File size must be 10 MB or smaller.');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest = async (options: CustomRequestOptions) => {
    const { file, onError, onSuccess } = options;
    try {
      await documentsApi.uploadDocument(claimId, file as File, (percent) => {
        options.onProgress?.({ percent });
      });
      onSuccess?.({}, new XMLHttpRequest());
      onUploaded();
      void message.success('Document uploaded successfully.');
    } catch (error) {
      onError?.(error as Error);
      void message.error('Document upload failed.');
    }
  };

  return (
    <div data-testid="file-upload-zone">
      <Dragger
        accept={ALLOWED_EXTENSIONS.join(',')}
        disabled={disabled}
        beforeUpload={beforeUpload}
        customRequest={(options) => {
          void customRequest(options);
        }}
        maxCount={1}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Drop files here or click to upload</p>
        <Text type="secondary">Up to 5 documents per claim. Maximum file size: 10 MB.</Text>
      </Dragger>
    </div>
  );
};

export default FileUploadZone;
