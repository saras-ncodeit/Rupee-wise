import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TransactionDraft {
  id: string;
  accountId: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  date: string;
  description: string;
  transferToAccountId?: string;
  createdAt: number;
  idempotencyKey: string;
}

interface AppState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  
  user: { id: string; email: string; fullName: string; avatarUrl?: string } | null;
  setUser: (user: AppState['user']) => void;
  
  token: string | null;
  setToken: (token: string | null) => void;
  
  activeHouseholdId: string | null;
  setActiveHouseholdId: (id: string | null) => void;
  
  draftTransactions: TransactionDraft[];
  addDraftTransaction: (draft: Omit<TransactionDraft, 'id' | 'createdAt' | 'idempotencyKey'>) => void;
  removeDraftTransaction: (id: string) => void;
  clearDraftTransactions: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'light') {
          document.documentElement.classList.add('light-theme');
        } else {
          document.documentElement.classList.remove('light-theme');
        }
      },
      
      user: null,
      setUser: (user) => set({ user }),
      
      token: null,
      setToken: (token) => set({ token }),
      
      activeHouseholdId: null,
      setActiveHouseholdId: (activeHouseholdId) => set({ activeHouseholdId }),
      
      draftTransactions: [],
      addDraftTransaction: (draft) => {
        const newDraft: TransactionDraft = {
          ...draft,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          idempotencyKey: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        };
        set((state) => ({
          draftTransactions: [newDraft, ...state.draftTransactions],
        }));
      },
      removeDraftTransaction: (id) => {
        set((state) => ({
          draftTransactions: state.draftTransactions.filter((d) => d.id !== id),
        }));
      },
      clearDraftTransactions: () => set({ draftTransactions: [] }),
    }),
    {
      name: 'rupeewise-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        token: state.token,
        activeHouseholdId: state.activeHouseholdId,
        draftTransactions: state.draftTransactions,
      }),
    },
  ),
);
