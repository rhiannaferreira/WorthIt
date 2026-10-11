// A deterministic, rule-based stand-in for the real shopping assistant service.
// The same message always gets the same answer. It only knows the small
// demo catalog in src/data/demoData.ts and never claims live research.
//
// When the real assistant is ready, sendChatMessage() in api.ts can call it
// instead of buildMockResponse().

import { DEMO_PRODUCTS } from '../data/demoData';
import type { Category, ChatResponse, Product, ScoredProduct, Settings, WorthItScore } from '../types';
import { formatPrice } from '../utils/essentials';
import { createId } from './storage';

export interface AssistantContext {
  settings: Settings;
  /** Product IDs of essentials the user already tracks. */
  trackedProductIds: string[];
}

const CATEGORY_KEYWORDS: { category: Category; words: string[]; noun: string }[] = [
  { category: 'Kitchen', words: ['dish soap', 'dishwashing', 'dish', 'dishes'], noun: 'dish soaps' },
  { category: 'Personal care', words: ['hand soap', 'handsoap', 'soap'], noun: 'hand soaps' },
  { category: 'Laundry', words: ['detergent', 'laundry', 'pods', 'washing'], noun: 'detergents' },
  { category: 'Oral care', words: ['toothpaste', 'tooth paste', 'teeth', 'dental'], noun: 'toothpastes' },
  { category: 'Paper goods', words: ['paper towel', 'paper towels', 'towels', 'paper'], noun: 'paper towels' },
];

const SUPPORTED_TOPICS = 'detergent, toothpaste, paper towels, dish soap and hand soap';

export const EXAMPLE_PROMPTS = [
  'Find detergent under $20.',
  'Is this toothpaste worth its price?',
  'Find paper towels that are good value.',
];

export function pricePerUnit(product: Product): number {
  return product.price / product.unitCount;
}

export function formatUnitPrice(product: Product): string {
  const ppu = pricePerUnit(product);
  const digits = ppu < 0.1 ? 3 : 2;
  return `$${ppu.toFixed(digits)} per ${product.unitLabel}`;
}

/**
 * Demo WorthIt score:
 *   value   = how cheap the price per unit is compared with similar demo products (30-100)
 *   quality = the demo quality rating set for this prototype (0-100)
 *   total   = 60% value + 40% quality (+5 for eco items when the user prefers them)
 */
export function scoreProduct(product: Product, settings?: Settings): WorthItScore {
  const peers = DEMO_PRODUCTS.filter((p) => p.category === product.category);
  const prices = peers.map(pricePerUnit);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const ppu = pricePerUnit(product);
  const value = max === min ? 80 : Math.round(100 - (70 * (ppu - min)) / (max - min));
  const quality = product.demoQuality;

  let total = Math.round(value * 0.6 + quality * 0.4);
  const rank = [...prices].sort((a, b) => a - b).indexOf(ppu) + 1;
  const rankText = rank === 1 ? 'the lowest' : `#${rank}`;

  const explanation = [
    `${formatUnitPrice(product)}: ${rankText} of ${peers.length} similar demo products.`,
    `Value ${value}/100: a lower price per ${product.unitLabel} scores higher.`,
    `Quality ${quality}/100: a demo rating set for this prototype, not customer reviews.`,
    'Score = 60% value + 40% quality.',
  ];

  if (settings?.preferEcoFriendly && product.tags.includes('eco')) {
    total = Math.min(100, total + 5);
    explanation.push('+5 because you prefer eco-friendly options (Settings).');
  }

  return { total, value, quality, explanation };
}

export function scoreAll(products: Product[], settings?: Settings): ScoredProduct[] {
  return products.map((product) => ({
    product,
    score: scoreProduct(product, settings),
    pricePerUnit: pricePerUnit(product),
  }));
}

function detectCategory(text: string) {
  return CATEGORY_KEYWORDS.find((entry) => entry.words.some((word) => text.includes(word)));
}

function detectBudget(text: string): number | null {
  const match =
    text.match(/(?:under|below|less than|max(?:imum)?|up to|within|budget(?: of| is)?)\s*\$?\s*(\d+(?:\.\d{1,2})?)/) ??
    text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : null;
}

/** Finds a product by brand name. Some brands make more than one product, so prefer the mentioned category. */
function detectProduct(text: string, category?: Category): Product | undefined {
  const matches = DEMO_PRODUCTS.filter((p) => text.includes(p.brand.toLowerCase()));
  return matches.find((p) => p.category === category) ?? matches[0];
}

function followUps(category: Category): string[] {
  switch (category) {
    case 'Laundry':
      return ['Find eco-friendly detergent.', 'Is EverFresh detergent worth its price?'];
    case 'Oral care':
      return ['Find toothpaste for sensitive teeth.', 'Find toothpaste that is good value.'];
    case 'Paper goods':
      return ['Find paper towels under $12.', 'Is Canopy paper towels worth its price?'];
    case 'Kitchen':
      return ['Is GreenLeaf dish soap worth its price?', 'Find detergent under $20.'];
    default:
      return EXAMPLE_PROMPTS;
  }
}

function fallback(text: string): ChatResponse {
  const mentionsBuying = /\b(buy|order|purchase|checkout)\b/.test(text);
  return {
    id: createId('res'),
    text:
      `I couldn't match that to the demo catalog. In this prototype I can only compare a few sample products: ${SUPPORTED_TOPICS}. ` +
      'Try naming one of those, and add a budget like "under $15" if you have one.' +
      (mentionsBuying ? ' I also can’t place orders; purchasing isn’t connected in this prototype.' : ''),
    products: [],
    suggestions: EXAMPLE_PROMPTS,
    isFallback: true,
  };
}

export function buildMockResponse(message: string, context: AssistantContext): ChatResponse {
  const text = message.toLowerCase();
  const categoryMatch = detectCategory(text);
  const named = detectProduct(text, categoryMatch?.category);
  const category = named?.category ?? categoryMatch?.category;

  if (!category) return fallback(text);

  const noun = CATEGORY_KEYWORDS.find((c) => c.category === category)?.noun ?? 'products';
  const { settings } = context;
  const scored = scoreAll(
    DEMO_PRODUCTS.filter((p) => p.category === category),
    settings,
  );
  const byScore = [...scored].sort((a, b) => b.score.total - a.score.total);

  // "Is this ... worth it?"
  if (/worth|good deal|overpriced|should i (buy|get)/.test(text)) {
    const tracked = scored.find((s) => context.trackedProductIds.includes(s.product.id));
    const target =
      scored.find((s) => s.product.id === named?.id) ??
      tracked ??
      [...scored].sort((a, b) => b.product.price - a.product.price)[0];
    const best = byScore.find((s) => s.product.id !== target.product.id);
    const gap = best ? best.score.total - target.score.total : -100;

    let verdict: string;
    if (gap <= 0) {
      verdict = `Worth it. ${target.product.brand} has the best demo WorthIt score among these ${noun}.`;
    } else if (gap <= 6) {
      verdict = `Reasonably worth it. ${best!.product.brand} scores slightly higher, mostly on price per ${target.product.unitLabel}.`;
    } else {
      verdict = `Probably not the best value. ${best!.product.brand} scores ${gap} points higher for a similar job.`;
    }

    const why = tracked && target === tracked && !named ? ' (the one you track)' : '';
    const alternatives = byScore.filter((s) => s.product.id !== target.product.id).slice(0, 2);
    return {
      id: createId('res'),
      text: `Here is how ${target.product.name}${why} compares with similar ${noun} in the demo catalog, at ${formatPrice(target.product.price)} for ${target.product.packSize}.`,
      products: [target, ...alternatives],
      verdict,
      suggestions: followUps(category),
      isFallback: false,
    };
  }

  // "Find ... under $X", "good value", "eco", "sensitive", "compare"
  const budget = detectBudget(text) ?? settings.itemPriceLimit;
  const wantsValue = /value|cheap|afford|save|bulk/.test(text);
  const wantsEco = /eco|green|plastic|sustainab|plant/.test(text);
  const wantsSensitive = /sensitive|gentle|fragrance.free/.test(text);

  let ranked = wantsValue ? [...scored].sort((a, b) => b.score.value - a.score.value) : byScore;
  if (wantsSensitive) ranked = [...ranked].sort((a, b) => Number(b.product.tags.includes('sensitive')) - Number(a.product.tags.includes('sensitive')));
  if (wantsEco) {
    ranked = [...ranked].sort((a, b) => Number(b.product.tags.includes('eco')) - Number(a.product.tags.includes('eco')));
  }

  const withinBudget = budget ? ranked.filter((s) => s.product.price <= budget) : ranked;

  if (budget && withinBudget.length === 0) {
    const cheapest = [...scored].sort((a, b) => a.product.price - b.product.price).slice(0, 2);
    return {
      id: createId('res'),
      text: `None of the demo ${noun} are under ${formatPrice(budget)}. These are the closest options by price.`,
      products: cheapest,
      suggestions: followUps(category),
      isFallback: false,
    };
  }

  const picks = withinBudget.slice(0, 3);
  const top = picks[0];
  const reasons: string[] = [];
  if (budget) reasons.push(`under ${formatPrice(budget)}`);
  if (wantsValue) reasons.push('sorted by price per unit');
  if (wantsSensitive) reasons.push('gentle options first');
  if (wantsEco) reasons.push('eco-friendly options first');

  const intro = /compare|vs|versus|difference/.test(text)
    ? `Here are the top demo ${noun}. Tap Compare on two of them to see them side by side.`
    : `I found ${picks.length} demo ${noun}${reasons.length ? ` (${reasons.join(', ')})` : ''}.`;

  return {
    id: createId('res'),
    text: `${intro} ${top.product.name} stands out with a demo WorthIt score of ${top.score.total}: ${top.product.pros[0].toLowerCase()}.`,
    products: picks,
    suggestions: followUps(category),
    isFallback: false,
  };
}
