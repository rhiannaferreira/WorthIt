import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { EssentialStatus } from '../types';
import { STATUS_LABELS } from '../utils/essentials';

const ICONS = { good: CheckCircle2, low: Clock, review: AlertCircle };

/** "pill" for lists, "ribbon" for the corner flag on a shelf tag. */
export function StatusBadge({ status, variant = 'pill' }: { status: EssentialStatus; variant?: 'pill' | 'ribbon' }) {
  const Icon = ICONS[status];
  return (
    <span className={variant === 'ribbon' ? `tag-ribbon ribbon-${status}` : `badge badge-${status}`}>
      <Icon size={13} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
