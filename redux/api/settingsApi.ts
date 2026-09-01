import { baseApi } from "./baseApi";

export interface BusinessProfileDto {
  companyName: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
  address: string;
  operatingHours: Record<string, string>;
  serviceRadiusMiles: number;
  coverageNotes?: string;
}

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LegalPolicyDto {
  id: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  contentHtml: string;
  version: string;
  effectiveDate: string;
  isActive: boolean;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessProfile: builder.query<BusinessProfileDto, void>({
      query: () => "/settings/business-profile",
      providesTags: [{ type: "Setting", id: "PROFILE" }],
    }),
    updateBusinessProfile: builder.mutation<BusinessProfileDto, Partial<BusinessProfileDto>>({
      query: (body) => ({
        url: "/settings/business-profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Setting", id: "PROFILE" }],
    }),
    getFaqs: builder.query<FaqDto[], { category?: string; status?: string } | void>({
      query: (params) => ({
        url: "/settings/faqs",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "FAQ" as const, id })),
              { type: "FAQ", id: "LIST" },
            ]
          : [{ type: "FAQ", id: "LIST" }],
    }),
    createFaq: builder.mutation<FaqDto, Omit<FaqDto, "id">>({
      query: (body) => ({
        url: "/settings/faqs",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "FAQ", id: "LIST" }],
    }),
    updateFaq: builder.mutation<FaqDto, { id: string; body: Partial<FaqDto> }>({
      query: ({ id, body }) => ({
        url: `/settings/faqs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "FAQ", id },
        { type: "FAQ", id: "LIST" },
      ],
    }),
    deleteFaq: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/faqs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "FAQ", id },
        { type: "FAQ", id: "LIST" },
      ],
    }),
    getPolicies: builder.query<LegalPolicyDto[], void>({
      query: () => "/settings/policies",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Policy" as const, id })),
              { type: "Policy", id: "LIST" },
            ]
          : [{ type: "Policy", id: "LIST" }],
    }),
    getPolicyBySlug: builder.query<LegalPolicyDto, string>({
      query: (slug) => `/settings/policies/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: "Policy", id: slug }],
    }),
    createPolicy: builder.mutation<LegalPolicyDto, Partial<LegalPolicyDto>>({
      query: (body) => ({
        url: "/settings/policies",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Policy", id: "LIST" }],
    }),
    updatePolicy: builder.mutation<LegalPolicyDto, { id: string; body: Partial<LegalPolicyDto> }>({
      query: ({ id, body }) => ({
        url: `/settings/policies/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Policy", id },
        { type: "Policy", id: "LIST" },
      ],
    }),
    deletePolicy: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/settings/policies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Policy", id },
        { type: "Policy", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useGetPoliciesQuery,
  useGetPolicyBySlugQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
} = settingsApi;
