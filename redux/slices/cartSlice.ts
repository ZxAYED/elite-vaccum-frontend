import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartProduct } from "@/types/domain";

export interface CartState {
  items: CartProduct[];
  isOpen: boolean;
  /**
   * Set when the cart is emptied in this browsing session (checkout completed,
   * or the user cleared it). Server-cart hydration is suppressed while it is
   * set so a stale `GET /store/cart` response cannot resurrect the old cart.
   * Deliberately not persisted: after a full reload the server is authoritative
   * again.
   */
  clearedAt: number | null;
}

const CART_STORAGE_KEY = "elite_cart_items";

const getInitialItems = (): CartProduct[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const initialState: CartState = {
  items: getInitialItems(),
  isOpen: false,
  clearedAt: null,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartProduct[]>) => {
      state.items = action.payload;
      state.clearedAt = null;
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      }
    },
    addToCart: (state, action: PayloadAction<CartProduct>) => {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId,
      );
      if (existing) {
        existing.quantity += action.payload.quantity || 1;
      } else {
        state.items.push(action.payload);
      }
      state.clearedAt = null;
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      }
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) => {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(
            (i) => i.productId !== action.payload.productId,
          );
        } else {
          item.quantity = action.payload.quantity;
        }
      }
      if (state.items.length === 0) state.clearedAt = Date.now();
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      if (state.items.length === 0) state.clearedAt = Date.now();
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.clearedAt = Date.now();
      if (typeof window !== "undefined") {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    },
    toggleCartDrawer: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const {
  setCartItems,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  toggleCartDrawer,
  setCartDrawerOpen,
} = cartSlice.actions;

export default cartSlice.reducer;
