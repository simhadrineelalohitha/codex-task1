import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, cartAPI } from '../api';

// ─── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(persist(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    login: (user, token) => {
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: (user) => set({ user }),

    checkAuth: async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const data = await authAPI.getMe();
        set({ user: data.user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    },
  }),
  { name: 'auth-storage', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
));

// ─── Cart Store ────────────────────────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],
  subtotal: 0,
  isLoading: false,
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const data = await cartAPI.get();
      set({ items: data.items, subtotal: parseFloat(data.subtotal || 0) });
    } catch (e) {
      // Not logged in
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity = 1) => {
    await cartAPI.add({ product_id: productId, quantity });
    get().fetchCart();
  },

  removeFromCart: async (itemId) => {
    await cartAPI.remove(itemId);
    get().fetchCart();
  },

  updateQuantity: async (itemId, quantity) => {
    await cartAPI.update(itemId, { quantity });
    get().fetchCart();
  },

  clearCart: async () => {
    await cartAPI.clear();
    set({ items: [], subtotal: 0 });
  },

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));

// ─── Wishlist Store ────────────────────────────────────────────────────────────
export const useWishlistStore = create((set, get) => ({
  items: [],
  isLoading: false,

  setItems: (items) => set({ items }),

  isInWishlist: (productId) => get().items.some((item) => item.product_id === productId),

  getCount: () => get().items.length,
}));

// ─── UI Store ──────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  aiChatOpen: false,
  searchOpen: false,

  toggleAIChat: () => set((state) => ({ aiChatOpen: !state.aiChatOpen })),
  openAIChat: () => set({ aiChatOpen: true }),
  closeAIChat: () => set({ aiChatOpen: false }),

  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
}));
