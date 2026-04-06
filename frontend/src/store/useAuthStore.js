import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const emptyAuth = { token: null, role: null, user: null };

export const useAuthStore = create(
  persist(
    (set) => ({
      ...emptyAuth,
      setSession: ({ token, role, user }) =>
        set({
          token: token ?? null,
          role: role ?? null,
          user: user ?? null,
        }),
      logout: () => set(emptyAuth),
    }),
    {
      name: 'book_app_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        user: state.user,
      }),
    }
  )
);