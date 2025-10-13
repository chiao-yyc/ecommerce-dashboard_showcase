import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueryOptions, QueryBuilder } from './types'
import type { ApiResponse } from '@/types'
import { GlobalErrorHandler } from '@/utils/error'

/**
 * 基礎 API 服務類別
 * 提供統一的 CRUD 操作和錯誤處理
 */
export abstract class BaseApiService<TEntity, TDbEntity = any> {
  protected supabase: SupabaseClient
  protected tableName: string
  protected viewName?: string

  constructor(supabase: SupabaseClient, tableName: string, viewName?: string) {
    this.supabase = supabase
    this.tableName = tableName
    this.viewName = viewName
  }

  /**
   * 查詢多筆資料
   */
  async findMany(options: QueryOptions = {}): Promise<ApiResponse<TEntity[]>> {
    try {
      const { page = 1, limit = 10, filters = {}, orderBy, search } = options

      // 使用 view 或 table
      const source = this.viewName || this.tableName
      let query = this.supabase.from(source).select('*', { count: 'exact' })

      // 應用篩選條件
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })

      // 應用搜尋條件（子類別可覆寫 applySearch 方法）
      if (search) {
        query = this.applySearch(query, search)
      }

      // 應用排序
      if (orderBy) {
        query = query.order(orderBy.field, {
          ascending: orderBy.ascending ?? true,
        })
      }

      // 應用分頁
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      const entities = data ? data.map((item) => this.mapDbToEntity(item)) : []
      const totalPages = count ? Math.ceil(count / limit) : 0

      return {
        success: true,
        data: entities,
        // 保持與現有分頁介面的相容性
        page,
        perPage: limit,
        count: count || 0,
        totalPages,
      } as any
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 根據 ID 查詢單筆資料
   */
  async findById(id: string): Promise<ApiResponse<TEntity>> {
    try {
      const source = this.viewName || this.tableName
      const { data, error } = await this.supabase
        .from(source)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 建立新資料
   */
  async create(entity: Partial<TEntity>): Promise<ApiResponse<TEntity>> {
    try {
      const dbEntity = this.mapEntityToDb(entity)
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(dbEntity)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新資料
   */
  async update(
    id: string,
    updates: Partial<TEntity>,
  ): Promise<ApiResponse<TEntity>> {
    try {
      const dbUpdates = this.mapEntityToDb(updates)
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 刪除資料
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return {
        success: true,
        data: true,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取查詢建構器
   */
  protected getQueryBuilder(): QueryBuilder<TDbEntity> {
    const source = this.viewName || this.tableName
    return this.supabase.from(source) as any
  }

  /**
   * 應用搜尋條件（子類別可覆寫）
   */
  protected applySearch(query: any, _search: string): any {
    // 預設不做任何搜尋，子類別需要覆寫此方法
    return query
  }

  /**
   * 統一的錯誤處理
   */
  protected handleError(error: any): ApiResponse<any> {
    // 使用全域錯誤處理器
    const appError = GlobalErrorHandler.handle(error, `API Service: ${this.tableName}`)
    
    return {
      success: false,
      error: appError.userMessage,
      details: {
        type: appError.type,
        code: appError.code,
        context: appError.context,
        timestamp: appError.timestamp
      }
    }
  }

  /**
   * 將資料庫實體轉換為前端實體
   * 子類別必須實作此方法
   */
  protected abstract mapDbToEntity(dbEntity: TDbEntity): TEntity

  /**
   * 將前端實體轉換為資料庫實體
   * 子類別可覆寫此方法
   */
  protected mapEntityToDb(entity: Partial<TEntity>): Partial<TDbEntity> {
    // 預設實作：直接返回（適用於欄位名稱相同的情況）
    return entity as any
  }
}
