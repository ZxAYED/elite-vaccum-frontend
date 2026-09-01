import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import cartReducer from "./slices/cartSlice";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import chatReducer from "./slices/chatSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      cart: cartReducer,
      auth: authReducer,
      ui: uiReducer,
      chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(baseApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
