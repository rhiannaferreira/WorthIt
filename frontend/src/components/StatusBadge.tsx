import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { EssentialStatus } from '../types';
import { STATUS_LABELS } from '../utils/essentials';

const ICONS = { good: CheckCircle2, low: Clock, review: AlertCircle };

export function StatusBadge({ status }: { status: EssentialStatus }) {
  const Icon = ICONS[status];
  return (
    <span className={`badge badge-${status}`}>
      <Icon size={14} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
