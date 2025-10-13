/**
 * API 服務層通用型別定義
 */

export interface QueryOptions {
  page?: number
  limit?: number
  filters?: Record<string, any>
  orderBy?: {
    field: string
    ascending?: boolean
  }
  search?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total?: number
  totalPages?: number
}

// 移除重複的型別定義，使用專案原有的 ApiResponse

// 基礎實體介面
export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

// 查詢建構器介面
export interface QueryBuilder<T> {
  select(fields: string): QueryBuilder<T>
  eq(field: string, value: any): QueryBuilder<T>
  neq(field: string, value: any): QueryBuilder<T>
  in(field: string, values: any[]): QueryBuilder<T>
  gt(field: string, value: any): QueryBuilder<T>
  gte(field: string, value: any): QueryBuilder<T>
  lt(field: string, value: any): QueryBuilder<T>
  lte(field: string, value: any): QueryBuilder<T>
  like(field: string, pattern: string): QueryBuilder<T>
  ilike(field: string, pattern: string): QueryBuilder<T>
  order(field: string, options?: { ascending?: boolean }): QueryBuilder<T>
  limit(count: number): QueryBuilder<T>
  range(from: number, to: number): QueryBuilder<T>
}
