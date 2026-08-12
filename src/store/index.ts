import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...userData } : null;
      if (typeof window !== 'undefined' && updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
