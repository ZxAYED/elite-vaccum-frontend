import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User, UserRole } from "@/types/domain";
import { mockCurrentUser } from "@/data/mock/user";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../constants";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const getInitialAuth = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: mockCurrentUser,
      token: "mock-jwt-token-active",
      isAuthenticated: true,
      role: mockCurrentUser.role,
    };
  }

  try {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      return {
        user: parsedUser,
        token: storedToken ?? "mock-jwt-token-active",
        isAuthenticated: true,
        role: parsedUser.role,
      };
    }
  } catch {
    // fallback
  }

  return {
    user: mockCurrentUser,
    token: "mock-jwt-token-active",
    isAuthenticated: true,
    role: mockCurrentUser.role,
  };
};

const initialState: AuthState = getInitialAuth();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.role = action.payload.user.role;

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload.user));
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(state.user));
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;
