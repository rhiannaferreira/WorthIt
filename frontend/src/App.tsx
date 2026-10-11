import { useEffect, useRef, useState } from 'react';
import { EssentialFormModal } from './components/EssentialFormModal';
import { BottomNav, MobileHeader, Sidebar } from './components/Navigation';
import { ToastProvider } from './components/Toast';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { useHashRoute, type View } from './hooks/useHashRoute';
import type { Essential, EssentialInput } from './types';
import { Assistant } from './views/Assistant';
import { Dashboard } from './views/Dashboard';
import { Essentials } from './views/Essentials';
import { Reorders } from './views/Reorders';
import { SettingsView } from './views/Settings';

/** What the add/edit essential dialog should show. */
export interface EssentialFormRequest {
  item?: Essential;
  initial?: Partial<EssentialInput>;
}

export type OpenEssentialForm = (request?: EssentialFormRequest) => void;

const TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  essentials: 'Essentials',
  reorders: 'Reorder review',
  assistant: 'Shopping assistant',
  settings: 'Settings',
};

function Shell() {
  const { view, navigate } = useHashRoute();
  const { proposals } = useAppData();
  const [formRequest, setFormRequest] = useState<EssentialFormRequest | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const pending = proposals.filter((p) => p.status === 'awaiting').length;

  // Move focus to the new view's content so keyboard and screen reader users land in the right place.
  const firstRender = useRef(true);
  useEffect(() => {
    document.title = `${TITLES[view]} · WorthIt`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus();
  }, [view]);

  const openForm: OpenEssentialForm = (request = {}) => setFormRequest(request);

  return (
    <div className="app-shell">
      {/* A button, not a #link, because the URL hash is used for navigation. */}
      <button type="button" className="skip-link" onClick={() => mainRef.current?.focus()}>
        Skip to content
      </button>
      <Sidebar current={view} pendingReorders={pending} />
      <MobileHeader />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="main">
        {view === 'dashboard' && <Dashboard navigate={navigate} openForm={openForm} />}
        {view === 'essentials' && <Essentials openForm={openForm} />}
        {view === 'reorders' && <Reorders navigate={navigate} />}
        {view === 'assistant' && <Assistant openForm={openForm} />}
        {view === 'settings' && <SettingsView />}
      </main>
      <BottomNav current={view} pendingReorders={pending} />

      {formRequest && (
        <EssentialFormModal item={formRequest.item} initial={formRequest.initial} onClose={() => setFormRequest(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <Shell />
      </AppDataProvider>
    </ToastProvider>
  );
}
