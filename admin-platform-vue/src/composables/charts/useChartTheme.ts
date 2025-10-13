import { createModuleLogger } from '@/utils/logger'
import { ref, computed, watch } from 'vue'

const log = createModuleLogger('Composable', 'ChartTheme')


export interface ChartTheme {
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    axis: string
    grid: string
    [key: string]: string
  }
  fontFamily: string
  fontSize: number
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// 從 CSS 變數獲取顏色值的輔助函數（強制重新計算）
const getCSSVariable = (name: string): string => {
  if (typeof window !== 'undefined') {
    // 強制重新計算樣式，避免緩存問題
    const root = document.documentElement
    // 觸發重新計算
    root.style.getPropertyValue(`--${name}`)
    return getComputedStyle(root, null).getPropertyValue(`--${name}`).trim()
  }
  return ''
}

// 動態主題，基於當前 CSS 變數
const getDynamicTheme = (): ChartTheme => ({
  colors: {
    primary: getCSSVariable('primary') || 'oklch(0.205 0 0)',
    secondary: getCSSVariable('secondary') || 'oklch(0.97 0 0)',
    background: getCSSVariable('background') || 'oklch(1 0 0)',
    text: getCSSVariable('foreground') || 'oklch(0.145 0 0)',
    axis: getCSSVariable('muted-foreground') || 'oklch(0.556 0 0)',
    grid: getCSSVariable('border') || 'oklch(0.922 0 0)',
    // 使用 CSS 圖表變數作為系列顏色
    series: (() => [
      getCSSVariable('chart-1') || 'oklch(0.646 0.222 41.116)',
      getCSSVariable('chart-2') || 'oklch(0.6 0.118 184.704)',
      getCSSVariable('chart-3') || 'oklch(0.398 0.07 227.392)',
      getCSSVariable('chart-4') || 'oklch(0.828 0.189 84.429)',
      getCSSVariable('chart-5') || 'oklch(0.769 0.188 70.08)',
    ])() as any,
    'chart-1': getCSSVariable('chart-1') || 'oklch(0.646 0.222 41.116)',
    'chart-2': getCSSVariable('chart-2') || 'oklch(0.6 0.118 184.704)',
    'chart-3': getCSSVariable('chart-3') || 'oklch(0.398 0.07 227.392)',
    'chart-4': getCSSVariable('chart-4') || 'oklch(0.828 0.189 84.429)',
    'chart-5': getCSSVariable('chart-5') || 'oklch(0.769 0.188 70.08)',
    'vis-font-family':
      getCSSVariable('vis-font-family') ||
      getCSSVariable('font-family') ||
      'system-ui, -apple-system, sans-serif',
  },
  fontFamily:
    getCSSVariable('font-family') || 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
  padding: {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50,
  },
})

// 靜態回退主題（當 CSS 變數不可用時）
const fallbackTheme: ChartTheme = {
  colors: {
    primary: 'oklch(0.205 0 0)',
    secondary: 'oklch(0.97 0 0)',
    background: 'oklch(1 0 0)',
    text: 'oklch(0.145 0 0)',
    axis: 'oklch(0.556 0 0)',
    grid: 'oklch(0.922 0 0)',
    series: (() => [
      'oklch(0.646 0.222 41.116)',
      'oklch(0.6 0.118 184.704)',
      'oklch(0.398 0.07 227.392)',
      'oklch(0.828 0.189 84.429)',
      'oklch(0.769 0.188 70.08)',
    ])() as any,
    'chart-1': 'oklch(0.646 0.222 41.116)',
    'chart-2': 'oklch(0.6 0.118 184.704)',
    'chart-3': 'oklch(0.398 0.07 227.392)',
    'chart-4': 'oklch(0.828 0.189 84.429)',
    'chart-5': 'oklch(0.769 0.188 70.08)',
    'vis-font-family':
      getCSSVariable('vis-font-family') ||
      getCSSVariable('font-family') ||
      'system-ui, -apple-system, sans-serif',
  },
  fontFamily:
    getCSSVariable('font-family') || 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
  padding: {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50,
  },
}

// 全域單例實例
let chartThemeInstance: ReturnType<typeof createChartTheme> | null = null

function createChartTheme() {
  // 響應式主題，自動同步 CSS 變數
  const theme = computed(() => {
    try {
      return getDynamicTheme()
    } catch {
      // 回退到靜態主題
      return fallbackTheme
    }
  })

  // 手動設定主題（用於覆蓋特定值）
  const customTheme = ref<Partial<ChartTheme>>({})

  // 響應式觸發器，用於強制重新計算圖表顏色
  const colorUpdateTrigger = ref(0)

  const setTheme = (themeOverrides: Partial<ChartTheme>) => {
    customTheme.value = themeOverrides
  }

  // 最終主題 = 動態主題 + 自訂覆蓋
  const finalTheme = computed(() => ({
    ...theme.value,
    ...customTheme.value,
    colors: {
      ...theme.value.colors,
      ...(customTheme.value.colors || {}),
    },
    padding: {
      ...theme.value.padding,
      ...(customTheme.value.padding || {}),
    },
  }))

  // 統一的圖表顏色獲取方法（改進時序控制）
  const getChartColors = () => {
    // 確保在瀏覽器環境中執行
    if (typeof window === 'undefined') {
      return [
        'oklch(0.646 0.222 41.116)',
        'oklch(0.6 0.118 184.704)',
        'oklch(0.398 0.07 227.392)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.769 0.188 70.08)',
      ]
    }

    // 強制重新讀取 CSS 變數，確保獲取最新值
    return [
      getCSSVariable('chart-1') || 'oklch(0.646 0.222 41.116)',
      getCSSVariable('chart-2') || 'oklch(0.6 0.118 184.704)',
      getCSSVariable('chart-3') || 'oklch(0.398 0.07 227.392)',
      getCSSVariable('chart-4') || 'oklch(0.828 0.189 84.429)',
      getCSSVariable('chart-5') || 'oklch(0.769 0.188 70.08)',
    ]
  }

  // 獲取暗色模式顏色（如果定義）
  const getChartColorsDark = () => {
    const darkColors = [
      getCSSVariable('chart-1-dark'),
      getCSSVariable('chart-2-dark'),
      getCSSVariable('chart-3-dark'),
      getCSSVariable('chart-4-dark'),
      getCSSVariable('chart-5-dark'),
    ]

    // 如果沒有定義暗色，回退到普通顏色
    return darkColors.every((color) => color) ? darkColors : getChartColors()
  }

  // 更新全域 UNOVIS 顏色
  const updateUnovisColors = () => {
    if (typeof window !== 'undefined' && typeof globalThis !== 'undefined') {
      const colors = getChartColors()
      const darkColors = getChartColorsDark()

      ;(globalThis as any).UNOVIS_COLORS = colors
      ;(globalThis as any).UNOVIS_COLORS_DARK = darkColors

      log.debug('🎨 UNOVIS 圖表顏色已更新:', {
        light: colors,
        dark: darkColors,
      })
    }
  }

  // 響應式的圖表顏色（使用 ref + 手動更新）
  const chartColors = ref<string[]>(getChartColors())

  // 更新圖表顏色的函數
  const updateChartColors = () => {
    const newColors = getChartColors()
    chartColors.value = [...newColors] // 創建新陣列確保響應性
    log.debug('🔄 圖表顏色已更新:', newColors)
  }

  // 監聽觸發器變化
  watch(colorUpdateTrigger, updateChartColors, { immediate: false })

  // 獲取 Vis 字體
  const getVisFont = () => {
    return (
      getCSSVariable('vis-font-family') ||
      getCSSVariable('font-family') ||
      'system-ui, -apple-system, sans-serif'
    )
  }

  // 重新整理主題（強制重新讀取 CSS 變數並更新 UNOVIS 顏色）
  const refreshTheme = () => {
    // 直接更新圖表顏色和 UNOVIS 顏色
    updateChartColors()
    updateUnovisColors()

    // 同時觸發觸發器（以防其他地方需要）
    colorUpdateTrigger.value++
  }

  // 監聽主題變化，自動更新 UNOVIS 顏色
  watch(
    finalTheme,
    () => {
      updateUnovisColors()
    },
    { deep: true, flush: 'post' },
  )

  // 不再需要事件監聽器，使用直接觸發機制

  return {
    theme: finalTheme,
    chartColors,
    colorUpdateTrigger, // 暴露觸發器給外部使用
    setTheme,
    refreshTheme,
    updateUnovisColors,
    getChartColors,
    getChartColorsDark,
    getVisFont,
  }
}

export function useChartTheme() {
  if (!chartThemeInstance) {
    chartThemeInstance = createChartTheme()
    log.debug('🎨 圖表主題單例已創建')
  }
  return chartThemeInstance
}
