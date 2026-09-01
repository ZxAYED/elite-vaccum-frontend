import { baseApi } from "./baseApi";
import type { ProductCategory } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetCategoriesParams {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<PaginatedResponse<ProductCategory>, GetCategoriesParams | void>({
      query: (params) => ({
        url: "/categories",
        params: params || undefined,
      }),
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
