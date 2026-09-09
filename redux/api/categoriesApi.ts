import { baseApi } from "./baseApi";
import type { ProductCategory } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetCategoriesParams {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
  perPage?: number;
}

export interface CategoriesApiResponse extends PaginatedResponse<ProductCategory> {
  totalActiveProducts?: number;
}

function unwrapCategoriesResponse(raw: unknown): CategoriesApiResponse {
  if (!raw || typeof raw !== "object") {
    return { items: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 }, totalActiveProducts: 0 };
  }

  const payload = raw as Record<string, unknown>;
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;

  let rawItems: unknown[] = [];
  if (Array.isArray(data)) {
    rawItems = data;
  } else if (Array.isArray(data.items)) {
    rawItems = data.items;
  } else if (Array.isArray(payload.items)) {
    rawItems = payload.items;
  }

  const items: ProductCategory[] = rawItems.map((rawItem) => {
    const item = (rawItem && typeof rawItem === "object" ? rawItem : {}) as Record<string, unknown>;
    const countObj = item._count as { products?: number } | undefined;
    const count =
      typeof item.productCount === "number"
        ? item.productCount
        : typeof countObj?.products === "number"
        ? countObj.products
        : 0;

    return {
      ...(item as unknown as ProductCategory),
      productCount: count,
      _count: {
        products: count,
      },
    };
  });

  const rawMeta = (data.meta || payload.meta) as Record<string, unknown> | undefined;
  const meta = {
    page: Number(rawMeta?.currentPage ?? rawMeta?.page ?? 1),
    limit: Number(rawMeta?.perPage ?? rawMeta?.limit ?? 50),
    total: Number(rawMeta?.totalItems ?? rawMeta?.total ?? items.length),
    totalPages: Number(rawMeta?.totalPages ?? 1),
  };

  const totalActiveProducts =
    typeof payload.totalActiveProducts === "number"
      ? payload.totalActiveProducts
      : typeof (data as Record<string, unknown>).totalActiveProducts === "number"
      ? ((data as Record<string, unknown>).totalActiveProducts as number)
      : items.reduce((acc, cat) => acc + (cat.productCount || 0), 0);

  return { items, meta, totalActiveProducts };
}

function unwrapSingleCategory(raw: unknown): ProductCategory {
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    return raw.data as ProductCategory;
  }
  return raw as ProductCategory;
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<CategoriesApiResponse, GetCategoriesParams | void>({
      query: (params) => {
        if (!params) return { url: "/categories" };
        const queryParams: Record<string, unknown> = { ...params };
        if (params.limit && !params.perPage) {
          queryParams.perPage = params.limit;
        }
        return {
          url: "/categories",
          params: queryParams,
        };
      },
      transformResponse: unwrapCategoriesResponse,
      keepUnusedDataFor: 300,
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
