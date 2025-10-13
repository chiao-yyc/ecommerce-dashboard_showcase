/**
 * 業務特化異步操作工具集合
 *
 * 專注於 lodash-es 沒有提供或需要業務定制的異步操作：
 * - 可清理的 Timer 管理（防止記憶體洩露）
 * - Promise 業務包裝工具
 * - 重試邏輯
 * - 批處理和並發控制
 * - Vue 整合的異步工具
 *
 * 注意：debounce 和 throttle 請使用 lodash-es 的對應函數，
 * 從 @/utils 統一導入
 */

import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Utils', 'async')

export type TimerId = number
export type CancelableTimer = () => void
export type CancelablePromise<T> = Promise<T> & { cancel: () => void }

export interface TimerOptions {
  /** 是否立即執行 */
  immediate?: boolean
  /** 最大執行次數 */
  maxCount?: number
  /** 錯誤處理函數 */
  onError?: (error: any) => void
}

export interface RetryOptions {
  /** 重試次數 */
  maxRetries?: number
  /** 重試間隔（毫秒） */
  delay?: number
  /** 退避策略：'fixed' | 'exponential' | 'linear' */
  backoffStrategy?: 'fixed' | 'exponential' | 'linear'
  /** 退避係數 */
  backoffFactor?: number
  /** 判斷是否應該重試的函數 */
  shouldRetry?: (error: any, attempt: number) => boolean
}

export interface BatchOptions {
  /** 批次大小 */
  batchSize?: number
  /** 批次間延遲 */
  delay?: number
  /** 進度回調 */
  onProgress?: (completed: number, total: number) => void
  /** 業務特化：批次失敗處理策略 */
  failureStrategy?: 'abort' | 'continue' | 'retry'
}

/**
 * 業務特化異步工具管理類
 */
export class BusinessAsyncUtils {
  private static timers = new Map<string, TimerId>()
  private static intervals = new Map<string, TimerId>()
  
  /**
   * 創建可清理的延時器（業務增強版）
   */
  static createTimer(
    callback: () => void | Promise<void>,
    delay: number,
    options: TimerOptions = {}
  ): CancelableTimer {
    const { immediate = false, maxCount, onError } = options
    let executed = 0
    let timerId: TimerId
    
    const execute = async () => {
      if (maxCount && executed >= maxCount) return
      
      executed++
      try {
        await callback()
      } catch (error) {
        if (onError) {
          onError(error)
        } else {
          log.error('Timer callback error:', error)
        }
      }
    }
    
    if (immediate) {
      execute()
    }
    
    timerId = window.setTimeout(execute, delay)
    
    return () => {
      if (timerId) {
        window.clearTimeout(timerId)
      }
    }
  }
  
  /**
   * 創建可清理的間隔器（業務增強版）
   */
  static createInterval(
    callback: () => void | Promise<void>,
    delay: number,
    options: TimerOptions = {}
  ): CancelableTimer {
    const { immediate = false, maxCount, onError } = options
    let executed = 0
    let intervalId: TimerId
    
    const execute = async () => {
      if (maxCount && executed >= maxCount) {
        window.clearInterval(intervalId)
        return
      }
      
      executed++
      try {
        await callback()
      } catch (error) {
        if (onError) {
          onError(error)
        } else {
          log.error('Interval callback error:', error)
        }
      }
    }
    
    if (immediate) {
      execute()
    }
    
    intervalId = window.setInterval(execute, delay)
    
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }
  
  /**
   * 命名定時器管理（業務特化：避免重複創建）
   */
  static setNamedTimer(
    name: string,
    callback: () => void | Promise<void>,
    delay: number,
    options: TimerOptions = {}
  ): void {
    // 清除已存在的同名定時器
    this.clearNamedTimer(name)
    
    const timerId = window.setTimeout(async () => {
      try {
        await callback()
      } catch (error) {
        if (options.onError) {
          options.onError(error)
        } else {
          log.error(`Named timer '${name}' error:`, error)
        }
      } finally {
        this.timers.delete(name)
      }
    }, delay)
    
    this.timers.set(name, timerId)
  }
  
  /**
   * 命名間隔器管理
   */
  static setNamedInterval(
    name: string,
    callback: () => void | Promise<void>,
    delay: number,
    options: TimerOptions = {}
  ): void {
    this.clearNamedInterval(name)
    
    const intervalId = window.setInterval(async () => {
      try {
        await callback()
      } catch (error) {
        if (options.onError) {
          options.onError(error)
        } else {
          log.error(`Named interval '${name}' error:`, error)
        }
      }
    }, delay)
    
    this.intervals.set(name, intervalId)
  }
  
  /**
   * 清除命名定時器
   */
  static clearNamedTimer(name: string): void {
    const timerId = this.timers.get(name)
    if (timerId) {
      window.clearTimeout(timerId)
      this.timers.delete(name)
    }
  }
  
  /**
   * 清除命名間隔器
   */
  static clearNamedInterval(name: string): void {
    const intervalId = this.intervals.get(name)
    if (intervalId) {
      window.clearInterval(intervalId)
      this.intervals.delete(name)
    }
  }
  
  /**
   * 清除所有定時器和間隔器
   */
  static clearAll(): void {
    this.timers.forEach((timerId) => window.clearTimeout(timerId))
    this.intervals.forEach((intervalId) => window.clearInterval(intervalId))
    this.timers.clear()
    this.intervals.clear()
  }
  
  /**
   * 獲取活躍的定時器數量（業務監控用）
   */
  static getActiveCount(): { timers: number; intervals: number } {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size
    }
  }
}

/**
 * 創建可取消的 Promise（業務特化）
 */
export function createCancelablePromise<T>(
  promise: Promise<T>,
  options: {
    /** 業務特化：取消時的清理回調 */
    onCancel?: () => void
    /** 業務特化：取消訊息 */
    cancelMessage?: string
  } = {}
): CancelablePromise<T> {
  let isCanceled = false
  const { onCancel, cancelMessage = 'Promise was canceled' } = options
  
  const cancelablePromise = new Promise<T>((resolve, reject) => {
    promise.then(
      (value) => {
        if (!isCanceled) resolve(value)
      },
      (reason) => {
        if (!isCanceled) reject(reason)
      }
    )
  }) as CancelablePromise<T>
  
  cancelablePromise.cancel = () => {
    if (!isCanceled) {
      isCanceled = true
      if (onCancel) onCancel()
      log.warn(cancelMessage)
    }
  }
  
  return cancelablePromise
}

/**
 * 超時 Promise（業務增強版）
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  options: {
    timeoutMessage?: string
    /** 業務特化：超時後的清理回調 */
    onTimeout?: () => void
  } = {}
): Promise<T> {
  const { timeoutMessage = 'Operation timed out', onTimeout } = options
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (onTimeout) onTimeout()
      reject(new Error(timeoutMessage))
    }, timeoutMs)
    
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId))
  })
}

/**
 * 業務特化重試函數
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffStrategy = 'exponential',
    backoffFactor = 2,
    shouldRetry = () => true
  } = options
  
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error
      }
      
      // 計算延遲時間
      let currentDelay = delay
      switch (backoffStrategy) {
        case 'exponential':
          currentDelay = delay * Math.pow(backoffFactor, attempt)
          break
        case 'linear':
          currentDelay = delay * (attempt + 1)
          break
        case 'fixed':
        default:
          currentDelay = delay
          break
      }
      
      await sleep(currentDelay)
    }
  }
  
  throw lastError
}

/**
 * 睡眠函數
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 業務增強版批處理異步操作
 */
export async function batch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchOptions = {}
): Promise<{
  results: R[]
  failures: { item: T; error: any }[]
  summary: {
    total: number
    succeeded: number
    failed: number
    successRate: number
  }
}> {
  const { 
    batchSize = 5, 
    delay = 0, 
    onProgress, 
    failureStrategy = 'continue' 
  } = options
  
  const results: R[] = []
  const failures: { item: T; error: any }[] = []
  let processedCount = 0
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    if (failureStrategy === 'abort' && failures.length > 0) {
      break
    }
    
    const batchPromises = batch.map(async (item, index) => {
      try {
        const result = await processor(item)
        results[i + index] = result
        return { success: true, result, item }
      } catch (error) {
        failures.push({ item, error })
        return { success: false, error, item }
      }
    })
    
    await Promise.all(batchPromises)
    processedCount += batch.length
    
    if (onProgress) {
      onProgress(Math.min(processedCount, items.length), items.length)
    }
    
    if (delay > 0 && i + batchSize < items.length) {
      await sleep(delay)
    }
  }
  
  return {
    results: results.filter(r => r !== undefined),
    failures,
    summary: {
      total: items.length,
      succeeded: results.filter(r => r !== undefined).length,
      failed: failures.length,
      successRate: items.length > 0 ? (results.filter(r => r !== undefined).length / items.length) * 100 : 0
    }
  }
}

/**
 * 並發控制（業務增強版）
 */
export async function concurrent<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 3,
  options: {
    /** 業務特化：失敗處理策略 */
    failureStrategy?: 'abort' | 'continue'
    /** 業務特化：進度回調 */
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<{
  results: (R | undefined)[]
  errors: { index: number; error: any }[]
  summary: {
    total: number
    succeeded: number
    failed: number
  }
}> {
  const { failureStrategy = 'continue', onProgress } = options
  
  return new Promise((resolve, reject) => {
    const results: (R | undefined)[] = new Array(items.length).fill(undefined)
    const errors: { index: number; error: any }[] = []
    let completed = 0
    let index = 0
    let shouldAbort = false
    
    function processNext() {
      if (shouldAbort || index >= items.length) return
      
      const currentIndex = index++
      const item = items[currentIndex]
      
      processor(item)
        .then(result => {
          results[currentIndex] = result
          completed++
          
          if (onProgress) {
            onProgress(completed, items.length)
          }
          
          if (completed === items.length) {
            resolve({
              results,
              errors,
              summary: {
                total: items.length,
                succeeded: results.filter(r => r !== undefined).length,
                failed: errors.length
              }
            })
          } else {
            processNext()
          }
        })
        .catch(error => {
          errors.push({ index: currentIndex, error })
          completed++
          
          if (failureStrategy === 'abort') {
            shouldAbort = true
            reject(error)
            return
          }
          
          if (onProgress) {
            onProgress(completed, items.length)
          }
          
          if (completed === items.length) {
            resolve({
              results,
              errors,
              summary: {
                total: items.length,
                succeeded: results.filter(r => r !== undefined).length,
                failed: errors.length
              }
            })
          } else {
            processNext()
          }
        })
    }
    
    // 啟動並發處理
    for (let i = 0; i < Math.min(concurrency, items.length); i++) {
      processNext()
    }
  })
}

/**
 * 便利函數導出
 */

/** 延時執行 */
export const delay = sleep

/** 可清理的延時執行 */
export const createDelay = BusinessAsyncUtils.createTimer

/** 可清理的間隔執行 */
export const createInterval = BusinessAsyncUtils.createInterval

/** 命名定時器 */
export const setNamedTimer = BusinessAsyncUtils.setNamedTimer.bind(BusinessAsyncUtils)

/** 命名間隔器 */
export const setNamedInterval = BusinessAsyncUtils.setNamedInterval.bind(BusinessAsyncUtils)

/** 清除命名定時器 */
export const clearNamedTimer = BusinessAsyncUtils.clearNamedTimer.bind(BusinessAsyncUtils)

/** 清除命名間隔器 */
export const clearNamedInterval = BusinessAsyncUtils.clearNamedInterval.bind(BusinessAsyncUtils)

/** 清除所有定時器 */
export const clearAllTimers = BusinessAsyncUtils.clearAll.bind(BusinessAsyncUtils)

/** 獲取活躍定時器數量 */
export const getActiveTimerCount = BusinessAsyncUtils.getActiveCount.bind(BusinessAsyncUtils)

/**
 * Vue 組合式函數風格的異步工具（業務特化）
 */
export function useAsyncUtils() {
  const timers = new Map<string, CancelableTimer>()
  
  const createTimer = (callback: () => void | Promise<void>, delay: number) => {
    const cancel = BusinessAsyncUtils.createTimer(callback, delay)
    return cancel
  }
  
  const createInterval = (callback: () => void | Promise<void>, delay: number) => {
    const cancel = BusinessAsyncUtils.createInterval(callback, delay)
    return cancel
  }
  
  const cleanup = () => {
    timers.forEach(cancel => cancel())
    timers.clear()
  }
  
  // 自動清理（適用於 Vue 組件）
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)
  }
  
  return {
    createTimer,
    createInterval,
    sleep,
    retry,
    withTimeout,
    batch,
    concurrent,
    cleanup
  }
}