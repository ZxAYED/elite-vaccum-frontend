import { baseApi } from "./baseApi";

export interface BusinessProfileDto {
  id?: string;
  businessName: string;
  supportEmail: string;
  primaryPhone: string;
  secondaryPhone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coverageMessage?: string;
  socialLinks?: Record<string, string>;
  updatedAt?: string;
  /** Backward-compatible aliases used by the existing admin settings page. */
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
  status?: string;
  isActive: boolean;
}

export interface LegalPolicyDto {
  id: string;
  title: string;
  slug: string;
  content?: string;
  status?: string;
  contentMarkdown: string;
  contentHtml: string;
  version: string;
  effectiveDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
}

function unwrapData<T>(raw: unknown): T {
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data?: unknown }).data !== undefined
  ) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

function unwrapArray<T>(raw: unknown): T[] {
  const data = unwrapData<unknown>(raw);
  return Array.isArray(data) ? (data as T[]) : [];
}

function normalizeBusinessProfile(raw: unknown): BusinessProfileDto {
  const data = unwrapData<Record<string, unknown>>(raw) ?? {};
  const businessName =
    typeof data.businessName === "string"
      ? data.businessName
      : typeof data.companyName === "string"
        ? data.companyName
        : "";
  const supportEmail =
    typeof data.supportEmail === "string"
      ? data.supportEmail
      : typeof data.email === "string"
        ? data.email
        : "";
  const primaryPhone =
    typeof data.primaryPhone === "string"
      ? data.primaryPhone
      : typeof data.phone === "string"
        ? data.phone
        : "";
  const operatingHours =
    data.operatingHours && typeof data.operatingHours === "object"
      ? (data.operatingHours as Record<string, string>)
      : {};

  return {
    id: typeof data.id === "string" ? data.id : undefined,
    businessName,
    supportEmail,
    primaryPhone,
    secondaryPhone: typeof data.secondaryPhone === "string" ? data.secondaryPhone : undefined,
    address: typeof data.address === "string" ? data.address : "",
    city: typeof data.city === "string" ? data.city : undefined,
    state: typeof data.state === "string" ? data.state : undefined,
    zipCode: typeof data.zipCode === "string" ? data.zipCode : undefined,
    country: typeof data.country === "string" ? data.country : undefined,
    coverageMessage:
      typeof data.coverageMessage === "string" ? data.coverageMessage : undefined,
    coverageNotes:
      typeof data.coverageNotes === "string" ? data.coverageNotes : undefined,
    operatingHours,
    socialLinks:
      data.socialLinks && typeof data.socialLinks === "object"
        ? (data.socialLinks as Record<string, string>)
        : undefined,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
    companyName: businessName,
    email: supportEmail,
    phone: primaryPhone,
    emergencyPhone: typeof data.secondaryPhone === "string" ? data.secondaryPhone : undefined,
    serviceRadiusMiles: Number(data.serviceRadiusMiles ?? 0),
  };
}

function serializeBusinessProfile(body: Partial<BusinessProfileDto>) {
  return {
    businessName: body.businessName ?? body.companyName,
    supportEmail: body.supportEmail ?? body.email,
    primaryPhone: body.primaryPhone ?? body.phone,
    secondaryPhone: body.secondaryPhone ?? body.emergencyPhone,
    address: body.address,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    country: body.country,
    coverageMessage: body.coverageMessage,
    coverageNotes: body.coverageNotes,
    operatingHours: body.operatingHours,
    socialLinks: body.socialLinks,
  };
}

function normalizeFaq(raw: unknown): FaqDto {
  const data = raw as Record<string, unknown>;
  const status =
    typeof data.status === "string"
      ? data.status
      : data.isActive === false
        ? "Hidden"
        : "Published";
  return {
    id: String(data.id ?? ""),
    question: String(data.question ?? ""),
    answer: String(data.answer ?? ""),
    category: String(data.category ?? "General"),
    status,
    sortOrder: Number(data.sortOrder ?? 0),
    isActive: status.toLowerCase() === "published" || data.isActive !== false,
  };
}

function serializeFaq(body: Partial<FaqDto>) {
  const isActive =
    body.isActive !== undefined
      ? body.isActive
      : body.status
        ? body.status.toLowerCase() === "published"
        : true;
  return {
    question: body.question,
    answer: body.answer,
    category: body.category,
    status: body.status ?? (isActive ? "Published" : "Hidden"),
    sortOrder: body.sortOrder,
    isActive,
  };
}

function normalizePolicy(raw: unknown): LegalPolicyDto {
  const data = raw as Record<string, unknown>;
  const content = String(data.content ?? data.contentMarkdown ?? "");
  const status =
    typeof data.status === "string"
      ? data.status
      : data.isActive === false
        ? "Draft"
        : "Published";
  return {
    id: String(data.id ?? ""),
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    content,
    status,
    contentMarkdown: content,
    contentHtml: String(data.contentHtml ?? ""),
    version: String(data.version ?? ""),
    effectiveDate: String(data.effectiveDate ?? ""),
    isActive: status.toLowerCase() === "published" || data.isActive !== false,
  };
}

function serializePolicy(body: Partial<LegalPolicyDto>) {
  const isActive =
    body.isActive !== undefined
      ? body.isActive
      : body.status
        ? body.status.toLowerCase() === "published"
        : true;
  return {
    slug: body.slug,
    title: body.title,
    content: body.content ?? body.contentMarkdown,
    contentMarkdown: body.contentMarkdown ?? body.content,
    status: body.status ?? (isActive ? "Published" : "Draft"),
    isActive,
  };
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessProfile: builder.query<BusinessProfileDto, void>({
      query: () => "/settings/business-profile",
      transformResponse: normalizeBusinessProfile,
      providesTags: [{ type: "Setting", id: "PROFILE" }],
    }),
    updateBusinessProfile: builder.mutation<BusinessProfileDto, Partial<BusinessProfileDto>>({
      query: (body) => ({
        url: "/settings/business-profile",
        method: "PATCH",
        body: serializeBusinessProfile(body),
      }),
      transformResponse: normalizeBusinessProfile,
      invalidatesTags: [{ type: "Setting", id: "PROFILE" }],
    }),
    getFaqs: builder.query<FaqDto[], { category?: string; status?: string } | void>({
      query: (params) => ({
        url: "/settings/faqs",
        params: params || undefined,
      }),
      transformResponse: (response: unknown) => unwrapArray<unknown>(response).map(normalizeFaq),
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
        body: serializeFaq(body),
      }),
      transformResponse: (response: unknown) => normalizeFaq(unwrapData(response)),
      invalidatesTags: [{ type: "FAQ", id: "LIST" }],
    }),
    updateFaq: builder.mutation<FaqDto, { id: string; body: Partial<FaqDto> }>({
      query: ({ id, body }) => ({
        url: `/settings/faqs/${id}`,
        method: "PATCH",
        body: serializeFaq(body),
      }),
      transformResponse: (response: unknown) => normalizeFaq(unwrapData(response)),
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
      transformResponse: (response: unknown) =>
        unwrapArray<unknown>(response).map(normalizePolicy),
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
      transformResponse: (response: unknown) => normalizePolicy(unwrapData(response)),
      providesTags: (_result, _error, slug) => [{ type: "Policy", id: slug }],
    }),
    createPolicy: builder.mutation<LegalPolicyDto, Partial<LegalPolicyDto>>({
      query: (body) => ({
        url: "/settings/policies",
        method: "POST",
        body: serializePolicy(body),
      }),
      transformResponse: (response: unknown) => normalizePolicy(unwrapData(response)),
      invalidatesTags: [{ type: "Policy", id: "LIST" }],
    }),
    updatePolicy: builder.mutation<LegalPolicyDto, { id: string; body: Partial<LegalPolicyDto> }>({
      query: ({ id, body }) => ({
        url: `/settings/policies/${id}`,
        method: "PATCH",
        body: serializePolicy(body),
      }),
      transformResponse: (response: unknown) => normalizePolicy(unwrapData(response)),
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
