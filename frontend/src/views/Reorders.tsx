import { BellRing, CheckCircle2, ClipboardCheck, Clock, Info, Loader2, PackageCheck, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { ProductArt } from '../components/ProductArt';
import { ErrorState, InlineError, LoadingState } from '../components/StateMessages';
import { useToast } from '../components/Toast';
import { UpdateQuantityModal } from '../components/UpdateQuantityModal';
import { useAppData } from '../context/AppDataContext';
import type { View } from '../hooks/useHashRoute';
import type { Category, ReorderProposal, ReorderStatus } from '../types';
import { formatPrice } from '../utils/essentials';

const STATUS_INFO: Record<ReorderStatus, { label: string; icon: typeof Clock }> = {
  awaiting: { label: 'Awaiting approval', icon: Clock },
  snoozed: { label: 'Reminder set', icon: BellRing },
  approved: { label: 'Approved in demo', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', icon: XCircle },
};

type Action = 'approve' | 'later' | 'dismiss';

function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
}

export function Reorders({ navigate }: { navigate: (view: View) => void }) {
  const { proposals, essentials, loading, error, reload, approveReorder, dismissReorder, remindLater, markReorderReceived } =
    useAppData();
  const [arrival, setArrival] = useState<ReorderProposal | null>(null);
  const arrivalItem = arrival ? essentials.find((e) => e.id === arrival.essentialId) : undefined;
  const toast = useToast();
  // Which proposal is being processed, so its buttons are disabled and can't be clicked twice.
  const [busy, setBusy] = useState<{ id: string; action: Action } | null>(null);
  // A ref updates immediately, so even two clicks in the same instant only run once.
  const inFlight = useRef(false);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  const categoryFor = (p: ReorderProposal): Category =>
    essentials.find((e) => e.id === p.essentialId)?.category ?? 'Other';

  async function run(proposal: ReorderProposal, action: Action) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy({ id: proposal.id, action });
    setActionError(null);
    try {
      if (action === 'approve') {
        await approveReorder(proposal.id);
        toast(`Approved in demo: ${proposal.productName}. No order was placed.`);
      } else if (action === 'later') {
        await remindLater(proposal.id);
        toast(`We’ll remind you about ${proposal.productName} in 2 days.`);
      } else {
        await dismissReorder(proposal.id);
        toast(`Dismissed the suggestion for ${proposal.productName}.`);
      }
    } catch (err) {
      setActionError({ id: proposal.id, message: err instanceof Error ? err.message : 'That didn’t work. Please try again.' });
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  const groups: { status: ReorderStatus; title: string; empty?: string }[] = [
    { status: 'awaiting', title: 'Awaiting approval', empty: 'Nothing is waiting for your approval right now.' },
    { status: 'snoozed', title: 'Reminders set' },
    { status: 'approved', title: 'Approved in demo' },
    { status: 'dismissed', title: 'Dismissed' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Reorder review</h1>
          <p className="muted">Suggestions appear when an item gets close to your reminder lead time.</p>
        </div>
      </header>

      <div className="notice" role="note">
        <Info size={20} aria-hidden="true" />
        <p>
          <strong>Approval is simulated.</strong> Approving a demo reorder doesn’t buy anything, contact a store, or charge you.
          It also doesn’t change your remaining stock; use “Mark as arrived” when a delivery shows up. Prices are
          illustrative.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState label="Loading reorder suggestions…" />
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No reorder suggestions yet"
          action={
            <button type="button" className="button secondary" onClick={() => navigate('essentials')}>
              Go to essentials
            </button>
          }
        >
          When a tracked item is running low, a suggested reorder will show up here for you to review.
        </EmptyState>
      ) : (
        groups.map(({ status, title, empty }) => {
          const items = proposals.filter((p) => p.status === status);
          if (items.length === 0 && !empty) return null;
          return (
            <section key={status} className="reorder-group" aria-labelledby={`group-${status}`}>
              <h2 id={`group-${status}`}>
                {title} <span className="count-pill">{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className="muted">{empty}</p>
              ) : (
                <div className="reorder-list">
                  {items.map((p) => {
                    const info = STATUS_INFO[p.status];
                    const Icon = info.icon;
                    const isBusy = busy?.id === p.id;
                    const open = p.status === 'awaiting' || p.status === 'snoozed';
                    return (
                      <article key={p.id} className={`card reorder-card status-${p.status}`}>
                        <ProductArt category={categoryFor(p)} size={64} />
                        <div className="reorder-main">
                          <div className="reorder-title">
                            <h3>{p.productName}</h3>
                            <span className={`badge reorder-${p.status}`}>
                              <Icon size={14} aria-hidden="true" /> {info.label}
                            </span>
                          </div>
                          <dl className="reorder-facts">
                            <div>
                              <dt>Pack size</dt>
                              <dd>{p.packSize}</dd>
                            </div>
                            <div>
                              <dt>Quantity</dt>
                              <dd>{p.quantity}</dd>
                            </div>
                            <div className="fact-price">
                              <dt>Illustrative price</dt>
                              <dd>{formatPrice(p.illustrativePrice * p.quantity)}</dd>
                            </div>
                          </dl>
                          <p className="reason">
                            <strong>Why: </strong>
                            {p.reason}
                          </p>
                          {p.status === 'snoozed' && (
                            <p className="muted small">We’ll bring this back on {formatDate(p.remindAt)}.</p>
                          )}
                          {p.status === 'approved' && (
                            <p className="muted small">
                              Approved in demo on {formatDate(p.decidedAt)}. No order was placed.
                              {p.receivedAt && ` Marked as arrived on ${formatDate(p.receivedAt)}.`}
                            </p>
                          )}
                          {p.status === 'approved' && !p.receivedAt && essentials.some((e) => e.id === p.essentialId) && (
                            <div className="card-actions">
                              <button type="button" className="button secondary small" onClick={() => setArrival(p)}>
                                <PackageCheck size={16} aria-hidden="true" /> Mark as arrived
                              </button>
                            </div>
                          )}
                          {p.status === 'dismissed' && (
                            <p className="muted small">Dismissed on {formatDate(p.decidedAt)}.</p>
                          )}
                          {actionError?.id === p.id && <InlineError message={actionError.message} />}
                          {open && (
                            <div className="card-actions">
                              <button
                                type="button"
                                className="button primary small"
                                onClick={() => run(p, 'approve')}
                                disabled={Boolean(busy)}
                              >
                                {isBusy && busy?.action === 'approve' ? (
                                  <Loader2 size={16} className="spin" aria-hidden="true" />
                                ) : (
                                  <CheckCircle2 size={16} aria-hidden="true" />
                                )}
                                {isBusy && busy?.action === 'approve' ? 'Approving…' : 'Approve demo reorder'}
                              </button>
                              {p.status === 'awaiting' && (
                                <button
                                  type="button"
                                  className="button secondary small"
                                  onClick={() => run(p, 'later')}
                                  disabled={Boolean(busy)}
                                >
                                  <BellRing size={16} aria-hidden="true" /> Remind me later
                                </button>
                              )}
                              <button
                                type="button"
                                className="button ghost small"
                                onClick={() => run(p, 'dismiss')}
                                disabled={Boolean(busy)}
                              >
                                <XCircle size={16} aria-hidden="true" /> Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      {arrival && arrivalItem && (
        <UpdateQuantityModal
          item={arrivalItem}
          title="Mark as arrived"
          note={`Enter how many ${arrivalItem.unit} of ${arrivalItem.name} you have now that ${arrival.packSize} arrived.`}
          onSaved={() => markReorderReceived(arrival.id)}
          onClose={() => setArrival(null)}
        />
      )}
    </div>
  );
}
