/**
 * Composable Testing Utilities
 * 
 * 提供在適當的 Vue 組件上下文中測試 composables 的工具函數，
 * 解決 onUnmounted 生命週期警告問題
 */

import { defineComponent, createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { vi } from 'vitest'

/**
 * 在 Vue 組件上下文中測試 composable
 * 解決 onUnmounted 生命週期警告
 */
export function withSetup<T>(composable: () => T) {
  let result: T | undefined

  // 創建測試組件
  const TestComponent = defineComponent({
    setup() {
      result = composable()
      
      // 返回一個空的 render 函數
      return () => null
    }
  })

  // 設置 Pinia
  const pinia = createPinia()
  setActivePinia(pinia)

  // 掛載組件
  const wrapper = mount(TestComponent, {
    global: {
      plugins: [pinia]
    }
  })

  return {
    result: result as T,
    wrapper,
    pinia,
    // 清理函數
    unmount: () => wrapper.unmount()
  }
}

/**
 * 異步等待 composable 初始化
 */
export async function withAsyncSetup<T>(composable: () => T) {
  const setup = withSetup(composable)
  await nextTick()
  return setup
}

/**
 * 測試 composable 的響應式數據變化
 */
export async function testReactivity<T>(
  composable: () => T,
  testFn: (result: T) => Promise<void>
) {
  const { result, unmount } = withSetup(composable)
  
  try {
    await testFn(result)
  } finally {
    unmount()
  }
}

/**
 * 批量測試 composable 的多個場景
 */
export async function testComposableScenarios<T>(
  composableFactory: () => T,
  scenarios: Array<{
    name: string
    test: (result: T) => Promise<void>
  }>
) {
  for (const scenario of scenarios) {
    await testReactivity(composableFactory, scenario.test)
  }
}

/**
 * 在帶有 Mock 的環境中測試 composable
 */
export function withMockedSetup<T>(
  composable: () => T,
  mocks?: Record<string, any>
) {
  // 應用 mocks
  if (mocks) {
    Object.entries(mocks).forEach(([path, mock]) => {
      vi.mock(path, () => mock)
    })
  }

  const setup = withSetup(composable)
  
  return {
    ...setup,
    // 清理 mocks
    cleanup: () => {
      setup.unmount()
      if (mocks) {
        vi.clearAllMocks()
      }
    }
  }
}

/**
 * 測試 composable 的錯誤處理
 */
export async function testComposableError<T>(
  composable: () => T,
  errorTrigger: (result: T) => Promise<void>,
  expectedError?: string | RegExp
) {
  const { result, unmount } = withSetup(composable)
  
  try {
    let error: Error | null = null
    
    try {
      await errorTrigger(result)
    } catch (e) {
      error = e as Error
    }

    expect(error).not.toBeNull()

    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error!.message).toContain(expectedError)
      } else {
        expect(error!.message).toMatch(expectedError)
      }
    }
  } finally {
    unmount()
  }
}

/**
 * 等待 composable 中的異步操作完成
 */
export async function waitForComposableAsync<T>(
  result: T,
  condition: (result: T) => boolean,
  timeout = 5000
) {
  const startTime = Date.now()

  while (!condition(result)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
    
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}