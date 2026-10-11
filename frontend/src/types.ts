// Shared types used by components and the service layer.
// When the backend is ready, API responses should match these shapes
// (or be mapped into them inside src/services/api.ts).

export const CATEGORIES = [
  'Laundry',
  'Oral care',
  'Paper goods',
  'Kitchen',
  'Cleaning',
  'Personal care',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** A household item the user keeps track of. */
export interface Essential {
  id: string;
  name: string;
  category: Category;
  /** Optional link to the product page on Amazon. Not used for purchasing. */
  productUrl?: string;
  /** Set when the item was tracked from a product in the assistant. */
  productId?: string;
  remainingQuantity: number;
  /** e.g. "loads", "tubes", "rolls" */
  unit: string;
  /** How many units are used per day, on average. Must be greater than 0. */
  dailyUsage: number;
  /** How many days before running out the user wants a reminder. */
  reminderLeadDays: number;
  createdAt: string;
  updatedAt: string;
}

/** The fields a user can set when adding or editing an essential. */
export type EssentialInput = Omit<Essential, 'id' | 'createdAt' | 'updatedAt'>;

export type EssentialStatus = 'good' | 'low' | 'review';

export type ReorderStatus = 'awaiting' | 'snoozed' | 'approved' | 'dismissed';

/** A suggested (demo) reorder for an essential that is running out. */
export interface ReorderProposal {
  id: string;
  essentialId: string;
  productName: string;
  packSize: string;
  quantity: number;
  /** Illustrative price in USD. Not a live price. */
  illustrativePrice: number;
  reason: string;
  status: ReorderStatus;
  createdAt: string;
  decidedAt?: string;
  /** Only set when status is "snoozed". */
  remindAt?: string;
  /** Set when the user marks an approved demo reorder as arrived and updates their stock. */
  receivedAt?: string;
}

/** A product in the local demo catalog. Brands are fictional. */
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  packSize: string;
  /** Number of units in the pack, used for price-per-unit comparisons. */
  unitCount: number;
  /** Singular unit label, e.g. "load", "oz", "sheet". */
  unitLabel: string;
  /** The unit an essential uses when this product is tracked, e.g. "loads". */
  trackingUnit: string;
  /** Illustrative price in USD. */
  price: number;
  /** 0-100 quality rating assigned for this prototype (not customer reviews). */
  demoQuality: number;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
}

export interface WorthItScore {
  /** 0-100 overall demo score. */
  total: number;
  /** 0-100, based on price per unit compared with similar demo products. */
  value: number;
  /** 0-100, the demo quality rating. */
  quality: number;
  /** Plain-language lines explaining how the score was calculated. */
  explanation: string[];
}

export interface ScoredProduct {
  product: Product;
  score: WorthItScore;
  pricePerUnit: number;
}

export interface ChatResponse {
  id: string;
  text: string;
  products: ScoredProduct[];
  /** A short "is it worth it" conclusion, when the question asks for one. */
  verdict?: string;
  /** Follow-up prompts the user can click. */
  suggestions: string[];
  /** True when the request fell outside the demo dataset. */
  isFallback: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  response?: ChatResponse;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
  /** Monthly budget for household essentials, in USD. */
  monthlyBudget: number;
  /** Default price limit the assistant uses when a message has no budget. Empty = no limit. */
  itemPriceLimit: number | null;
  preferEcoFriendly: boolean;
  notifications: {
    lowStockAlerts: boolean;
    reorderSuggestions: boolean;
    weeklySummary: boolean;
    channel: 'in-app' | 'email';
  };
}
