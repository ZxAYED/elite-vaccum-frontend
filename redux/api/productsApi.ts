import { baseApi } from "./baseApi";
import type { Product } from "@/types/domain";
import type { PaginatedResponse } from "./types";

export interface GetProductsParams {
  search?: string;
  category?: string;
  categoryId?: string;
  categorySlug?: string;
  priceRange?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  isFeatured?: boolean;
  availability?:
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "PREORDER"
    | "BACKORDER"
    | "DISCONTINUED"
    | "in-stock"
    | "special-order"
    | "all";
  sortBy?:
    | "featured"
    | "popularity"
    | "price_asc"
    | "price_desc"
    | "newest"
    | "name_asc"
    | "name_desc";
  sort?: string;
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

function unwrapProductsResponse(raw: unknown): PaginatedResponse<Product> {
  if (!raw || typeof raw !== "object") {
    return { items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };
  }

  const payload = raw as Record<string, unknown>;
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;

  let items: Product[] = [];
  if (Array.isArray(data)) {
    items = data as Product[];
  } else if (Array.isArray(data.items)) {
    items = data.items as Product[];
  } else if (Array.isArray(payload.items)) {
    items = payload.items as Product[];
  }

  const rawMeta = (data.meta || payload.meta) as Record<string, unknown> | undefined;
  const meta = {
    page: Number(rawMeta?.currentPage ?? rawMeta?.page ?? 1),
    limit: Number(rawMeta?.perPage ?? rawMeta?.limit ?? 12),
    total: Number(rawMeta?.totalItems ?? rawMeta?.total ?? items.length),
    totalPages: Number(rawMeta?.totalPages ?? 1),
  };

  return { items, meta };
}

function unwrapSingleProduct(raw: unknown): Product {
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    return raw.data as Product;
  }
  return raw as Product;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, GetProductsParams | void>({
      query: (params) => {
        if (!params) return { url: "/products" };
        const queryParams: Record<string, unknown> = { ...params };
        if (params.categorySlug || params.categoryId) {
          queryParams.category = params.category || params.categorySlug || params.categoryId;
        }
        if (params.sort && !params.sortBy) {
          const sortMap: Record<string, GetProductsParams["sortBy"]> = {
            "price-low-high": "price_asc",
            "price-high-low": "price_desc",
            newest: "newest",
            popularity: "popularity",
          };
          queryParams.sortBy = sortMap[params.sort] || (params.sort as GetProductsParams["sortBy"]);
        }
        return {
          url: "/products",
          params: queryParams,
        };
      },
      transformResponse: unwrapProductsResponse,
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
      transformResponse: unwrapSingleProduct,
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
