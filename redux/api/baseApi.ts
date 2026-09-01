import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_BASE_URL, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../constants";
import { setCredentials, logout } from "../slices/authSlice";
import type { User } from "@/types/domain";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const isRefreshCall =
      typeof args === "string"
        ? args.includes("/auth/refresh-token")
        : args.url?.includes("/auth/refresh-token");

    const isLoginCall =
      typeof args === "string"
        ? args.includes("/auth/login")
        : args.url?.includes("/auth/login");

    if (!isRefreshCall && !isLoginCall) {
      // Attempt token rotation via HttpOnly refresh cookie
      const refreshResult = await rawBaseQuery(
        { url: "/auth/refresh-token", method: "POST" },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as {
          accessToken?: string;
          user?: User;
        };

        if (data.accessToken) {
          if (typeof window !== "undefined") {
            localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
            if (data.user) {
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
            }
          }

          if (data.user) {
            api.dispatch(
              setCredentials({ user: data.user, token: data.accessToken })
            );
          }

          // Retry the original query with the new token
          result = await rawBaseQuery(args, api, extraOptions);
        }
      } else {
        // Refresh failed: clear credentials and session
        api.dispatch(logout());
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
