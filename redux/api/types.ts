export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  kpi?: Record<string, number>;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}
