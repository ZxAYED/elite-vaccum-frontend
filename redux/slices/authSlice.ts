import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User, UserRole } from "@/types/domain";
import { getCookie, setCookie, removeCookie } from "@/lib/cookies";
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
      user: null,
      token: null,
      isAuthenticated: false,
      role: null,
    };
  }

  try {
    const storedToken = getCookie(AUTH_TOKEN_KEY);
    const storedUser = getCookie(AUTH_USER_KEY);
    if (storedToken && storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      return {
        user: parsedUser,
        token: storedToken,
        isAuthenticated: true,
        role: parsedUser.role,
      };
    }
    if (storedToken) {
      return {
        user: null,
        token: storedToken,
        isAuthenticated: true,
        role: null,
      };
    }
  } catch {
    // fallback
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    role: null,
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

      setCookie(AUTH_TOKEN_KEY, action.payload.token);
      setCookie(AUTH_USER_KEY, JSON.stringify(action.payload.user));
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        setCookie(AUTH_USER_KEY, JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;

      removeCookie(AUTH_TOKEN_KEY);
      removeCookie(AUTH_USER_KEY);
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;
