import { baseApi } from "./baseApi";
import type { Product } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetProductsParams {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  isFeatured?: boolean;
  availability?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "in-stock" | "special-order";
  sort?: "price_asc" | "price_desc" | "newest" | "popular" | "name_asc";
  status?: string;
  page?: number;
  limit?: number;
}

export interface UpdateStockRequest {
  stock: number;
}

export interface UpdateStatusRequest {
  status: string;
  availability?: string;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, GetProductsParams | void>({
      query: (params) => ({
        url: "/products",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Product" as const, id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProductByIdOrSlug: builder.query<Product, string>({
      query: (idOrSlug) => `/products/${idOrSlug}`,
      providesTags: (result) =>
        result ? [{ type: "Product", id: result.id }] : [{ type: "Product", id: "LIST" }],
    }),
    getAdminProductsList: builder.query<PaginatedResponse<Product>, GetProductsParams | void>({
      query: (params) => ({
        url: "/products/admin/list",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Product" as const, id })),
              { type: "Product", id: "ADMIN_LIST" },
            ]
          : [{ type: "Product", id: "ADMIN_LIST" }],
    }),
    createProduct: builder.mutation<Product, FormData | Partial<Product>>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "Product", id: "ADMIN_LIST" },
      ],
    }),
    updateProduct: builder.mutation<Product, { id: string; body: FormData | Partial<Product> }>({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Product", id: "ADMIN_LIST" },
      ],
    }),
    updateProductStock: builder.mutation<Product, { id: string; data: UpdateStockRequest }>({
      query: ({ id, data }) => ({
        url: `/products/${id}/stock`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Product", id: "ADMIN_LIST" },
      ],
    }),
    updateProductStatus: builder.mutation<Product, { id: string; data: UpdateStatusRequest }>({
      query: ({ id, data }) => ({
        url: `/products/${id}/status`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Product", id: "ADMIN_LIST" },
      ],
    }),
    deleteProduct: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Product", id: "ADMIN_LIST" },
      ],
    }),
    deleteProductImages: builder.mutation<{ success: boolean }, { id: string; imageIds: string[] }>({
      query: ({ id, imageIds }) => ({
        url: `/products/${id}/images`,
        method: "DELETE",
        body: { imageIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Product", id }],
    }),
    deleteProductImage: builder.mutation<{ success: boolean }, { id: string; imageId: string }>({
      query: ({ id, imageId }) => ({
        url: `/products/${id}/images/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Product", id }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdOrSlugQuery,
  useGetAdminProductsListQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStockMutation,
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
  useDeleteProductImagesMutation,
  useDeleteProductImageMutation,
} = productsApi;
