import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL, AUTH_TOKEN_KEY } from "../constants";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
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
  }),
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
