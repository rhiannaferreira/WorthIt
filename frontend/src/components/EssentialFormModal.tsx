import { Info } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAppData } from '../context/AppDataContext';
import { CATEGORIES, type Category, type Essential, type EssentialInput } from '../types';
import { describeDaysLeft, estimateDaysLeft } from '../utils/essentials';
import { validateEssential, type EssentialErrors } from '../utils/validation';
import { Modal } from './Modal';
import { InlineError } from './StateMessages';
import { useToast } from './Toast';

const UNIT_SUGGESTIONS = ['loads', 'pods', 'tubes', 'rolls', 'sheets', 'bottles', 'oz', 'bags', 'bars', 'count'];

interface EssentialFormModalProps {
  /** Pass an item to edit it; leave empty to add a new one. */
  item?: Essential;
  /** Pre-filled values for a new item (e.g. from the assistant). */
  initial?: Partial<EssentialInput>;
  onClose: () => void;
  onSaved?: (item: Essential) => void;
}

interface FormState {
  name: string;
  category: Category;
  productUrl: string;
  remainingQuantity: string;
  unit: string;
  dailyUsage: string;
  reminderLeadDays: string;
}

function toFormState(source?: Partial<EssentialInput>): FormState {
  return {
    name: source?.name ?? '',
    category: source?.category ?? 'Laundry',
    productUrl: source?.productUrl ?? '',
    remainingQuantity: source?.remainingQuantity?.toString() ?? '',
    unit: source?.unit ?? '',
    dailyUsage: source?.dailyUsage?.toString() ?? '',
    reminderLeadDays: (source?.reminderLeadDays ?? 7).toString(),
  };
}

/** Empty text becomes NaN so validation can report "Enter a number". */
const toNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export function EssentialFormModal({ item, initial, onClose, onSaved }: EssentialFormModalProps) {
  const { addEssential, updateEssential } = useAppData();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => toFormState(item ?? initial));
  const [errors, setErrors] = useState<EssentialErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(item);

  const input: EssentialInput = {
    name: form.name,
    category: form.category,
    productUrl: form.productUrl.trim() || undefined,
    productId: item?.productId ?? initial?.productId,
    remainingQuantity: toNumber(form.remainingQuantity),
    unit: form.unit,
    dailyUsage: toNumber(form.dailyUsage),
    reminderLeadDays: toNumber(form.reminderLeadDays),
  };
  const previewDays = estimateDaysLeft(input.remainingQuantity, input.dailyUsage);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user edits it.
    if (errors[key as keyof EssentialErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateEssential(input);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstField = Object.keys(found)[0];
      document.getElementById(`field-${firstField}`)?.focus();
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      const saved = isEdit && item ? await updateEssential(item.id, input) : await addEssential(input);
      toast(isEdit ? `Saved changes to ${saved.name}.` : `Now tracking ${saved.name}.`);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  const fieldProps = (key: keyof EssentialErrors) => ({
    id: `field-${key}`,
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `error-${key}` : undefined,
  });

  const fieldError = (key: keyof EssentialErrors) =>
    errors[key] ? (
      <span className="field-error" id={`error-${key}`}>
        {errors[key]}
      </span>
    ) : null;

  return (
    <Modal
      title={isEdit ? 'Edit essential' : 'Add an essential'}
      description="WorthIt uses your quantity and daily usage to estimate when you’ll run out."
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="button secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="essential-form" className="button primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add essential'}
          </button>
        </>
      }
    >
      <form id="essential-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field span-2">
          <label htmlFor="field-name">Product name</label>
          <input
            {...fieldProps('name')}
            data-autofocus
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Laundry detergent"
            autoComplete="off"
          />
          {fieldError('name')}
        </div>

        <div className="field">
          <label htmlFor="field-category">Category</label>
          <select {...fieldProps('category')} value={form.category} onChange={(e) => update('category', e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {fieldError('category')}
        </div>

        <div className="field">
          <label htmlFor="field-unit">Unit</label>
          <input
            {...fieldProps('unit')}
            list="unit-suggestions"
            value={form.unit}
            onChange={(e) => update('unit', e.target.value)}
            placeholder="e.g. loads"
          />
          <datalist id="unit-suggestions">
            {UNIT_SUGGESTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          {fieldError('unit')}
        </div>

        <div className="field">
          <label htmlFor="field-remainingQuantity">Remaining quantity</label>
          <input
            {...fieldProps('remainingQuantity')}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={form.remainingQuantity}
            onChange={(e) => update('remainingQuantity', e.target.value)}
            placeholder="e.g. 24"
          />
          {fieldError('remainingQuantity')}
        </div>

        <div className="field">
          <label htmlFor="field-dailyUsage">Estimated daily usage</label>
          <input
            {...fieldProps('dailyUsage')}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={form.dailyUsage}
            onChange={(e) => update('dailyUsage', e.target.value)}
            placeholder="e.g. 0.5"
          />
          <span className="hint">{form.unit.trim() || 'Units'} used per day, on average.</span>
          {fieldError('dailyUsage')}
        </div>

        <div className="field">
          <label htmlFor="field-reminderLeadDays">Reminder lead time (days)</label>
          <input
            {...fieldProps('reminderLeadDays')}
            type="number"
            inputMode="numeric"
            min="0"
            max="60"
            step="1"
            value={form.reminderLeadDays}
            onChange={(e) => update('reminderLeadDays', e.target.value)}
          />
          <span className="hint">How early to suggest a reorder.</span>
          {fieldError('reminderLeadDays')}
        </div>

        <div className="field">
          <label htmlFor="field-productUrl">
            Amazon product link <span className="optional">(optional)</span>
          </label>
          <input
            {...fieldProps('productUrl')}
            type="url"
            inputMode="url"
            value={form.productUrl}
            onChange={(e) => update('productUrl', e.target.value)}
            placeholder="https://www.amazon.com/dp/…"
          />
          <span className="hint">Saved for reference only. Nothing is purchased.</span>
          {fieldError('productUrl')}
        </div>

        <div className="estimate-preview span-2" aria-live="polite">
          <Info size={18} aria-hidden="true" />
          <span>
            {previewDays === null
              ? 'Enter a quantity and a daily usage above 0 to see an estimate.'
              : `Estimate: ${describeDaysLeft(previewDays).toLowerCase()} (${form.remainingQuantity} ÷ ${form.dailyUsage} per day).`}
          </span>
        </div>
      </form>
      <InlineError message={submitError} />
    </Modal>
  );
}
