import { baseApi } from "./baseApi";
import type { ProductCategory } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetCategoriesParams {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
}

function unwrapCategoriesResponse(raw: unknown): PaginatedResponse<ProductCategory> {
  if (!raw || typeof raw !== "object") {
    return { items: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } };
  }

  const payload = raw as Record<string, unknown>;
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;

  let items: ProductCategory[] = [];
  if (Array.isArray(data)) {
    items = data as ProductCategory[];
  } else if (Array.isArray(data.items)) {
    items = data.items as ProductCategory[];
  } else if (Array.isArray(payload.items)) {
    items = payload.items as ProductCategory[];
  }

  const rawMeta = (data.meta || payload.meta) as Record<string, unknown> | undefined;
  const meta = {
    page: Number(rawMeta?.currentPage ?? rawMeta?.page ?? 1),
    limit: Number(rawMeta?.perPage ?? rawMeta?.limit ?? 50),
    total: Number(rawMeta?.totalItems ?? rawMeta?.total ?? items.length),
    totalPages: Number(rawMeta?.totalPages ?? 1),
  };

  return { items, meta };
}

function unwrapSingleCategory(raw: unknown): ProductCategory {
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    return raw.data as ProductCategory;
  }
  return raw as ProductCategory;
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<PaginatedResponse<ProductCategory>, GetCategoriesParams | void>({
      query: (params) => ({
        url: "/categories",
        params: params || undefined,
      }),
      transformResponse: unwrapCategoriesResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Category" as const, id })),
              { type: "Category", id: "LIST" },
            ]
          : [{ type: "Category", id: "LIST" }],
    }),
    getCategoryById: builder.query<ProductCategory, string>({
      query: (id) => `/categories/${id}`,
      transformResponse: unwrapSingleCategory,
      providesTags: (_result, _error, id) => [{ type: "Category", id }],
    }),
    createCategory: builder.mutation<ProductCategory, Partial<ProductCategory>>({
      query: (category) => ({
        url: "/categories",
        method: "POST",
        body: category,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategory: builder.mutation<
      ProductCategory,
      { id: string; data: Partial<ProductCategory> }
    >({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
    deleteCategory: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
