import { baseApi } from "./baseApi";
import type { User } from "@/types/domain";

export interface SignupRequest {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrapData<T>(response: ApiResponse<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data as T;
  }
  return response as T;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<{ message: string }, SignupRequest>({
      query: (body) => ({
        url: "/auth/signup",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<{ message?: string }> | { message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          message:
            (data as { message?: string })?.message ||
            (response as ApiResponse<unknown>)?.message ||
            "Registration successful.",
        };
      },
    }),
    verifyOtp: builder.mutation<{ message: string }, VerifyOtpRequest>({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<{ message?: string }> | { message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          message:
            (data as { message?: string })?.message ||
            (response as ApiResponse<unknown>)?.message ||
            "Email verified successfully.",
        };
      },
    }),
    resendOtp: builder.mutation<{ message: string }, ResendOtpRequest>({
      query: (body) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<{ message?: string }> | { message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          message:
            (data as { message?: string })?.message ||
            (response as ApiResponse<unknown>)?.message ||
            "OTP code resent successfully.",
        };
      },
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (
        response: ApiResponse<AuthResponse> | AuthResponse
      ) => {
        return unwrapData(response);
      },
      invalidatesTags: ["Auth", "User"],
    }),
    getMe: builder.query<User, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiResponse<User> | User) => {
        return unwrapData(response);
      },
      providesTags: ["User"],
    }),
    refreshToken: builder.mutation<
      { accessToken: string; user?: User },
      void
    >({
      query: () => ({
        url: "/auth/refresh-token",
        method: "POST",
      }),
      transformResponse: (
        response:
          | ApiResponse<{ accessToken: string; user?: User }>
          | { accessToken: string; user?: User }
      ) => {
        return unwrapData(response);
      },
    }),
    forgotPassword: builder.mutation<
      { message: string },
      ForgotPasswordRequest
    >({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<{ message?: string }> | { message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          message:
            (data as { message?: string })?.message ||
            (response as ApiResponse<unknown>)?.message ||
            "Password reset OTP sent.",
        };
      },
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<{ message?: string }> | { message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          message:
            (data as { message?: string })?.message ||
            (response as ApiResponse<unknown>)?.message ||
            "Password reset successfully.",
        };
      },
    }),
    changePassword: builder.mutation<
      { message: string },
      ChangePasswordRequest
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<{ message?: string }> | { message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          message:
            (data as { message?: string })?.message ||
            (response as ApiResponse<unknown>)?.message ||
            "Password changed successfully.",
        };
      },
    }),
    logout: builder.mutation<{ message?: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      transformResponse: (
        response: ApiResponse<{ message?: string }> | { message?: string }
      ) => {
        const data = unwrapData(response);
        return {
          message:
            (data as { message?: string })?.message ||
            (response as ApiResponse<unknown>)?.message ||
            "Logged out successfully.",
        };
      },
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

export const {
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLoginMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi;
