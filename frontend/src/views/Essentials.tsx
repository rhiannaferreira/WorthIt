import { PackageOpen, Plus, Search, SearchX } from 'lucide-react';
import { useState } from 'react';
import type { OpenEssentialForm } from '../App';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { EssentialCard } from '../components/EssentialCard';
import { ErrorState, LoadingState } from '../components/StateMessages';
import { useToast } from '../components/Toast';
import { UpdateQuantityModal } from '../components/UpdateQuantityModal';
import { useAppData } from '../context/AppDataContext';
import { CATEGORIES, type Essential, type EssentialStatus } from '../types';
import { byUrgency, getStatus, STATUS_LABELS } from '../utils/essentials';

type StatusFilter = 'all' | EssentialStatus;

export function Essentials({ openForm }: { openForm: OpenEssentialForm }) {
  const { essentials, loading, error, reload, deleteEssential } = useAppData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [quantityItem, setQuantityItem] = useState<Essential | null>(null);
  const [deleteItem, setDeleteItem] = useState<Essential | null>(null);

  const search = query.trim().toLowerCase();
  const filtered = essentials
    .filter((e) => !search || e.name.toLowerCase().includes(search) || e.category.toLowerCase().includes(search))
    .filter((e) => category === 'all' || e.category === category)
    .filter((e) => status === 'all' || getStatus(e) === status)
    .sort(byUrgency);

  const filtersActive = search !== '' || category !== 'all' || status !== 'all';

  function clearFilters() {
    setQuery('');
    setCategory('all');
    setStatus('all');
  }

  const statusOptions: StatusFilter[] = ['all', 'review', 'low', 'good'];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Essentials</h1>
          <p className="muted">Days left = remaining quantity ÷ daily usage. Every forecast is an estimate.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="button primary" onClick={() => openForm()}>
            <Plus size={18} aria-hidden="true" /> Add essential
          </button>
        </div>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingState label="Loading your essentials…" />
      ) : essentials.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Start tracking your essentials"
          action={
            <button type="button" className="button primary" onClick={() => openForm()}>
              <Plus size={18} aria-hidden="true" /> Add an essential
            </button>
          }
        >
          Add items like detergent, toothpaste or paper towels with how much you have and how fast you use them. WorthIt will
          estimate when they’ll run out and suggest reorders.
        </EmptyState>
      ) : (
        <>
          <div className="toolbar" role="search">
            <div className="search-field">
              <Search size={18} aria-hidden="true" />
              <label htmlFor="essential-search" className="visually-hidden">
                Search essentials
              </label>
              <input
                id="essential-search"
                type="search"
                placeholder="Search by name or category"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <label htmlFor="category-filter" className="visually-hidden">
              Filter by category
            </label>
            <select id="category-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="chip-row" role="group" aria-label="Filter by status">
            {statusOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`chip${status === option ? ' selected' : ''}`}
                aria-pressed={status === option}
                onClick={() => setStatus(option)}
              >
                {option === 'all' ? 'All' : STATUS_LABELS[option]}
                <span className="chip-count">
                  {option === 'all' ? essentials.length : essentials.filter((e) => getStatus(e) === option).length}
                </span>
              </button>
            ))}
          </div>

          <p className="visually-hidden" aria-live="polite">
            Showing {filtered.length} of {essentials.length} essentials
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              action={
                filtersActive && (
                  <button type="button" className="button secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                )
              }
            >
              Nothing matches your search and filters.
            </EmptyState>
          ) : (
            <div className="essential-grid wide">
              {filtered.map((item) => (
                <EssentialCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={setQuantityItem}
                  onEdit={(e) => openForm({ item: e })}
                  onDelete={setDeleteItem}
                />
              ))}
            </div>
          )}
        </>
      )}

      {quantityItem && <UpdateQuantityModal item={quantityItem} onClose={() => setQuantityItem(null)} />}
      {deleteItem && (
        <ConfirmDialog
          title={`Delete ${deleteItem.name}?`}
          message="This removes the item and any open reorder suggestions for it. This can’t be undone."
          confirmLabel="Delete item"
          onConfirm={async () => {
            await deleteEssential(deleteItem.id);
            toast(`Deleted ${deleteItem.name}.`);
          }}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}
