import { Wallet } from 'lucide-react';
import type { ReorderProposal, Settings } from '../types';
import { formatPrice } from '../utils/essentials';

interface BudgetCardProps {
  proposals: ReorderProposal[];
  settings: Settings;
  onEditBudget: () => void;
}

const cost = (p: ReorderProposal) => p.illustrativePrice * p.quantity;

/** Compares demo-approved reorders this month with the monthly budget from Settings. */
export function BudgetCard({ proposals, settings, onEditBudget }: BudgetCardProps) {
  const now = new Date();
  const thisMonth = (iso?: string) => {
    if (!iso) return false;
    const date = new Date(iso);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  };

  const approved = proposals.filter((p) => p.status === 'approved' && thisMonth(p.decidedAt)).reduce((sum, p) => sum + cost(p), 0);
  const pending = proposals.filter((p) => p.status === 'awaiting' || p.status === 'snoozed').reduce((sum, p) => sum + cost(p), 0);
  const budget = settings.monthlyBudget;
  const remaining = budget - approved;
  const usedPct = budget > 0 ? Math.min(100, (approved / budget) * 100) : 0;
  const pendingPct = budget > 0 ? Math.min(100 - usedPct, (pending / budget) * 100) : 0;
  const over = approved + pending > budget;
  const month = now.toLocaleDateString(undefined, { month: 'long' });

  return (
    <section className="card budget-card" aria-labelledby="budget-card-heading">
      <div className="section-header">
        <h2 id="budget-card-heading">
          <Wallet size={18} aria-hidden="true" /> {month} budget
        </h2>
        <button type="button" className="text-button small" onClick={onEditBudget}>
          Edit
        </button>
      </div>

      <p className="budget-amount">
        <strong>{formatPrice(approved)}</strong> <span className="muted">of {formatPrice(budget)}</span>
      </p>

      <div
        className="budget-meter"
        role="img"
        aria-label={`${formatPrice(approved)} approved in demo and ${formatPrice(pending)} pending, out of a ${formatPrice(budget)} budget`}
      >
        <span className="used" style={{ width: `${usedPct}%` }} />
        <span className={`pending${over ? ' over' : ''}`} style={{ width: `${pendingPct}%` }} />
      </div>

      <ul className="budget-legend">
        <li>
          <span className="dot used" aria-hidden="true" /> Approved in demo
        </li>
        <li>
          <span className={`dot pending${over ? ' over' : ''}`} aria-hidden="true" /> Pending {formatPrice(pending)}
        </li>
      </ul>

      <p className="muted small">
        {remaining >= 0 ? `${formatPrice(remaining)} left this month.` : `${formatPrice(-remaining)} over budget.`}
        {over && remaining >= 0 && ' Approving every pending suggestion would go over.'} Illustrative prices only.
      </p>
    </section>
  );
}
