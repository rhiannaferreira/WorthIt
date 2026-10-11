import type { Essential, EssentialStatus } from '../types';

/** Items within this many days of their reminder window count as "Running low". */
export const LOW_BUFFER_DAYS = 7;

/**
 * Estimated whole days until the item runs out: remaining quantity / daily usage.
 * Returns null when the estimate can't be made (zero, negative or invalid usage).
 */
export function estimateDaysLeft(remainingQuantity: number, dailyUsage: number): number | null {
  if (!Number.isFinite(remainingQuantity) || !Number.isFinite(dailyUsage)) return null;
  if (dailyUsage <= 0 || remainingQuantity < 0) return null;
  return Math.floor(remainingQuantity / dailyUsage);
}

export function daysLeftFor(item: Essential): number | null {
  return estimateDaysLeft(item.remainingQuantity, item.dailyUsage);
}

/**
 * - "review": out of stock, inside the reminder window, or no usable estimate.
 * - "low": within a week of the reminder window.
 * - "good": everything else.
 */
export function getStatus(item: Essential): EssentialStatus {
  const days = daysLeftFor(item);
  if (days === null || item.remainingQuantity <= 0) return 'review';
  if (days <= item.reminderLeadDays) return 'review';
  if (days <= item.reminderLeadDays + LOW_BUFFER_DAYS) return 'low';
  return 'good';
}

export const STATUS_LABELS: Record<EssentialStatus, string> = {
  good: 'Looking good',
  low: 'Running low',
  review: 'Needs review',
};

export function describeDaysLeft(days: number | null): string {
  if (days === null) return 'No estimate yet';
  if (days === 0) return 'Runs out today';
  if (days === 1) return 'About 1 day left';
  return `About ${days} days left`;
}

/** Estimated run-out date, formatted like "Oct 24". */
export function runOutDate(days: number | null): string | null {
  if (days === null) return null;
  const date = new Date(Date.now() + days * 86_400_000);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

export function formatPrice(value: number): string {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

/** Sort helper: most urgent first, items without an estimate at the top. */
export function byUrgency(a: Essential, b: Essential): number {
  const da = daysLeftFor(a) ?? -1;
  const db = daysLeftFor(b) ?? -1;
  return da - db;
}
