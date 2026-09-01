import {
  createApi,
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { getCookie, setCookie } from "@/lib/cookies";
import { API_BASE_URL, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../constants";
import { setCredentials, logout } from "../slices/authSlice";
import type { User } from "@/types/domain";

interface AuthSliceState {
  auth?: {
    user: User | null;
    token: string | null;
  };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = getCookie(AUTH_TOKEN_KEY);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return headers;
  },
});

// Shared promise queue to prevent multiple concurrent refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function executeRefreshToken(
  api: BaseQueryApi,
  extraOptions: object | undefined
): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshResult = await rawBaseQuery(
        { url: "/auth/refresh-token", method: "POST" },
        api,
        extraOptions || {}
      );

      if (refreshResult.data) {
        const payload = refreshResult.data as Record<string, unknown>;
        const dataObj =
          typeof payload.data === "object" && payload.data !== null
            ? (payload.data as Record<string, unknown>)
            : payload;

        const newAccessToken =
          (dataObj.accessToken as string) ||
          (dataObj.token as string) ||
          (payload.accessToken as string) ||
          (payload.token as string);

        const userData =
          (dataObj.user as User) || (payload.user as User) || null;

        if (newAccessToken) {
          setCookie(AUTH_TOKEN_KEY, newAccessToken);

          if (userData) {
            setCookie(AUTH_USER_KEY, JSON.stringify(userData));
            api.dispatch(
              setCredentials({ user: userData, token: newAccessToken })
            );
          } else {
            const state = api.getState() as AuthSliceState;
            const currentUser = state?.auth?.user;
            if (currentUser) {
              api.dispatch(
                setCredentials({ user: currentUser, token: newAccessToken })
              );
            }
          }

          return newAccessToken;
        }
      }

      // If refresh call returned error or empty token
      api.dispatch(logout());
      return null;
    } catch {
      api.dispatch(logout());
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    const isAuthEndpoint =
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/login") ||
      url.includes("/auth/signup");

    if (!isAuthEndpoint) {
      const newAccessToken = await executeRefreshToken(
        api,
        extraOptions as object | undefined
      );

      if (newAccessToken) {
        // Retry the original query with the refreshed token
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Category",
    "Product",
    "Cart",
    "Address",
    "Customer",
    "Order",
    "Return",
    "Service",
    "Schedule",
    "ServiceRequest",
    "Quotation",
    "ServiceOrder",
    "Notification",
    "Invoice",
    "Payment",
    "Review",
    "Setting",
    "FAQ",
    "Policy",
    "Report",
    "Chat",
    "Technician",
  ],
  endpoints: () => ({}),
});
