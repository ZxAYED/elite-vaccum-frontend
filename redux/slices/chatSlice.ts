import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ChatState {
  isOpen: boolean;
  activeConversationId: string | null;
  typingUsers: Record<string, boolean>; // conversationId -> isTyping
}

const initialState: ChatState = {
  isOpen: false,
  activeConversationId: null,
  typingUsers: {},
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    setUserTyping: (
      state,
      action: PayloadAction<{ conversationId: string; isTyping: boolean }>,
    ) => {
      state.typingUsers[action.payload.conversationId] = action.payload.isTyping;
    },
  },
});

export const { setChatOpen, toggleChat, setActiveConversation, setUserTyping } =
  chatSlice.actions;

export default chatSlice.reducer;
