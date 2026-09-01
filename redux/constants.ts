export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000/api/v1";

export const AUTH_TOKEN_KEY = "access_token";
export const AUTH_USER_KEY = "auth_user";
