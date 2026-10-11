import { AlertCircle, ArrowRight, ClipboardCheck, MessageCircle, Package, PackageOpen, Plus } from 'lucide-react';
import type { OpenEssentialForm } from '../App';
import { BudgetCard } from '../components/BudgetCard';
import { EmptyState } from '../components/EmptyState';
import { EssentialCard } from '../components/EssentialCard';
import { ProductArt } from '../components/ProductArt';
import { ErrorState, LoadingState } from '../components/StateMessages';
import { useAppData } from '../context/AppDataContext';
import type { View } from '../hooks/useHashRoute';
import { byUrgency, formatPrice, getStatus } from '../utils/essentials';

interface DashboardProps {
  navigate: (view: View) => void;
  openForm: OpenEssentialForm;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({ navigate, openForm }: DashboardProps) {
  const { essentials, proposals, settings, loading, error, reload } = useAppData();

  const lowCount = essentials.filter((e) => getStatus(e) !== 'good').length;
  const pending = proposals.filter((p) => p.status === 'awaiting');
  const sorted = [...essentials].sort(byUrgency);
  const categoryFor = (essentialId: string) => essentials.find((e) => e.id === essentialId)?.category ?? 'Other';

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1>This week’s shelf check</h1>
          <p className="muted">Forecasts are estimates based on the usage you entered.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="button secondary" onClick={() => navigate('assistant')}>
            <MessageCircle size={18} aria-hidden="true" /> Open assistant
          </button>
          <button type="button" className="button primary" onClick={() => openForm()}>
            <Plus size={18} aria-hidden="true" /> Add essential
          </button>
        </div>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState label="Loading your essentials…" />
      ) : (
        <>
          <section className="summary-grid" aria-label="Summary">
            <button type="button" className="summary-card" onClick={() => navigate('essentials')}>
              <span className="summary-icon green" aria-hidden="true">
                <Package size={22} />
              </span>
              <span className="summary-value">{essentials.length}</span>
              <span className="summary-label">Tracked essentials</span>
            </button>
            <button type="button" className="summary-card" onClick={() => navigate('essentials')}>
              <span className="summary-icon amber" aria-hidden="true">
                <AlertCircle size={22} />
              </span>
              <span className="summary-value">{lowCount}</span>
              <span className="summary-label">Running low or need review</span>
            </button>
            <button type="button" className="summary-card" onClick={() => navigate('reorders')}>
              <span className="summary-icon blue" aria-hidden="true">
                <ClipboardCheck size={22} />
              </span>
              <span className="summary-value">{pending.length}</span>
              <span className="summary-label">Pending reorder suggestions</span>
            </button>
          </section>

          <div className="dashboard-columns">
            <section aria-labelledby="essentials-heading">
              <div className="section-header">
                <h2 id="essentials-heading">Essentials</h2>
                {essentials.length > 0 && (
                  <button type="button" className="text-button" onClick={() => navigate('essentials')}>
                    Manage all <ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
              {essentials.length === 0 ? (
                <EmptyState
                  icon={PackageOpen}
                  title="Nothing tracked yet"
                  action={
                    <button type="button" className="button primary" onClick={() => openForm()}>
                      <Plus size={18} aria-hidden="true" /> Add your first essential
                    </button>
                  }
                >
                  Add the things you buy again and again, like detergent or toothpaste, and WorthIt will estimate when you’ll run
                  out.
                </EmptyState>
              ) : (
                <div className="essential-grid">
                  {sorted.slice(0, 6).map((item) => (
                    <EssentialCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            <div className="dashboard-side">
              {settings && <BudgetCard proposals={proposals} settings={settings} onEditBudget={() => navigate('settings')} />}
              <section aria-labelledby="pending-heading" className="pending-panel card">
                <div className="section-header">
                  <h2 id="pending-heading">Pending reorders</h2>
                  <span className="demo-pill">Demo</span>
                </div>
                {pending.length === 0 ? (
                  <p className="muted">No suggestions waiting. We’ll suggest a reorder when something gets close to running out.</p>
                ) : (
                  <ul className="pending-list">
                    {pending.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <ProductArt category={categoryFor(p.essentialId)} size={44} />
                        <div>
                          <strong>{p.productName}</strong>
                          <span className="muted small">
                            {p.packSize} · {formatPrice(p.illustrativePrice)} (illustrative)
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="button secondary full" onClick={() => navigate('reorders')}>
                  Review suggestions <ArrowRight size={16} aria-hidden="true" />
                </button>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
