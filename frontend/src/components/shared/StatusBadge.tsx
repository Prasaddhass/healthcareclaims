/** StatusBadge — renders a coloured antd Tag for a claim validation status. */
import { Tag } from 'antd';
import { STATUS_BADGE_CONFIG, type ValidationStatus } from '@/constants/claimStatuses';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_BADGE_CONFIG[status as ValidationStatus] ?? {
    color: 'default',
    label: status,
  };
  return <Tag color={config.color}>{config.label}</Tag>;
};

export default StatusBadge;
