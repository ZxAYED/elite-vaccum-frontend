import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartProduct } from "@/data/mock/customer-portal";

export interface CartState {
  items: CartProduct[];
  isOpen: boolean;
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
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartProduct[]>) => {
      state.items = action.payload;
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
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      }
    },
    clearCart: (state) => {
      state.items = [];
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
