import { Check, GitCompare, Minus, Plus, ThumbsDown, ThumbsUp } from 'lucide-react';
import { formatUnitPrice } from '../services/mockAssistant';
import type { ScoredProduct } from '../types';
import { formatPrice } from '../utils/essentials';
import { ProductArt } from './ProductArt';

interface ProductCardProps {
  scored: ScoredProduct;
  selectedForCompare: boolean;
  tracked: boolean;
  onToggleCompare: () => void;
  onTrack: () => void;
}

export function scoreTone(total: number) {
  if (total >= 75) return 'high';
  if (total >= 60) return 'mid';
  return 'low';
}

export function ProductCard({ scored, selectedForCompare, tracked, onToggleCompare, onTrack }: ProductCardProps) {
  const { product, score } = scored;
  return (
    <article className={`card product-card${selectedForCompare ? ' selected' : ''}`}>
      <div className="product-head">
        <ProductArt category={product.category} size={60} />
        <div>
          <h4>{product.name}</h4>
          <p className="muted small">
            {product.brand} · {product.packSize}
          </p>
        </div>
        <div className={`score score-${scoreTone(score.total)}`} aria-label={`Demo WorthIt score ${score.total} out of 100`}>
          <strong>{score.total}</strong>
          <span>demo score</span>
        </div>
      </div>

      <p className="price-tag">
        <b>{formatPrice(product.price)}</b>
        <span>
          {formatUnitPrice(product)}
          <small>illustrative price</small>
        </span>
      </p>

      <ul className="feature-list" aria-label="Features">
        {product.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <div className="pros-cons">
        <div>
          <h5>
            <ThumbsUp size={14} aria-hidden="true" /> Pros
          </h5>
          <ul>
            {product.pros.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5>
            <ThumbsDown size={14} aria-hidden="true" /> Cons
          </h5>
          <ul>
            {product.cons.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      <details className="score-details">
        <summary>How is this demo score calculated?</summary>
        <ul>
          {score.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      <div className="card-actions">
        <button
          type="button"
          className={`button small ${selectedForCompare ? 'primary' : 'secondary'}`}
          aria-pressed={selectedForCompare}
          onClick={onToggleCompare}
        >
          {selectedForCompare ? <Minus size={16} aria-hidden="true" /> : <GitCompare size={16} aria-hidden="true" />}
          {selectedForCompare ? 'Remove from compare' : 'Compare'}
        </button>
        <button type="button" className="button secondary small" onClick={onTrack} disabled={tracked}>
          {tracked ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {tracked ? 'Tracked' : 'Track this item'}
        </button>
      </div>
    </article>
  );
}
