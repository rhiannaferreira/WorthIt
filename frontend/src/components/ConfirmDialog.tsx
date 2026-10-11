import { useState } from 'react';
import { Modal } from './Modal';
import { InlineError } from './StateMessages';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="small"
      busy={busy}
      footer={
        <>
          <button type="button" className="button secondary" onClick={onClose} disabled={busy} data-autofocus>
            Cancel
          </button>
          <button type="button" className="button danger" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
      <InlineError message={error} />
    </Modal>
  );
}
