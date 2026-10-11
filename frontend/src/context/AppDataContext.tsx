import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import * as api from '../services/api';
import type { ChatMessage, Essential, EssentialInput, ReorderProposal, Settings } from '../types';

// Shared app state. Components read from here and call the actions below,
// which go through the service layer (src/services/api.ts).

interface AppData {
  essentials: Essential[];
  proposals: ReorderProposal[];
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addEssential: (input: EssentialInput) => Promise<Essential>;
  updateEssential: (id: string, changes: Partial<EssentialInput>) => Promise<Essential>;
  deleteEssential: (id: string) => Promise<void>;
  approveReorder: (id: string) => Promise<void>;
  dismissReorder: (id: string) => Promise<void>;
  remindLater: (id: string) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  resetDemoData: () => Promise<void>;
  /** Chat history is kept in memory so it survives switching views. */
  chat: ChatMessage[];
  setChat: Dispatch<SetStateAction<ChatMessage[]>>;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [essentials, setEssentials] = useState<Essential[]>([]);
  const [proposals, setProposals] = useState<ReorderProposal[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);

  // Suggestions depend on essentials, so refresh them after any essentials change.
  const refreshProposals = useCallback(async () => {
    setProposals(await api.getReorderProposals());
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, prefs] = await Promise.all([api.getEssentials(), api.getSettings()]);
      setEssentials(items);
      setSettings(prefs);
      await refreshProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while loading your data.');
    } finally {
      setLoading(false);
    }
  }, [refreshProposals]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addEssential = useCallback(
    async (input: EssentialInput) => {
      const item = await api.addEssential(input);
      setEssentials((prev) => [...prev, item]);
      await refreshProposals();
      return item;
    },
    [refreshProposals],
  );

  const updateEssential = useCallback(
    async (id: string, changes: Partial<EssentialInput>) => {
      const item = await api.updateEssential(id, changes);
      setEssentials((prev) => prev.map((e) => (e.id === id ? item : e)));
      await refreshProposals();
      return item;
    },
    [refreshProposals],
  );

  const deleteEssential = useCallback(
    async (id: string) => {
      await api.deleteEssential(id);
      setEssentials((prev) => prev.filter((e) => e.id !== id));
      await refreshProposals();
    },
    [refreshProposals],
  );

  const replaceProposal = (updated: ReorderProposal) =>
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const approveReorder = useCallback(async (id: string) => replaceProposal(await api.approveReorder(id)), []);
  const dismissReorder = useCallback(async (id: string) => replaceProposal(await api.dismissReorder(id)), []);
  const remindLater = useCallback(async (id: string) => replaceProposal(await api.remindLater(id)), []);

  const saveSettings = useCallback(async (next: Settings) => {
    setSettings(await api.saveSettings(next));
  }, []);

  const resetDemoData = useCallback(async () => {
    await api.resetDemoData();
    setChat([]);
    await reload();
  }, [reload]);

  const value = useMemo<AppData>(
    () => ({
      essentials,
      proposals,
      settings,
      loading,
      error,
      reload,
      addEssential,
      updateEssential,
      deleteEssential,
      approveReorder,
      dismissReorder,
      remindLater,
      saveSettings,
      resetDemoData,
      chat,
      setChat,
    }),
    [essentials, proposals, settings, loading, error, reload, addEssential, updateEssential, deleteEssential,
      approveReorder, dismissReorder, remindLater, saveSettings, resetDemoData, chat],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside <AppDataProvider>.');
  return context;
}
