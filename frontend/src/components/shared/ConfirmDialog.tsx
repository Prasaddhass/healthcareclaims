/**
 * ConfirmDialog — reusable antd Modal for destructive actions (delete, send).
 * maskClosable=false prevents accidental dismissal.
 */
import { Modal } from 'antd';

interface ConfirmDialogProps {
  open:        boolean;
  title:       string;
  description: React.ReactNode;
  okText?:     string;
  okDanger?:   boolean;
  loading:     boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  okText    = 'Confirm',
  okDanger  = false,
  loading,
  onConfirm,
  onCancel,
}) => (
  <Modal
    open={open}
    title={title}
    onOk={onConfirm}
    onCancel={onCancel}
    confirmLoading={loading}
    maskClosable={false}
    okText={okText}
    okButtonProps={{ danger: okDanger, loading }}
    cancelButtonProps={{ disabled: loading }}
    data-testid="confirm-dialog"
  >
    {description}
  </Modal>
);

export default ConfirmDialog;
