import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User, UserRole } from "@/types/domain";
import type { TechnicianProfileDto } from "@/redux/api/technicianApi";
import { getCookie, setCookie, removeCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../constants";

export const AUTH_TECH_PROFILE_KEY = "auth_technician_profile";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  technicianProfile: TechnicianProfileDto | null;
}

const getInitialAuth = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      role: null,
      technicianProfile: null,
    };
  }

  try {
    const storedToken = getCookie(AUTH_TOKEN_KEY);
    const storedUser = getCookie(AUTH_USER_KEY);
    const storedTechProfile = getCookie(AUTH_TECH_PROFILE_KEY);

    let parsedTechProfile: TechnicianProfileDto | null = null;
    if (storedTechProfile) {
      try {
        parsedTechProfile = JSON.parse(storedTechProfile);
      } catch {
        // ignore parse error
      }
    }

    if (storedToken && storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      if (!parsedTechProfile && parsedUser.technicianProfile) {
        parsedTechProfile = parsedUser.technicianProfile as TechnicianProfileDto;
      }
      if (!parsedUser.avatarUrl && parsedTechProfile?.avatarUrl) {
        parsedUser.avatarUrl = parsedTechProfile.avatarUrl;
      }

      return {
        user: parsedUser,
        token: storedToken,
        isAuthenticated: true,
        role: parsedUser.role,
        technicianProfile: parsedTechProfile,
      };
    }
    if (storedToken) {
      return {
        user: null,
        token: storedToken,
        isAuthenticated: true,
        role: null,
        technicianProfile: parsedTechProfile,
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
    technicianProfile: null,
  };
};

const initialState: AuthState = getInitialAuth();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        technicianProfile?: TechnicianProfileDto | null;
      }>,
    ) => {
      const techProfile =
        action.payload.technicianProfile ||
        (action.payload.user.technicianProfile as TechnicianProfileDto | undefined) ||
        (action.payload.user.profile as TechnicianProfileDto | undefined) ||
        null;

      const user: User = {
        ...action.payload.user,
        avatarUrl:
          action.payload.user.avatarUrl ||
          techProfile?.avatarUrl ||
          undefined,
        technicianProfile: techProfile || undefined,
      };

      state.user = user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.role = action.payload.user.role;
      state.technicianProfile = techProfile;

      setCookie(AUTH_TOKEN_KEY, action.payload.token);
      setCookie(AUTH_USER_KEY, JSON.stringify(user));
      if (techProfile) {
        setCookie(AUTH_TECH_PROFILE_KEY, JSON.stringify(techProfile));
      } else {
        removeCookie(AUTH_TECH_PROFILE_KEY);
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        setCookie(AUTH_USER_KEY, JSON.stringify(state.user));
      }
    },
    setTechnicianProfile: (
      state,
      action: PayloadAction<TechnicianProfileDto | null>,
    ) => {
      state.technicianProfile = action.payload;
      if (action.payload?.avatarUrl && state.user) {
        state.user.avatarUrl = action.payload.avatarUrl;
        setCookie(AUTH_USER_KEY, JSON.stringify(state.user));
      }
      if (action.payload) {
        setCookie(AUTH_TECH_PROFILE_KEY, JSON.stringify(action.payload));
      } else {
        removeCookie(AUTH_TECH_PROFILE_KEY);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.technicianProfile = null;

      removeCookie(AUTH_TOKEN_KEY);
      removeCookie(AUTH_USER_KEY);
      removeCookie(AUTH_TECH_PROFILE_KEY);
    },
  },
});

export const { setCredentials, updateUser, setTechnicianProfile, logout } = authSlice.actions;

export default authSlice.reducer;
