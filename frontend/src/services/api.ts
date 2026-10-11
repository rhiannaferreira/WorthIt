// Mock API for the WorthIt prototype.
//
// Every component gets its data through these async functions. Right now they
// read and write localStorage and return demo data after a short delay.
// To connect the real backend, replace the body of each function with a fetch()
// call to the matching endpoint and keep the same signature and return type.
// Example:
//   export async function getEssentials(): Promise<Essential[]> {
//     const res = await fetch(`${API_BASE_URL}/essentials`);
//     if (!res.ok) throw new Error('Could not load essentials.');
//     return res.json();
//   }

import { createDemoEssentials, DEFAULT_SETTINGS, DEMO_PRODUCTS } from '../data/demoData';
import type {
  Category,
  ChatMessage,
  ChatResponse,
  Essential,
  EssentialInput,
  Product,
  ReorderProposal,
  Settings,
} from '../types';
import { daysLeftFor, describeDaysLeft, formatQuantity, getStatus } from '../utils/essentials';
import { validateEssential } from '../utils/validation';
import { buildMockResponse } from './mockAssistant';
import { clearAll, createId, readJson, STORAGE_KEYS, writeJson } from './storage';

const NETWORK_DELAY_MS = 250;
const CHAT_DELAY_MS = 900;
const REMIND_LATER_DAYS = 2;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- local helpers ----------

function loadEssentials(): Essential[] {
  const stored = readJson<Essential[]>(STORAGE_KEYS.essentials);
  if (stored) return stored;
  const seeded = createDemoEssentials();
  writeJson(STORAGE_KEYS.essentials, seeded);
  return seeded;
}

function saveEssentials(items: Essential[]) {
  writeJson(STORAGE_KEYS.essentials, items);
}

function loadReorders(): ReorderProposal[] {
  return readJson<ReorderProposal[]>(STORAGE_KEYS.reorders) ?? [];
}

function saveReorders(items: ReorderProposal[]) {
  writeJson(STORAGE_KEYS.reorders, items);
}

function cleanInput(input: EssentialInput): EssentialInput {
  const productUrl = input.productUrl?.trim();
  return {
    ...input,
    name: input.name.trim(),
    unit: input.unit.trim(),
    productUrl: productUrl ? productUrl : undefined,
  };
}

function assertValid(input: EssentialInput) {
  const errors = Object.values(validateEssential(input));
  if (errors.length > 0) throw new Error(errors[0]);
}

const FALLBACK_PRICES: Record<Category, number> = {
  Laundry: 14.99,
  'Oral care': 6.99,
  'Paper goods': 12.99,
  Kitchen: 4.99,
  Cleaning: 11.99,
  'Personal care': 8.99,
  Other: 9.99,
};

function productFor(item: Essential): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === item.productId);
}

function buildProposal(item: Essential): ReorderProposal {
  const product = productFor(item);
  const days = daysLeftFor(item);
  const usage = `${formatQuantity(item.dailyUsage)} ${item.unit}/day`;
  const reason =
    days === null
      ? 'There’s no usage estimate for this item yet, so it’s worth checking before you run out.'
      : `${describeDaysLeft(days)} (estimate) at about ${usage}, and your reminder is set for ${item.reminderLeadDays} days before running out.`;

  return {
    id: createId('rop'),
    essentialId: item.id,
    productName: product?.name ?? item.name,
    packSize: product?.packSize ?? '1 pack',
    quantity: 1,
    illustrativePrice: product?.price ?? FALLBACK_PRICES[item.category],
    reason,
    status: 'awaiting',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Keeps suggestions in step with the essentials list:
 * - snoozed suggestions come back once their reminder time passes
 * - open suggestions for deleted essentials are removed
 * - one new suggestion is created for each low item that has no open suggestion
 *   and no decision since the item was last updated
 */
function syncReorders(essentials: Essential[], proposals: ReorderProposal[]): ReorderProposal[] {
  const now = Date.now();
  const ids = new Set(essentials.map((e) => e.id));

  const next = proposals
    .map((p): ReorderProposal =>
      p.status === 'snoozed' && p.remindAt && Date.parse(p.remindAt) <= now
        ? { ...p, status: 'awaiting', remindAt: undefined }
        : p,
    )
    .filter((p) => ids.has(p.essentialId) || p.status === 'approved' || p.status === 'dismissed');

  for (const item of essentials) {
    if (getStatus(item) === 'good') continue;
    const related = next.filter((p) => p.essentialId === item.id);
    const hasOpen = related.some((p) => p.status === 'awaiting' || p.status === 'snoozed');
    const decidedSinceUpdate = related.some(
      (p) =>
        (p.status === 'approved' || p.status === 'dismissed') &&
        Date.parse(p.decidedAt ?? p.createdAt) >= Date.parse(item.updatedAt),
    );
    if (!hasOpen && !decidedSinceUpdate) next.push(buildProposal(item));
  }

  return next;
}

// ---------- essentials ----------

export async function getEssentials(): Promise<Essential[]> {
  await wait(NETWORK_DELAY_MS);
  return loadEssentials();
}

export async function addEssential(input: EssentialInput): Promise<Essential> {
  await wait(NETWORK_DELAY_MS);
  const clean = cleanInput(input);
  assertValid(clean);
  const timestamp = new Date().toISOString();
  const item: Essential = { ...clean, id: createId('ess'), createdAt: timestamp, updatedAt: timestamp };
  saveEssentials([...loadEssentials(), item]);
  return item;
}

export async function updateEssential(id: string, changes: Partial<EssentialInput>): Promise<Essential> {
  await wait(NETWORK_DELAY_MS);
  const items = loadEssentials();
  const current = items.find((e) => e.id === id);
  if (!current) throw new Error('That item no longer exists. It may have been deleted.');

  const { id: _id, createdAt, updatedAt: _updatedAt, ...currentInput } = current;
  const clean = cleanInput({ ...currentInput, ...changes });
  assertValid(clean);
  const updated: Essential = { ...clean, id, createdAt, updatedAt: new Date().toISOString() };
  saveEssentials(items.map((e) => (e.id === id ? updated : e)));
  return updated;
}

export async function deleteEssential(id: string): Promise<void> {
  await wait(NETWORK_DELAY_MS);
  const items = loadEssentials();
  if (!items.some((e) => e.id === id)) throw new Error('That item was already deleted.');
  saveEssentials(items.filter((e) => e.id !== id));
  // Open suggestions for this item no longer make sense.
  saveReorders(loadReorders().filter((p) => p.essentialId !== id || p.status === 'approved' || p.status === 'dismissed'));
}

// ---------- reorder suggestions ----------

export async function getReorderProposals(): Promise<ReorderProposal[]> {
  await wait(NETWORK_DELAY_MS);
  const synced = syncReorders(loadEssentials(), loadReorders());
  saveReorders(synced);
  return synced;
}

// Guards against double clicks or repeated requests creating duplicate approvals.
const approvalsInFlight = new Set<string>();

/** Simulated approval. No purchase is made and stock levels are not changed. */
export async function approveReorder(id: string): Promise<ReorderProposal> {
  const existing = loadReorders().find((p) => p.id === id);
  if (!existing) throw new Error('That suggestion no longer exists.');
  if (existing.status === 'approved') return existing;
  if (existing.status === 'dismissed') throw new Error('This suggestion was dismissed, so it can’t be approved.');
  if (approvalsInFlight.has(id)) throw new Error('This approval is already being processed.');

  approvalsInFlight.add(id);
  try {
    await wait(NETWORK_DELAY_MS * 2);
    const current = loadReorders();
    const latest = current.find((p) => p.id === id);
    if (!latest) throw new Error('That suggestion no longer exists.');
    if (latest.status === 'approved') return latest;
    const approved: ReorderProposal = {
      ...latest,
      status: 'approved',
      decidedAt: new Date().toISOString(),
      remindAt: undefined,
    };
    saveReorders(current.map((p) => (p.id === id ? approved : p)));
    return approved;
  } finally {
    approvalsInFlight.delete(id);
  }
}

/** Records that an approved demo reorder arrived. Stock is updated separately by the user. */
export async function markReorderReceived(id: string): Promise<ReorderProposal> {
  await wait(NETWORK_DELAY_MS);
  return setDecision(id, (p) => {
    if (p.status !== 'approved') throw new Error('Only approved reorders can be marked as arrived.');
    return p.receivedAt ? p : { ...p, receivedAt: new Date().toISOString() };
  });
}

export async function dismissReorder(id: string): Promise<ReorderProposal> {
  await wait(NETWORK_DELAY_MS);
  return setDecision(id, (p) => {
    if (p.status === 'approved') throw new Error('This suggestion was already approved in the demo.');
    return { ...p, status: 'dismissed', decidedAt: new Date().toISOString(), remindAt: undefined };
  });
}

export async function remindLater(id: string): Promise<ReorderProposal> {
  await wait(NETWORK_DELAY_MS);
  return setDecision(id, (p) => {
    if (p.status !== 'awaiting' && p.status !== 'snoozed') {
      throw new Error('Only suggestions awaiting approval can be snoozed.');
    }
    const remindAt = new Date(Date.now() + REMIND_LATER_DAYS * 86_400_000).toISOString();
    return { ...p, status: 'snoozed', remindAt };
  });
}

function setDecision(id: string, change: (p: ReorderProposal) => ReorderProposal): ReorderProposal {
  const items = loadReorders();
  const current = items.find((p) => p.id === id);
  if (!current) throw new Error('That suggestion no longer exists.');
  const updated = change(current);
  saveReorders(items.map((p) => (p.id === id ? updated : p)));
  return updated;
}

// ---------- shopping assistant ----------

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) throw new Error('Type a question first.');
  await wait(CHAT_DELAY_MS);
  const trackedProductIds = loadEssentials()
    .map((e) => e.productId)
    .filter((id): id is string => Boolean(id));
  return buildMockResponse(trimmed, { settings: loadSettings(), trackedProductIds });
}

const MAX_SAVED_MESSAGES = 60;

/** Chat history saved in this browser so it survives a refresh. */
export function getChatHistorySync(): ChatMessage[] {
  return readJson<ChatMessage[]>(STORAGE_KEYS.chat) ?? [];
}

export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    writeJson(STORAGE_KEYS.chat, messages.slice(-MAX_SAVED_MESSAGES));
  } catch {
    // Chat history is a convenience; keep working if it can't be saved.
  }
}

// ---------- settings ----------

function loadSettings(): Settings {
  const stored = readJson<Partial<Settings>>(STORAGE_KEYS.settings);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...stored?.notifications },
  };
}

/** Synchronous read of the saved theme, used once at startup to avoid a flash of the wrong theme. */
export function getSavedThemeSync(): Settings['theme'] {
  return loadSettings().theme;
}

export async function getSettings(): Promise<Settings> {
  await wait(NETWORK_DELAY_MS / 2);
  return loadSettings();
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  await wait(NETWORK_DELAY_MS);
  if (!Number.isFinite(settings.monthlyBudget) || settings.monthlyBudget < 0) {
    throw new Error('Monthly budget must be 0 or more.');
  }
  if (settings.itemPriceLimit !== null && (!Number.isFinite(settings.itemPriceLimit) || settings.itemPriceLimit <= 0)) {
    throw new Error('Price limit must be more than 0, or left empty.');
  }
  writeJson(STORAGE_KEYS.settings, settings);
  return settings;
}

/** Clears everything saved in this browser and restores the demo data. */
export async function resetDemoData(): Promise<void> {
  await wait(NETWORK_DELAY_MS);
  clearAll();
  loadEssentials();
}
