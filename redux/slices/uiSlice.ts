import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export interface UIState {
  mobileNavOpen: boolean;
  activeModal: string | null;
  searchQuery: string;
  toasts: ToastMessage[];
}

const initialState: UIState = {
  mobileNavOpen: false,
  activeModal: null,
  searchQuery: "",
  toasts: [],
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setMobileNavOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileNavOpen = action.payload;
    },
    toggleMobileNav: (state) => {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<ToastMessage, "id"> & { id?: string }>) => {
      const id = action.payload.id || `toast-${Date.now().toString(36)}`;
      state.toasts.push({
        id,
        title: action.payload.title,
        message: action.payload.message,
        type: action.payload.type,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const {
  setMobileNavOpen,
  toggleMobileNav,
  openModal,
  closeModal,
  setSearchQuery,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;
