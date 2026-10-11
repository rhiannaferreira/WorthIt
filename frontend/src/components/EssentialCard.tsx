import { ExternalLink, Minus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Essential } from '../types';
import { daysLeftFor, describeDaysLeft, formatQuantity, getStatus, runOutDate } from '../utils/essentials';
import { findDemoProduct, formatUnitPrice } from '../services/mockAssistant';
import { ProductArt } from './ProductArt';
import { StatusBadge } from './StatusBadge';

interface EssentialCardProps {
  item: Essential;
  onUpdateQuantity?: (item: Essential) => void;
  /** Subtracts one unit. */
  onUseOne?: (item: Essential) => Promise<void>;
  onEdit?: (item: Essential) => void;
  onDelete?: (item: Essential) => void;
}

export function EssentialCard({ item, onUpdateQuantity, onUseOne, onEdit, onDelete }: EssentialCardProps) {
  const [using, setUsing] = useState(false);
  const status = getStatus(item);
  const days = daysLeftFor(item);
  const date = runOutDate(days);
  // The bar is full at 30+ days so it is easy to compare items at a glance.
  const fill = days === null ? 0 : Math.max(4, Math.min(100, (days / 30) * 100));
  const hasActions = onUpdateQuantity || onEdit || onDelete;

  const product = findDemoProduct(item.productId);

  return (
    <article className={`shelf-tag status-${status}`}>
      <StatusBadge status={status} variant="ribbon" />
      <header className="tag-head">
        <ProductArt category={item.category} size={44} />
        <div className="tag-title">
          <span className="tag-category">{item.category}</span>
          <h3>{item.name}</h3>
        </div>
      </header>

      <div className="tag-price">
        <p className="tag-days">
          <b>{days === null ? '—' : days}</b>
          <span>{days === 1 ? 'day left' : 'days left'}</span>
        </p>
        <p className="tag-meta">
          <b>
            {formatQuantity(item.remainingQuantity)} {item.unit}
          </b>
          <span>{product ? formatUnitPrice(product) : 'remaining'}</span>
        </p>
      </div>

      <div className={`meter meter-${status}`} aria-hidden="true">
        <span style={{ width: `${fill}%` }} />
      </div>
      <p className="tag-foot">
        {days === null ? 'No estimate yet' : date ? `Runs out around ${date}` : describeDaysLeft(days)} · estimate
      </p>

      {item.productUrl && (
        <a className="text-link small" href={item.productUrl} target="_blank" rel="noopener noreferrer">
          View product link <ExternalLink size={14} aria-hidden="true" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      )}

      {hasActions && (
        <div className="card-actions">
          {onUseOne && (
            <button
              type="button"
              className="button secondary small"
              disabled={using || item.remainingQuantity <= 0}
              onClick={async () => {
                setUsing(true);
                try {
                  await onUseOne(item);
                } finally {
                  setUsing(false);
                }
              }}
              aria-label={`Used one: subtract 1 from ${item.name}`}
              title="Used one"
            >
              <Minus size={16} aria-hidden="true" /> 1
            </button>
          )}
          {onUpdateQuantity && (
            <button type="button" className="button secondary small" onClick={() => onUpdateQuantity(item)}>
              Update
            </button>
          )}
          {onEdit && (
            <button type="button" className="icon-button push-right" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>
              <Pencil size={18} aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="icon-button danger"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
