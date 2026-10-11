import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <Loader2 className="spin" size={22} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle size={22} aria-hidden="true" />
      <div>
        <strong>Something went wrong</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="button secondary" onClick={onRetry}>
          <RotateCcw size={16} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

/** Inline error used inside forms and dialogs. */
export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="inline-error" role="alert">
      <AlertTriangle size={16} aria-hidden="true" /> {message}
    </p>
  );
}
