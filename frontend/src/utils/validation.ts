import { CATEGORIES, type EssentialInput } from '../types';

export type EssentialErrors = Partial<Record<keyof EssentialInput, string>>;

const AMAZON_HOST = /(^|\.)amazon\.[a-z.]+$|(^|\.)a\.co$/i;

export function isAmazonUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && AMAZON_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

/** Shared by the form (for messages) and the service layer (as a safety net). */
export function validateEssential(input: EssentialInput): EssentialErrors {
  const errors: EssentialErrors = {};

  if (!input.name.trim()) errors.name = 'Enter a product name.';
  else if (input.name.trim().length > 80) errors.name = 'Keep the name under 80 characters.';

  if (!CATEGORIES.includes(input.category)) errors.category = 'Choose a category.';

  if (input.productUrl && !isAmazonUrl(input.productUrl)) {
    errors.productUrl = 'Use a full Amazon link, like https://www.amazon.com/dp/…, or leave it empty.';
  }

  if (!Number.isFinite(input.remainingQuantity)) errors.remainingQuantity = 'Enter a number.';
  else if (input.remainingQuantity < 0) errors.remainingQuantity = 'Quantity can’t be negative.';
  else if (input.remainingQuantity > 100000) errors.remainingQuantity = 'That quantity looks too large.';

  if (!input.unit.trim()) errors.unit = 'Enter a unit, like loads or rolls.';
  else if (input.unit.trim().length > 20) errors.unit = 'Keep the unit short.';

  if (!Number.isFinite(input.dailyUsage)) errors.dailyUsage = 'Enter a number.';
  else if (input.dailyUsage <= 0) errors.dailyUsage = 'Daily usage must be more than 0 to estimate days left.';
  else if (input.dailyUsage > 10000) errors.dailyUsage = 'That usage looks too large.';

  if (!Number.isInteger(input.reminderLeadDays)) errors.reminderLeadDays = 'Enter a whole number of days.';
  else if (input.reminderLeadDays < 0 || input.reminderLeadDays > 60) {
    errors.reminderLeadDays = 'Choose between 0 and 60 days.';
  }

  return errors;
}

/** Validates a remaining-quantity update on its own. Returns an error message or null. */
export function validateQuantity(value: number): string | null {
  if (!Number.isFinite(value)) return 'Enter a number.';
  if (value < 0) return 'Quantity can’t be negative.';
  if (value > 100000) return 'That quantity looks too large.';
  return null;
}
