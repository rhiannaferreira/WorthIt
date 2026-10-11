import { Bell, Link2Off, RotateCcw, Save, Wallet } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState, InlineError, LoadingState } from '../components/StateMessages';
import { useToast } from '../components/Toast';
import { useAppData } from '../context/AppDataContext';
import type { Settings } from '../types';

interface FormState {
  monthlyBudget: string;
  itemPriceLimit: string;
  preferEcoFriendly: boolean;
  notifications: Settings['notifications'];
}

function toForm(settings: Settings): FormState {
  return {
    monthlyBudget: String(settings.monthlyBudget),
    itemPriceLimit: settings.itemPriceLimit === null ? '' : String(settings.itemPriceLimit),
    preferEcoFriendly: settings.preferEcoFriendly,
    notifications: { ...settings.notifications },
  };
}

export function SettingsView() {
  const { settings, loading, error, reload, saveSettings, resetDemoData } = useAppData();
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(settings ? toForm(settings) : null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Refill the form when settings load or are reset.
  useEffect(() => {
    if (settings) setForm(toForm(settings));
  }, [settings]);

  const dirty = form && settings ? JSON.stringify(form) !== JSON.stringify(toForm(settings)) : false;

  function setNotification<K extends keyof Settings['notifications']>(key: K, value: Settings['notifications'][K]) {
    setForm((prev) => (prev ? { ...prev, notifications: { ...prev.notifications, [key]: value } } : prev));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const monthlyBudget = Number(form.monthlyBudget);
    const itemPriceLimit = form.itemPriceLimit.trim() === '' ? null : Number(form.itemPriceLimit);

    if (form.monthlyBudget.trim() === '' || !Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
      setFormError('Enter a monthly budget of 0 or more.');
      return;
    }
    if (itemPriceLimit !== null && (!Number.isFinite(itemPriceLimit) || itemPriceLimit <= 0)) {
      setFormError('The price limit must be more than 0, or left empty for no limit.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await saveSettings({ monthlyBudget, itemPriceLimit, preferEcoFriendly: form.preferEcoFriendly, notifications: form.notifications });
      toast('Settings saved on this device.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="muted">Preferences are saved in this browser only.</p>
        </div>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !form ? (
        <LoadingState label="Loading settings…" />
      ) : (
        <div className="settings-layout">
          <form className="settings-form" onSubmit={handleSubmit} noValidate>
            <section className="card settings-section" aria-labelledby="budget-heading">
              <h2 id="budget-heading">
                <Wallet size={20} aria-hidden="true" /> Budget
              </h2>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="monthly-budget">Monthly essentials budget (USD)</label>
                  <input
                    id="monthly-budget"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={form.monthlyBudget}
                    onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="price-limit">
                    Default price limit per item <span className="optional">(optional)</span>
                  </label>
                  <input
                    id="price-limit"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    placeholder="No limit"
                    value={form.itemPriceLimit}
                    onChange={(e) => setForm({ ...form, itemPriceLimit: e.target.value })}
                  />
                  <span className="hint">The assistant uses this when your message doesn’t mention a budget.</span>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.preferEcoFriendly}
                  onChange={(e) => setForm({ ...form, preferEcoFriendly: e.target.checked })}
                />
                <span className="toggle-track" aria-hidden="true" />
                <span>
                  Prefer eco-friendly options
                  <span className="hint block">Adds a small bonus to eco-friendly products in demo scores.</span>
                </span>
              </label>
            </section>

            <section className="card settings-section" aria-labelledby="notify-heading">
              <h2 id="notify-heading">
                <Bell size={20} aria-hidden="true" /> Notifications
              </h2>
              <p className="muted small">These are saved preferences only. The prototype doesn’t send any notifications.</p>
              {(
                [
                  ['lowStockAlerts', 'Running-low alerts', 'When an item gets close to running out.'],
                  ['reorderSuggestions', 'Reorder suggestions', 'When a new suggestion is ready to review.'],
                  ['weeklySummary', 'Weekly summary', 'A short recap of your essentials each week.'],
                ] as const
              ).map(([key, label, hint]) => (
                <label className="toggle" key={key}>
                  <input
                    type="checkbox"
                    checked={form.notifications[key]}
                    onChange={(e) => setNotification(key, e.target.checked)}
                  />
                  <span className="toggle-track" aria-hidden="true" />
                  <span>
                    {label}
                    <span className="hint block">{hint}</span>
                  </span>
                </label>
              ))}
              <fieldset className="radio-group">
                <legend>Deliver notifications by</legend>
                {(
                  [
                    ['in-app', 'In the app'],
                    ['email', 'Email'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="radio">
                    <input
                      type="radio"
                      name="channel"
                      value={value}
                      checked={form.notifications.channel === value}
                      onChange={() => setNotification('channel', value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            </section>

            <InlineError message={formError} />
            <div className="form-actions">
              <button type="submit" className="button primary" disabled={saving || !dirty}>
                <Save size={18} aria-hidden="true" /> {saving ? 'Saving…' : dirty ? 'Save settings' : 'Saved'}
              </button>
            </div>
          </form>

          <aside className="settings-side">
            <section className="card settings-section" aria-labelledby="amazon-heading">
              <h2 id="amazon-heading">
                <Link2Off size={20} aria-hidden="true" /> Amazon integration
              </h2>
              <span className="badge badge-neutral">Not connected</span>
              <p>
                Purchasing isn’t connected in this prototype. WorthIt can store an Amazon product link for reference, but it
                can’t sign in to your account, add items to a cart, or place orders.
              </p>
              <p className="muted small">
                Signing in with Login with Amazon only shares basic profile details such as your name and email. It doesn’t
                give an app permission to buy things for you. Real ordering would need a separate, approved purchasing
                integration and your explicit confirmation for each order.
              </p>
              <button type="button" className="button secondary full" disabled>
                Connect Amazon (not available in prototype)
              </button>
            </section>

            <section className="card settings-section" aria-labelledby="reset-heading">
              <h2 id="reset-heading">
                <RotateCcw size={20} aria-hidden="true" /> Demo data
              </h2>
              <p className="muted small">
                Restore the sample essentials, clear reorder decisions and chat history, and reset these settings.
              </p>
              <button type="button" className="button danger-outline full" onClick={() => setConfirmReset(true)}>
                Reset demo data
              </button>
            </section>
          </aside>
        </div>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset demo data?"
          message="This replaces your essentials, reorder suggestions, chat and settings with the original demo data."
          confirmLabel="Reset everything"
          onConfirm={async () => {
            await resetDemoData();
            toast('Demo data restored.');
          }}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
