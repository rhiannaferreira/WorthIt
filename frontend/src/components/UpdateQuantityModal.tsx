import { Minus, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAppData } from '../context/AppDataContext';
import type { Essential } from '../types';
import { describeDaysLeft, estimateDaysLeft, formatQuantity } from '../utils/essentials';
import { validateQuantity } from '../utils/validation';
import { Modal } from './Modal';
import { InlineError } from './StateMessages';
import { useToast } from './Toast';

interface UpdateQuantityModalProps {
  item: Essential;
  onClose: () => void;
  title?: string;
  /** Extra text under the title, e.g. which delivery arrived. */
  note?: string;
  /** Runs after the quantity is saved. */
  onSaved?: (quantity: number) => Promise<void> | void;
}

export function UpdateQuantityModal({ item, onClose, title = 'Update remaining quantity', note, onSaved }: UpdateQuantityModalProps) {
  const { updateEssential } = useAppData();
  const toast = useToast();
  const [value, setValue] = useState(formatQuantity(item.remainingQuantity));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const quantity = value.trim() === '' ? Number.NaN : Number(value);
  const preview = estimateDaysLeft(quantity, item.dailyUsage);

  function step(delta: number) {
    const base = Number.isFinite(quantity) ? quantity : item.remainingQuantity;
    setValue(formatQuantity(Math.max(0, Math.round((base + delta) * 100) / 100)));
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = validateQuantity(quantity);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      await updateEssential(item.id, { remainingQuantity: quantity });
      await onSaved?.(quantity);
      toast(`Updated ${item.name} to ${formatQuantity(quantity)} ${item.unit}.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal
      title={title}
      description={note ?? item.name}
      onClose={onClose}
      size="small"
      busy={saving}
      footer={
        <>
          <button type="button" className="button secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="quantity-form" className="button primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save quantity'}
          </button>
        </>
      }
    >
      <form id="quantity-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="quantity-input">Remaining {item.unit}</label>
        <div className="stepper">
          <button type="button" className="icon-button" onClick={() => step(-1)} aria-label={`Remove one ${item.unit}`}>
            <Minus size={18} aria-hidden="true" />
          </button>
          <input
            id="quantity-input"
            data-autofocus
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={value}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
          />
          <button type="button" className="icon-button" onClick={() => step(1)} aria-label={`Add one ${item.unit}`}>
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="muted small" aria-live="polite">
          {preview === null ? 'Enter a valid quantity to see an estimate.' : `${describeDaysLeft(preview)} (estimate).`}
        </p>
      </form>
      <InlineError message={error} />
    </Modal>
  );
}
