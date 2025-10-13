// API 錯誤類型定義
export interface ApiError {
  code?: string
  message: string
  details?: any
}

// 基礎響應類型
export interface BaseResponse<T = any> {
  success: boolean
  data?: T
  error?: string | ApiError
}

// 成功響應
export interface SuccessResponse<T = any> extends BaseResponse<T> {
  success: true
  data: T
  error?: never
}

// 錯誤響應
export interface ErrorResponse extends BaseResponse {
  success: false
  data?: never
  error: string | ApiError
  details?: {
    type?: string
    code?: string
    context?: string
    timestamp?: Date
  }
}

export interface PaginationOptions {
  page: number
  perPage: number
  searchTerm?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SuccessPaginationResponse<T> extends SuccessResponse<T[]> {
  page: number
  perPage: number
  count?: number
  totalPages?: number
}

// 通用響應類型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse
export type ApiPaginationResponse<T = any> =
  | SuccessPaginationResponse<T>
  | ErrorResponse
