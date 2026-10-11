import { GitCompare, Info, Lightbulb, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { OpenEssentialForm } from '../App';
import { CompareModal } from '../components/CompareModal';
import { ProductCard } from '../components/ProductCard';
import { InlineError } from '../components/StateMessages';
import { useAppData } from '../context/AppDataContext';
import { sendChatMessage } from '../services/api';
import { EXAMPLE_PROMPTS } from '../services/mockAssistant';
import { createId } from '../services/storage';
import type { ChatMessage, ScoredProduct } from '../types';

export function Assistant({ openForm }: { openForm: OpenEssentialForm }) {
  const { chat, setChat, essentials } = useAppData();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<{ message: string; retryText: string } | null>(null);
  const [compare, setCompare] = useState<ScoredProduct[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.length, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setDraft('');
    setSending(true);
    const userMessage: ChatMessage = { id: createId('msg'), role: 'user', text: trimmed, createdAt: new Date().toISOString() };
    setChat((prev) => [...prev, userMessage]);
    try {
      const response = await sendChatMessage(trimmed);
      setChat((prev) => [
        ...prev,
        { id: createId('msg'), role: 'assistant', text: response.text, createdAt: new Date().toISOString(), response },
      ]);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'The assistant couldn’t respond.', retryText: trimmed });
      // Remove the unanswered message so retrying doesn't duplicate it.
      setChat((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  function toggleCompare(scored: ScoredProduct) {
    setCompare((prev) => {
      if (prev.some((s) => s.product.id === scored.product.id)) return prev.filter((s) => s.product.id !== scored.product.id);
      // Keep at most two: adding a third replaces the oldest pick.
      return [...prev, scored].slice(-2);
    });
  }

  function track(scored: ScoredProduct) {
    const { product } = scored;
    openForm({
      initial: {
        name: product.name,
        category: product.category,
        unit: product.trackingUnit,
        productId: product.id,
        reminderLeadDays: 7,
      },
    });
  }

  const trackedIds = new Set(essentials.map((e) => e.productId).filter(Boolean));

  return (
    <div className="page assistant-page">
      <header className="page-header">
        <div>
          <h1>Shopping assistant</h1>
          <p className="muted">Describe what you need and your budget. I’ll compare options from the demo catalog.</p>
        </div>
      </header>

      <div className="notice" role="note">
        <Info size={20} aria-hidden="true" />
        <p>
          <strong>Demo content.</strong> Answers come from a small sample catalog with fictional brands and illustrative prices.
          Scores use a simple demo formula. There’s no live research and no customer reviews.
        </p>
      </div>

      <section className="chat card" aria-label="Conversation">
        <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions">
          {chat.length === 0 && (
            <div className="chat-welcome">
              <span className="empty-icon" aria-hidden="true">
                <Sparkles size={26} />
              </span>
              <h2>What are you shopping for?</h2>
              <p className="muted">Try one of these to get started:</p>
              <div className="prompt-list">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" className="prompt-chip" onClick={() => send(prompt)} disabled={sending}>
                    <Lightbulb size={16} aria-hidden="true" /> {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="bubble-row user">
                <p className="bubble user">
                  <span className="visually-hidden">You said: </span>
                  {message.text}
                </p>
              </div>
            ) : (
              <div key={message.id} className="bubble-row assistant">
                <div className="assistant-reply">
                  <p className="bubble assistant">
                    <span className="visually-hidden">Assistant: </span>
                    {message.text}
                  </p>
                  {message.response?.verdict && (
                    <p className="verdict">
                      <strong>Demo verdict:</strong> {message.response.verdict}
                    </p>
                  )}
                  {message.response && message.response.products.length > 0 && (
                    <div className="product-grid">
                      {message.response.products.map((scored) => (
                        <ProductCard
                          key={scored.product.id}
                          scored={scored}
                          selectedForCompare={compare.some((c) => c.product.id === scored.product.id)}
                          tracked={trackedIds.has(scored.product.id)}
                          onToggleCompare={() => toggleCompare(scored)}
                          onTrack={() => track(scored)}
                        />
                      ))}
                    </div>
                  )}
                  {message.response && message.response.suggestions.length > 0 && (
                    <div className="prompt-list compact">
                      {message.response.suggestions.map((s) => (
                        <button key={s} type="button" className="prompt-chip" onClick={() => send(s)} disabled={sending}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}

          {sending && (
            <div className="bubble-row assistant" role="status">
              <p className="bubble assistant typing">
                <span className="dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                Checking the demo catalog…
              </p>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <div className="chat-error">
            <InlineError message={error.message} />
            <button type="button" className="button secondary small" onClick={() => send(error.retryText)}>
              Try again
            </button>
          </div>
        )}

        <form className="chat-input" onSubmit={handleSubmit}>
          <label htmlFor="chat-message" className="visually-hidden">
            Message the shopping assistant
          </label>
          <input
            id="chat-message"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Find dish soap under $5"
            autoComplete="off"
            maxLength={300}
          />
          <button type="submit" className="button primary" disabled={sending || !draft.trim()} aria-label="Send message">
            <Send size={18} aria-hidden="true" />
            <span className="hide-small">Send</span>
          </button>
        </form>
      </section>

      {compare.length > 0 && (
        <div className="compare-tray" role="region" aria-label="Compare selection">
          <div className="compare-picks">
            <GitCompare size={18} aria-hidden="true" />
            <span>
              {compare.length === 1 ? 'Pick one more product to compare: ' : 'Ready to compare: '}
              <strong>{compare.map((c) => c.product.brand).join(' vs ')}</strong>
            </span>
          </div>
          <div className="compare-actions">
            <button type="button" className="button ghost small" onClick={() => setCompare([])}>
              <X size={16} aria-hidden="true" /> Clear
            </button>
            <button
              type="button"
              className="button primary small"
              disabled={compare.length < 2}
              onClick={() => setShowCompare(true)}
            >
              Compare side by side
            </button>
          </div>
        </div>
      )}

      {showCompare && compare.length === 2 && (
        <CompareModal products={[compare[0], compare[1]]} onClose={() => setShowCompare(false)} />
      )}
    </div>
  );
}
