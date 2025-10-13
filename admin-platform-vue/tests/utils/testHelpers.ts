/**
 * 測試輔助函數集合
 * 提供常用的測試工具和斷言輔助函數
 *
 */

import { nextTick, type ComponentPublicInstance } from 'vue'
import { type VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'

// =====================================================
// 異步測試輔助函數
// =====================================================

/**
 * 等待多個 Vue tick
 */
export async function waitForTicks(count: number = 1): Promise<void> {
  for (let i = 0; i < count; i++) {
    await nextTick()
  }
}

/**
 * 等待條件為真
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50,
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}

/**
 * 等待元素出現
 */
export async function waitForElement(
  wrapper: VueWrapper<any>,
  selector: string,
  timeout: number = 5000,
): Promise<void> {
  await waitForCondition(() => wrapper.find(selector).exists(), timeout)
}

/**
 * 等待元素消失
 */
export async function waitForElementToDisappear(
  wrapper: VueWrapper<any>,
  selector: string,
  timeout: number = 5000,
): Promise<void> {
  await waitForCondition(() => !wrapper.find(selector).exists(), timeout)
}

/**
 * 等待載入狀態結束
 */
export async function waitForLoadingToFinish(
  wrapper: VueWrapper<any>,
  loadingSelector: string = '[data-testid="loading"]',
  timeout: number = 10000,
): Promise<void> {
  // 等待載入開始
  await nextTick()

  // 等待載入結束
  await waitForCondition(() => !wrapper.find(loadingSelector).exists(), timeout)
}

// =====================================================
// Vue Query 測試輔助函數
// =====================================================

/**
 * 等待 Vue Query 查詢完成
 */
export async function waitForQuery(
  wrapper: VueWrapper<any>,
  queryKey?: string,
  timeout: number = 5000,
): Promise<void> {
  await waitForCondition(() => {
    const vm = wrapper.vm as any

    // 如果指定了 queryKey，檢查特定查詢
    if (queryKey) {
      return vm[queryKey]?.isSuccess || vm[queryKey]?.isError
    }

    // 否則等待所有載入狀態結束
    return !wrapper.find('[data-testid="loading"]').exists()
  }, timeout)
}

/**
 * 模擬 Vue Query 成功狀態
 */
export function mockQuerySuccess<T>(data: T) {
  return {
    data: { value: data },
    isLoading: { value: false },
    isSuccess: { value: true },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn(),
  }
}

/**
 * 模擬 Vue Query 載入狀態
 */
export function mockQueryLoading() {
  return {
    data: { value: undefined },
    isLoading: { value: true },
    isSuccess: { value: false },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn(),
  }
}

/**
 * 模擬 Vue Query 錯誤狀態
 */
export function mockQueryError(error: Error) {
  return {
    data: { value: undefined },
    isLoading: { value: false },
    isSuccess: { value: false },
    isError: { value: true },
    error: { value: error },
    refetch: vi.fn(),
  }
}

// =====================================================
// 用戶互動模擬
// =====================================================

/**
 * 模擬點擊事件
 */
export async function clickElement(
  wrapper: VueWrapper<any>,
  selector: string,
): Promise<void> {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)

  await element.trigger('click')
  await nextTick()
}

/**
 * 模擬輸入事件
 */
export async function typeInInput(
  wrapper: VueWrapper<any>,
  selector: string,
  value: string,
): Promise<void> {
  const input = wrapper.find(selector)
  expect(input.exists()).toBe(true)

  await input.setValue(value)
  await nextTick()
}

/**
 * 模擬表單提交
 */
export async function submitForm(
  wrapper: VueWrapper<any>,
  formSelector: string = 'form',
): Promise<void> {
  const form = wrapper.find(formSelector)
  expect(form.exists()).toBe(true)

  await form.trigger('submit')
  await nextTick()
}

/**
 * 模擬鍵盤事件
 */
export async function pressKey(
  wrapper: VueWrapper<any>,
  selector: string,
  key: string,
): Promise<void> {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)

  await element.trigger('keydown', { key })
  await nextTick()
}

// =====================================================
// 斷言輔助函數
// =====================================================

/**
 * 檢查元素文本內容
 */
export function expectElementText(
  wrapper: VueWrapper<any>,
  selector: string,
  expectedText: string,
): void {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.text()).toContain(expectedText)
}

/**
 * 檢查元素是否可見
 */
export function expectElementVisible(
  wrapper: VueWrapper<any>,
  selector: string,
): void {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.isVisible()).toBe(true)
}

/**
 * 檢查元素是否隱藏
 */
export function expectElementHidden(
  wrapper: VueWrapper<any>,
  selector: string,
): void {
  const element = wrapper.find(selector)
  if (element.exists()) {
    expect(element.isVisible()).toBe(false)
  } else {
    // 元素不存在也算隱藏
    expect(element.exists()).toBe(false)
  }
}

/**
 * 檢查元素屬性
 */
export function expectElementAttribute(
  wrapper: VueWrapper<any>,
  selector: string,
  attribute: string,
  expectedValue: string,
): void {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.attributes(attribute)).toBe(expectedValue)
}

/**
 * 檢查元素類別
 */
export function expectElementClass(
  wrapper: VueWrapper<any>,
  selector: string,
  className: string,
): void {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.classes()).toContain(className)
}

/**
 * 檢查列表長度
 */
export function expectListLength(
  wrapper: VueWrapper<any>,
  selector: string,
  expectedLength: number,
): void {
  const elements = wrapper.findAll(selector)
  expect(elements.length).toBe(expectedLength)
}

// =====================================================
// 錯誤處理測試
// =====================================================

/**
 * 測試異步函數是否拋出錯誤
 */
export async function expectAsyncThrow(
  asyncFn: () => Promise<any>,
  expectedError?: string | RegExp,
): Promise<void> {
  let error: Error | null = null

  try {
    await asyncFn()
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
}

/**
 * 測試錯誤狀態顯示
 */
export function expectErrorDisplay(
  wrapper: VueWrapper<any>,
  errorSelector: string = '[data-testid="error"]',
  expectedMessage?: string,
): void {
  const errorElement = wrapper.find(errorSelector)
  expect(errorElement.exists()).toBe(true)

  if (expectedMessage) {
    expect(errorElement.text()).toContain(expectedMessage)
  }
}

// =====================================================
// 資料驗證輔助函數
// =====================================================

/**
 * 驗證 API 調用參數
 */
export function expectApiCall(
  mockFn: ReturnType<typeof vi.fn>,
  expectedUrl?: string,
  expectedMethod?: string,
  expectedData?: any,
): void {
  expect(mockFn).toHaveBeenCalled()

  if (expectedUrl || expectedMethod || expectedData) {
    const calls = mockFn.mock.calls
    expect(calls.length).toBeGreaterThan(0)

    const lastCall = calls[calls.length - 1]

    if (expectedUrl) {
      expect(lastCall[0]).toBe(expectedUrl)
    }

    if (expectedMethod) {
      expect(lastCall[1]).toBe(expectedMethod)
    }

    if (expectedData) {
      expect(lastCall[2]).toEqual(expectedData)
    }
  }
}

/**
 * 驗證事件觸發
 */
export function expectEventEmitted(
  wrapper: VueWrapper<any>,
  eventName: string,
  expectedData?: any,
): void {
  const events = wrapper.emitted(eventName)
  expect(events).toBeTruthy()
  expect(events!.length).toBeGreaterThan(0)

  if (expectedData !== undefined) {
    const lastEvent = events![events!.length - 1]
    expect(lastEvent[0]).toEqual(expectedData)
  }
}

/**
 * 驗證載入狀態
 */
export function expectLoadingState(
  wrapper: VueWrapper<any>,
  shouldBeLoading: boolean = true,
  loadingSelector: string = '[data-testid="loading"]',
): void {
  const loadingElement = wrapper.find(loadingSelector)

  if (shouldBeLoading) {
    expect(loadingElement.exists()).toBe(true)
  } else {
    expect(loadingElement.exists()).toBe(false)
  }
}

// =====================================================
// 時間相關測試工具
// =====================================================

/**
 * 使用假時間進行測試
 */
export function useFakeTime(startTime?: number): void {
  vi.useFakeTimers()
  if (startTime) {
    vi.setSystemTime(new Date(startTime))
  }
}

/**
 * 快進時間
 */
export async function advanceTime(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

/**
 * 等待所有計時器完成
 */
export async function waitForTimers(): Promise<void> {
  vi.runAllTimers()
  await nextTick()
}

// =====================================================
// 快照測試輔助
// =====================================================

/**
 * 創建組件快照
 */
export function expectComponentSnapshot(wrapper: VueWrapper<any>): void {
  expect(wrapper.html()).toMatchSnapshot()
}

/**
 * 創建特定元素快照
 */
export function expectElementSnapshot(
  wrapper: VueWrapper<any>,
  selector: string,
): void {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.html()).toMatchSnapshot()
}

// =====================================================
// 效能測試輔助
// =====================================================

/**
 * 測量函數執行時間
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; time: number }> {
  const startTime = performance.now()
  const result = await fn()
  const endTime = performance.now()

  return {
    result,
    time: endTime - startTime,
  }
}

/**
 * 檢查執行時間是否在預期範圍內
 */
export function expectExecutionTime(
  actualTime: number,
  maxTime: number,
  context?: string,
): void {
  const message = context
    ? `${context} should complete within ${maxTime}ms`
    : `Should complete within ${maxTime}ms`
  expect(actualTime).toBeLessThan(maxTime)
}
