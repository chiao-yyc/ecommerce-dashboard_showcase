/**
 * 業務特化陣列操作工具集合
 *
 * 專注於 lodash-es 沒有提供或需要業務定制的陣列操作：
 * - 業務特化的統計和計算
 * - Vue/TypeScript 特化功能
 * - 樹狀結構轉換
 * - 分頁和分塊的業務包裝
 *
 * 注意：基礎陣列操作（groupBy, sortBy, chunk, flatten, isEmpty 等）
 * 請使用 lodash-es 的對應函數，從 @/utils 統一導入
 */

import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Utils', 'Arrays')

export type KeySelector<T, K = string> = (item: T) => K

/**
 * 分組結果類型（業務增強版）
 */
export interface GroupResult<T, K = string> {
  key: K
  items: T[]
  count: number
  /** 業務特化：計算佔總數的百分比 */
  percentage: number
}

/**
 * 統計結果類型（業務增強版）
 */
export interface StatsResult {
  count: number
  sum: number
  average: number
  min: number
  max: number
  median: number
  /** 業務特化：標準差 */
  standardDeviation: number
  /** 業務特化：四分位數 */
  quartiles: {
    q1: number
    q2: number
    q3: number
  }
}

/**
 * 分頁結果類型（業務增強版）
 */
export interface PaginationResult<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  hasNext: boolean
  hasPrev: boolean
  /** 業務特化：頁面信息 */
  pageInfo: {
    startIndex: number
    endIndex: number
    pageSize: number
  }
}

/**
 * 業務特化陣列工具類
 */
export class BusinessArrayUtils {
  /**
   * 業務增強版分組（包含百分比計算）
   */
  static groupByWithStats<T, K = string>(
    array: T[],
    keySelector: KeySelector<T, K>
  ): GroupResult<T, K>[] {
    const groups = new Map<K, T[]>()
    
    for (const item of array) {
      const key = keySelector(item)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    }
    
    const total = array.length
    
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      items,
      count: items.length,
      percentage: total > 0 ? (items.length / total) * 100 : 0
    }))
  }

  /**
   * 業務增強版統計（包含標準差和四分位數）
   */
  static enhancedStats(numbers: number[]): StatsResult {
    if (numbers.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0,
        standardDeviation: 0,
        quartiles: { q1: 0, q2: 0, q3: 0 }
      }
    }
    
    const sorted = [...numbers].sort((a, b) => a - b)
    const sum = numbers.reduce((acc, num) => acc + num, 0)
    const count = numbers.length
    const average = sum / count
    const min = sorted[0]
    const max = sorted[count - 1]
    
    // 計算中位數
    const median = count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)]
    
    // 計算標準差
    const variance = numbers.reduce((acc, num) => acc + Math.pow(num - average, 2), 0) / count
    const standardDeviation = Math.sqrt(variance)
    
    // 計算四分位數
    const q1Index = Math.floor(count * 0.25)
    const q3Index = Math.floor(count * 0.75)
    const quartiles = {
      q1: sorted[q1Index],
      q2: median,
      q3: sorted[q3Index]
    }
    
    return { count, sum, average, min, max, median, standardDeviation, quartiles }
  }

  /**
   * 業務增強版分頁（包含詳細頁面信息）
   */
  static enhancedPaginate<T>(
    array: T[],
    page: number,
    pageSize: number
  ): PaginationResult<T> {
    const totalItems = array.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const items = array.slice(startIndex, endIndex)
    
    return {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageInfo: {
        startIndex: startIndex + 1, // 1-based for display
        endIndex,
        pageSize
      }
    }
  }

  /**
   * 陣列轉樹狀結構（業務特化）
   */
  static toTree<T extends Record<string, any>>(
    array: T[],
    options: {
      idField?: string
      parentField?: string
      childrenField?: string
      /** 業務特化：根節點過濾條件 */
      rootFilter?: (item: T) => boolean
    } = {}
  ): T[] {
    const { 
      idField = 'id', 
      parentField = 'parentId', 
      childrenField = 'children',
      rootFilter
    } = options
    
    const itemMap = new Map<unknown, T & { [key: string]: unknown }>()
    const rootItems: T[] = []
    
    // 建立 Map 並初始化 children
    array.forEach(item => {
      const itemWithChildren = { ...item, [childrenField]: [] }
      itemMap.set(item[idField], itemWithChildren)
    })
    
    // 建立父子關係
    array.forEach(item => {
      const currentItem = itemMap.get(item[idField])!
      const parentId = item[parentField]
      
      if (parentId && itemMap.has(parentId)) {
        const parent = itemMap.get(parentId)!
        parent[childrenField].push(currentItem)
      } else {
        // 業務邏輯：使用自定義根節點過濾條件
        if (!rootFilter || rootFilter(item)) {
          rootItems.push(currentItem)
        }
      }
    })
    
    return rootItems
  }

  /**
   * 樹狀結構轉陣列（業務特化：支援深度標記）
   */
  static fromTreeWithDepth<T extends Record<string, any>>(
    tree: T[],
    options: {
      childrenField?: string
      /** 業務特化：為每個項目添加深度信息 */
      addDepthField?: string
      /** 業務特化：為每個項目添加路徑信息 */
      addPathField?: string
    } = {}
  ): T[] {
    const { 
      childrenField = 'children', 
      addDepthField = 'depth',
      addPathField = 'path'
    } = options
    
    const result: T[] = []
    
    function traverse(nodes: T[], depth = 0, parentPath: string[] = []) {
      for (const node of nodes) {
        const { [childrenField]: children, ...nodeData } = node
        const currentPath = [...parentPath, String((nodeData as Record<string, unknown>).id || (nodeData as Record<string, unknown>).name || '')]
        
        // 業務特化：添加深度和路徑信息
        const enhancedNode = {
          ...nodeData,
          [addDepthField]: depth,
          [addPathField]: currentPath
        } as T
        
        result.push(enhancedNode)
        
        if (children && Array.isArray(children) && children.length > 0) {
          traverse(children, depth + 1, currentPath)
        }
      }
    }
    
    traverse(tree)
    return result
  }

  /**
   * 查找項目及其在陣列中的位置信息（業務增強）
   */
  static findWithContext<T>(
    array: T[],
    predicate: (item: T) => boolean
  ): { 
    item: T
    index: number
    /** 業務特化：前一項 */
    prev?: T
    /** 業務特化：下一項 */
    next?: T
    /** 業務特化：是否為第一項 */
    isFirst: boolean
    /** 業務特化：是否為最後一項 */
    isLast: boolean
  } | null {
    for (let i = 0; i < array.length; i++) {
      if (predicate(array[i])) {
        return {
          item: array[i],
          index: i,
          prev: i > 0 ? array[i - 1] : undefined,
          next: i < array.length - 1 ? array[i + 1] : undefined,
          isFirst: i === 0,
          isLast: i === array.length - 1
        }
      }
    }
    return null
  }

  /**
   * 移動陣列元素（業務增強：支援多種移動方式）
   */
  static moveItems<T>(
    array: T[],
    options: {
      /** 移動模式 */
      mode: 'single' | 'multiple'
      /** 單項移動：從索引 */
      fromIndex?: number
      /** 單項移動：到索引 */
      toIndex?: number
      /** 多項移動：項目索引陣列 */
      indices?: number[]
      /** 多項移動：插入位置 */
      insertAt?: number
    }
  ): T[] {
    const result = [...array]
    const { mode, fromIndex, toIndex, indices, insertAt } = options
    
    if (mode === 'single' && fromIndex !== undefined && toIndex !== undefined) {
      const item = result.splice(fromIndex, 1)[0]
      result.splice(toIndex, 0, item)
    } else if (mode === 'multiple' && indices && insertAt !== undefined) {
      // 業務邏輯：批量移動項目
      const itemsToMove = indices
        .sort((a, b) => b - a) // 從後往前移除，避免索引偏移
        .map(index => result.splice(index, 1)[0])
        .reverse() // 恢復原順序
      
      result.splice(insertAt, 0, ...itemsToMove)
    }
    
    return result
  }

  /**
   * 安全的陣列操作（業務特化）
   */
  static safeOperation<T, R>(
    array: T[] | null | undefined,
    operation: (arr: T[]) => R,
    defaultValue: R
  ): R {
    if (!array || array.length === 0) {
      return defaultValue
    }
    
    try {
      return operation(array)
    } catch (error) {
      log.warn('Array operation failed', { error })
      return defaultValue
    }
  }
}

/**
 * 便利函數導出（業務特化版本）
 */

/** 業務增強版分組（包含百分比） */
export const groupByWithStats = BusinessArrayUtils.groupByWithStats

/** 業務增強版統計（包含標準差和四分位數） */
export const enhancedStats = BusinessArrayUtils.enhancedStats

/** 業務增強版分頁（包含詳細頁面信息） */
export const enhancedPaginate = BusinessArrayUtils.enhancedPaginate

/** 陣列轉樹狀結構（業務特化） */
export const toBusinessTree = BusinessArrayUtils.toTree

/** 樹狀結構轉陣列（帶深度信息） */
export const fromTreeWithDepth = BusinessArrayUtils.fromTreeWithDepth

/** 查找項目及上下文信息 */
export const findWithContext = BusinessArrayUtils.findWithContext

/** 移動陣列元素（業務增強版） */
export const moveItems = BusinessArrayUtils.moveItems

/** 安全的陣列操作 */
export const safeArrayOperation = BusinessArrayUtils.safeOperation

/**
 * 業務特化陣列操作預設
 */
export const businessArrayPresets = {
  /** 按百分比降序排序分組結果 */
  sortGroupsByPercentage: (groups: GroupResult<any, any>[]) =>
    groups.sort((a, b) => b.percentage - a.percentage),
  
  /** 過濾低於指定百分比的分組 */
  filterGroupsByMinPercentage: (groups: GroupResult<any, any>[], minPercentage: number) =>
    groups.filter(group => group.percentage >= minPercentage),
  
  /** 計算陣列的業務健康度分數 (0-10) */
  calculateHealthScore: (numbers: number[]): number => {
    if (numbers.length === 0) return 0
    
    const stats = BusinessArrayUtils.enhancedStats(numbers)
    const { average, standardDeviation, min, max } = stats
    
    // 業務邏輯：基於平均值、穩定性和範圍計算健康度
    const normalizedAverage = Math.min(average / (max || 1), 1)
    const stabilityScore = max > min ? 1 - (standardDeviation / (max - min)) : 1
    const rangeScore = max > 0 ? Math.min(average / max, 1) : 0
    
    return Math.round((normalizedAverage * 0.4 + stabilityScore * 0.4 + rangeScore * 0.2) * 10)
  },
  
  /** 找出數據中的異常值 */
  findOutliers: (numbers: number[]): number[] => {
    const stats = BusinessArrayUtils.enhancedStats(numbers)
    const { quartiles } = stats
    const iqr = quartiles.q3 - quartiles.q1
    const lowerBound = quartiles.q1 - 1.5 * iqr
    const upperBound = quartiles.q3 + 1.5 * iqr
    
    return numbers.filter(num => num < lowerBound || num > upperBound)
  }
} as const

/**
 * TypeScript 類型守衛
 */
export function isNonEmptyArray<T>(array: T[] | null | undefined): array is T[] {
  return Array.isArray(array) && array.length > 0
}

export function hasMinLength<T>(array: T[], minLength: number): boolean {
  return isNonEmptyArray(array) && array.length >= minLength
}