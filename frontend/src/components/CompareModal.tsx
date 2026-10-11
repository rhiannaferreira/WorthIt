import { formatUnitPrice } from '../services/mockAssistant';
import type { ScoredProduct } from '../types';
import { formatPrice } from '../utils/essentials';
import { Modal } from './Modal';
import { ProductArt } from './ProductArt';
import { scoreTone } from './ProductCard';

export function CompareModal({ products, onClose }: { products: [ScoredProduct, ScoredProduct]; onClose: () => void }) {
  const [a, b] = products;
  const better = (x: number, y: number, lowerIsBetter = false) => (lowerIsBetter ? x < y : x > y);

  const rows: { label: string; render: (s: ScoredProduct) => string; winner?: (s: ScoredProduct, other: ScoredProduct) => boolean }[] = [
    { label: 'Illustrative price', render: (s) => formatPrice(s.product.price), winner: (s, o) => better(s.product.price, o.product.price, true) },
    { label: 'Pack size', render: (s) => s.product.packSize },
    { label: 'Price per unit', render: (s) => formatUnitPrice(s.product), winner: (s, o) => better(s.pricePerUnit, o.pricePerUnit, true) },
    { label: 'Value (demo)', render: (s) => `${s.score.value}/100`, winner: (s, o) => better(s.score.value, o.score.value) },
    { label: 'Quality (demo rating)', render: (s) => `${s.score.quality}/100`, winner: (s, o) => better(s.score.quality, o.score.quality) },
    { label: 'Demo WorthIt score', render: (s) => `${s.score.total}/100`, winner: (s, o) => better(s.score.total, o.score.total) },
  ];

  const sameUnit = a.product.unitLabel === b.product.unitLabel;
  const winner = a.score.total === b.score.total ? null : a.score.total > b.score.total ? a : b;

  return (
    <Modal
      title="Compare products"
      description="Side-by-side demo comparison. Prices are illustrative and scores use the demo formula."
      onClose={onClose}
      size="large"
    >
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Detail</span>
              </th>
              {[a, b].map((s) => (
                <th scope="col" key={s.product.id}>
                  <ProductArt category={s.product.category} size={48} />
                  <span>{s.product.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {[
                  [a, b],
                  [b, a],
                ].map(([s, other]) => {
                  const wins = row.winner?.(s, other) && (sameUnit || row.label !== 'Price per unit');
                  return (
                    <td key={s.product.id} className={wins ? 'wins' : undefined}>
                      {row.label === 'Demo WorthIt score' ? (
                        <span className={`score-inline score-${scoreTone(s.score.total)}`}>{row.render(s)}</span>
                      ) : (
                        row.render(s)
                      )}
                      {wins && <span className="visually-hidden"> (better)</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th scope="row">Pros</th>
              {[a, b].map((s) => (
                <td key={s.product.id}>
                  <ul>
                    {s.product.pros.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Cons</th>
              {[a, b].map((s) => (
                <td key={s.product.id}>
                  <ul>
                    {s.product.cons.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="compare-summary">
        {winner
          ? `${winner.product.name} has the higher demo WorthIt score (${winner.score.total} vs ${(winner === a ? b : a).score.total}).`
          : 'Both products have the same demo WorthIt score.'}
        {!sameUnit && ' These products are measured in different units, so compare price per unit with care.'}
      </p>
    </Modal>
  );
}
