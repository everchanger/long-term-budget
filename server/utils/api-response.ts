/**
 * Standard API response helpers for consistent response shapes
 * Use these for all endpoints to maintain consistency across the API
 */

/**
 * Standard success response wrapper
 * Wraps data in a consistent structure with optional metadata
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: unknown;
  };
}

/**
 * Standard error response structure
 * Used by createError for consistent error responses
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Standard delete operation response
 */
export interface ApiDeleteResponse {
  success: true;
  message?: string;
}

/**
 * Create a standard success response
 *
 * @param data - The response data
 * @param meta - Optional metadata (pagination, counts, etc.)
 * @returns Standardized success response
 *
 * @example
 * return successResponse(users, { total: 100, page: 1, pageSize: 10 });
 * // { data: [...users], meta: { total: 100, page: 1, pageSize: 10 } }
 */
export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"]
): ApiSuccessResponse<T> {
  if (meta) {
    return { data, meta };
  }
  return { data };
}

/**
 * Create a standard delete success response
 *
 * @param message - Optional success message
 * @returns Standardized delete response
 *
 * @example
 * return deleteResponse("User deleted successfully");
 * // { success: true, message: "User deleted successfully" }
 */
export function deleteResponse(message?: string): ApiDeleteResponse {
  if (message) {
    return { success: true, message };
  }
  return { success: true };
}

/**
 * Create a paginated response with metadata
 *
 * @param data - The paginated data
 * @param page - Current page number
 * @param pageSize - Items per page
 * @param total - Total number of items
 * @returns Standardized paginated response
 *
 * @example
 * return paginatedResponse(users, 1, 10, 45);
 * // { data: [...users], meta: { page: 1, pageSize: 10, total: 45, totalPages: 5 } }
 */
export function paginatedResponse<T>(
  data: T,
  page: number,
  pageSize: number,
  total: number
): ApiSuccessResponse<T> {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse<T>(
  response: unknown
): response is ApiSuccessResponse<T> {
  return (
    typeof response === "object" && response !== null && "data" in response
  );
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(
  response: unknown
): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as ApiErrorResponse).error === "object" &&
    "message" in (response as ApiErrorResponse).error
  );
}
