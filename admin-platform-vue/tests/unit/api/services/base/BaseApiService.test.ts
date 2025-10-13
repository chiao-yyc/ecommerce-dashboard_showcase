/**
 * BaseApiService 測試
 * 測試核心 API 服務基礎類別的功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseApiService } from '@/api/services/base/BaseApiService'
import type { ApiResponse } from '@/types'

// Mock GlobalErrorHandler
vi.mock('@/utils/error', () => ({
  GlobalErrorHandler: {
    handle: vi.fn().mockReturnValue({
      type: 'API',
      code: 'API_ERROR',
      userMessage: '資料庫操作失敗，請稍後再試',
      techMessage: 'Database connection failed',
      context: 'Test Context',
      timestamp: new Date(),
      details: {}
    })
  }
}))

// 測試用實體類型
interface TestEntity {
  id: string
  name: string
  email: string
  createdAt: string
}

interface TestDbEntity {
  id: string
  name: string
  email: string
  created_at: string
}

// 具體實現類用於測試
class TestApiService extends BaseApiService<TestEntity, TestDbEntity> {
  constructor(supabase: SupabaseClient, viewName?: string) {
    super(supabase, 'test_table', viewName)
  }

  protected mapDbToEntity(dbEntity: TestDbEntity): TestEntity {
    return {
      id: dbEntity.id,
      name: dbEntity.name,
      email: dbEntity.email,
      createdAt: dbEntity.created_at,
    }
  }

  protected mapEntityToDb(entity: Partial<TestEntity>): Partial<TestDbEntity> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      created_at: entity.createdAt,
    }
  }

  protected applySearch(query: any, search: string): any {
    return query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }
}

describe('BaseApiService', () => {
  let mockSupabase: SupabaseClient
  let testService: TestApiService
  let mockQuery: any

  beforeEach(() => {
    // 創建靈活的Mock查詢建構器，支援鏈式調用和個別方法配置
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      // 預設Promise行為 - 可以被個別測試覆寫
      then: vi.fn((resolve) => resolve({ data: null, error: null, count: null })),
      catch: vi.fn((reject) => reject),
    }
    
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    } as unknown as SupabaseClient

    testService = new TestApiService(mockSupabase)
  })

  describe('初始化', () => {
    it('should initialize with table name', () => {
      expect(testService['tableName']).toBe('test_table')
      expect(testService['supabase']).toBe(mockSupabase)
    })

    it('should initialize with view name when provided', () => {
      const serviceWithView = new TestApiService(mockSupabase, 'test_view')
      expect(serviceWithView['viewName']).toBe('test_view')
    })
  })

  describe('findMany', () => {
    const mockDbData = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        created_at: '2024-01-02T00:00:00Z'
      }
    ]

    it('should fetch multiple records successfully', async () => {
      // 配置Mock查詢建構器返回測試數據
      mockQuery.then = vi.fn((resolve) => resolve({
        data: mockDbData,
        error: null,
        count: 2
      }))

      const result = await testService.findMany()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data![0]).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      })
      expect(result.count).toBe(2)
      expect(result.totalPages).toBe(1)
    })

    it('should handle pagination correctly', async () => {
      // 重新配置查詢建構器回應分頁測試數據
      mockQuery.then = vi.fn((resolve) => resolve({
        data: mockDbData,
        error: null,
        count: 25
      }))

      const result = await testService.findMany({ page: 2, limit: 10 })

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19)
      expect(result.totalPages).toBe(3)
      expect(result.page).toBe(2)
      expect(result.perPage).toBe(10)
    })

    it('should apply filters correctly', async () => {
      // 配置Mock回應
      mockQuery.then = vi.fn((resolve) => resolve({
        data: [],
        error: null,
        count: 0
      }))

      await testService.findMany({
        filters: { name: 'John', email: 'john@example.com' }
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'John')
      expect(mockQuery.eq).toHaveBeenCalledWith('email', 'john@example.com')
    })

    it('should skip undefined, null, and empty filter values', async () => {
      // 配置Mock回應
      mockQuery.then = vi.fn((resolve) => resolve({
        data: [],
        error: null,
        count: 0
      }))

      await testService.findMany({
        filters: { 
          name: 'John',
          email: undefined,
          status: null,
          description: ''
        }
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'John')
      expect(mockQuery.eq).toHaveBeenCalledTimes(1)
    })

    it('should apply search correctly', async () => {
      // 配置Mock回應
      mockQuery.then = vi.fn((resolve) => resolve({
        data: [],
        error: null,
        count: 0
      }))

      await testService.findMany({ search: 'john' })

      expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%john%,email.ilike.%john%')
    })

    it('should apply ordering correctly', async () => {
      // 配置Mock回應
      mockQuery.then = vi.fn((resolve) => resolve({
        data: [],
        error: null,
        count: 0
      }))

      await testService.findMany({
        orderBy: { field: 'name', ascending: false }
      })

      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: false })
    })

    it('should use view when provided', async () => {
      const serviceWithView = new TestApiService(mockSupabase, 'test_view')
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await serviceWithView.findMany()

      expect(mockSupabase.from).toHaveBeenCalledWith('test_view')
    })

    it('should handle database errors', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null
      })

      const result = await testService.findMany()

      expect(result.success).toBe(false)
      expect(result.error).toBe('資料庫操作失敗，請稍後再試')
    })
  })

  describe('findById', () => {
    const mockDbRecord = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      created_at: '2024-01-01T00:00:00Z'
    }

    it('should fetch single record by id successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockDbRecord,
        error: null
      })

      const result = await testService.findById('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      })
    })

    it('should handle not found error', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await testService.findById('999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('資料庫操作失敗，請稍後再試')
    })
  })

  describe('create', () => {
    const newEntity = {
      name: 'New User',
      email: 'new@example.com',
      createdAt: '2024-01-01T00:00:00Z'
    }

    const mockCreatedRecord = {
      id: '3',
      name: 'New User',
      email: 'new@example.com',
      created_at: '2024-01-01T00:00:00Z'
    }

    it('should create new record successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockCreatedRecord,
        error: null
      })

      const result = await testService.create(newEntity)

      expect(mockQuery.insert).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        created_at: '2024-01-01T00:00:00Z'
      })
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: '3',
        name: 'New User',
        email: 'new@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      })
    })

    it('should handle creation errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key error' }
      })

      const result = await testService.create(newEntity)

      expect(result.success).toBe(false)
      expect(result.error).toBe('資料庫操作失敗，請稍後再試')
    })
  })

  describe('update', () => {
    const updates = {
      name: 'Updated Name',
      email: 'updated@example.com'
    }

    const mockUpdatedRecord = {
      id: '1',
      name: 'Updated Name',
      email: 'updated@example.com',
      created_at: '2024-01-01T00:00:00Z'
    }

    it('should update record successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockUpdatedRecord,
        error: null
      })

      const result = await testService.update('1', updates)

      expect(mockQuery.update).toHaveBeenCalledWith({
        name: 'Updated Name',
        email: 'updated@example.com'
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      })
    })

    it('should handle update errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })

      const result = await testService.update('1', updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('資料庫操作失敗，請稍後再試')
    })
  })

  describe('delete', () => {
    it('should delete record successfully', async () => {
      // 配置Mock回應
      mockQuery.then = vi.fn((resolve) => resolve({
        error: null
      }))

      const result = await testService.delete('1')

      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockQuery.delete.mockResolvedValue({
        error: { message: 'Delete failed' }
      })

      const result = await testService.delete('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('資料庫操作失敗，請稍後再試')
    })
  })

  describe('getQueryBuilder', () => {
    it('should return query builder for table', () => {
      const builder = testService['getQueryBuilder']()
      
      expect(mockSupabase.from).toHaveBeenCalledWith('test_table')
      expect(builder).toBe(mockQuery)
    })

    it('should return query builder for view when available', () => {
      const serviceWithView = new TestApiService(mockSupabase, 'test_view')
      serviceWithView['getQueryBuilder']()
      
      expect(mockSupabase.from).toHaveBeenCalledWith('test_view')
    })
  })

  describe('錯誤處理', () => {
    it('should use GlobalErrorHandler for error processing', async () => {
      // 配置Mock查詢建構器拋出錯誤
      mockQuery.then = vi.fn((resolve, reject) => reject(new Error('Network error')))

      const result = await testService.findMany()

      // 驗證GlobalErrorHandler被正確調用（已在測試頂部mock）
      const { GlobalErrorHandler } = await vi.importMock('@/utils/error')
      expect(GlobalErrorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'API Service: test_table'
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('資料庫操作失敗，請稍後再試')
      expect(result.details).toEqual({
        type: 'API',
        code: 'API_ERROR',
        context: 'Test Context',
        timestamp: expect.any(Date)
      })
    })
  })

  describe('實體映射', () => {
    it('should correctly map database entity to domain entity', () => {
      const dbEntity: TestDbEntity = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      const entity = testService['mapDbToEntity'](dbEntity)

      expect(entity).toEqual({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      })
    })

    it('should correctly map domain entity to database entity', () => {
      const entity: Partial<TestEntity> = {
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      }

      const dbEntity = testService['mapEntityToDb'](entity)

      expect(dbEntity).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z'
      })
    })
  })

  describe('搜尋功能', () => {
    it('should apply custom search logic', () => {
      const mockQueryObj = { or: vi.fn() }
      
      const result = testService['applySearch'](mockQueryObj, 'john')

      expect(mockQueryObj.or).toHaveBeenCalledWith('name.ilike.%john%,email.ilike.%john%')
    })

    it('should return original query when search is not implemented', () => {
      // 創建一個沒有覆寫 applySearch 的服務
      class SimpleApiService extends BaseApiService<TestEntity, TestDbEntity> {
        constructor(supabase: SupabaseClient) {
          super(supabase, 'simple_table')
        }
        
        protected mapDbToEntity(dbEntity: TestDbEntity): TestEntity {
          return {
            id: dbEntity.id,
            name: dbEntity.name,
            email: dbEntity.email,
            createdAt: dbEntity.created_at,
          }
        }
      }

      const simpleService = new SimpleApiService(mockSupabase)
      const mockQueryObj = { test: 'query' }
      
      const result = simpleService['applySearch'](mockQueryObj, 'search')
      
      expect(result).toBe(mockQueryObj)
    })
  })
})