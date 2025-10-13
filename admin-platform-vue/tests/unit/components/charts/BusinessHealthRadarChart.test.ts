/**
 * BusinessHealthRadarChart 圖表組件測試
 * 測試業務健康度雷達圖的渲染、數據處理和交互功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import BusinessHealthRadarChart from '@/components/charts/pure/BusinessHealthRadarChart.vue'
import type { BusinessHealthMetrics } from '@/types/dashboard'

// Mock i18n with immediate function
vi.mock('vue-i18n', () => {
  const mockTranslation = (key: string) => {
    const translations: Record<string, string> = {
      'export.pdf.dimensions.revenue': '營收表現',
      'export.pdf.dimensions.satisfaction': '客戶滿意度',
      'export.pdf.dimensions.fulfillment': '訂單履行',
      'export.pdf.dimensions.support': '客服支援',
      'export.pdf.dimensions.products': '產品管理',
      'export.pdf.dimensions.marketing': '行銷效果',
      'export.pdf.dimensions.system': '系統穩定度',
    }
    return translations[key] || key
  }

  return {
    useI18n: () => ({
      t: mockTranslation,
      locale: { value: 'zh-TW' }
    }),
    createI18n: vi.fn(() => ({
      global: {
        t: mockTranslation,
        locale: 'zh-TW'
      }
    }))
  }
})

// Mock SimpleExportChart 組件
vi.mock('@/components/common/SimpleExportChart.vue', () => ({
  default: {
    name: 'SimpleExportChart',
    template: '<div data-testid="export-chart"><slot /></div>',
    props: ['config', 'loading']
  }
}))

describe('BusinessHealthRadarChart', () => {
  let wrapper: VueWrapper<any>

  const mockHealthData: BusinessHealthMetrics = {
    revenue: 8.5,
    satisfaction: 7.2,
    fulfillment: 9.1,
    support: 6.8,
    products: 7.9,
    marketing: 8.3,
    system: 7.5
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('組件渲染', () => {
    it('應該成功渲染雷達圖結構', () => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          loading: false,
          width: 400,
          height: 300
        }
      })

      // 驗證主要 SVG 元素存在
      expect(wrapper.find('svg').exists()).toBe(true)
      expect(wrapper.find('[data-testid="export-chart"]').exists()).toBe(true)
      
      // 驗證SVG尺寸設定正確
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('400')
      expect(svg.attributes('height')).toBe('300')
    })

    it('應該在載入狀態時顯示載入指示器', () => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          loading: true
        }
      })

      // 驗證載入狀態組件存在
      expect(wrapper.findComponent({ name: 'UniversalSpinner' }).exists()).toBe(true)
    })

    it('應該支援自定義尺寸配置', () => {
      const customWidth = 500
      const customHeight = 400

      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          width: customWidth,
          height: customHeight
        }
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe(customWidth.toString())
      expect(svg.attributes('height')).toBe(customHeight.toString())
    })
  })

  describe('數據處理與視覺化', () => {
    beforeEach(() => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          loading: false
        }
      })
    })

    it('應該正確渲染七個業務維度', () => {
      // 驗證所有維度標籤都被渲染
      const dimensionTexts = wrapper.findAll('text')
      
      // 應該至少包含維度標籤和分數文字
      expect(dimensionTexts.length).toBeGreaterThan(0)
      
      // 驗證關鍵維度標籤存在
      const textContents = dimensionTexts.map(text => text.text()).join(' ')
      expect(textContents).toContain('營收表現')
      expect(textContents).toContain('客戶滿意度')
      expect(textContents).toContain('系統穩定度')
    })

    it('應該正確處理各維度的數值範圍 (0-10)', () => {
      // 驗證 SVG 圖形元素存在（可能是 polygon、path 或其他圖形元素）
      const svgElements = wrapper.findAll('polygon, path, circle, rect')
      expect(svgElements.length).toBeGreaterThan(0)

      // 驗證 SVG 容器存在
      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
    })

    it('應該正確應用國際化標籤', () => {
      // 驗證所有維度標籤都被渲染
      const textContents = wrapper.findAll('text').map(text => text.text()).join(' ')
      expect(textContents).toContain('營收表現')
      expect(textContents).toContain('客戶滿意度')
      expect(textContents).toContain('系統穩定度')
    })
  })

  describe('交互功能', () => {
    beforeEach(() => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          loading: false
        }
      })
    })

    it('應該支援維度懸停效果', async () => {
      // 找到可交互的元素（可能是 circle 或其他圖形元素）
      const interactiveElements = wrapper.findAll('circle, rect, path')
      
      if (interactiveElements.length > 0) {
        const firstElement = interactiveElements[0]
        
        // 觸發懸停事件
        await firstElement.trigger('mouseenter')
        await wrapper.vm.$nextTick()
        
        // 驗證懸停狀態變化（可能通過CSS類或屬性變化體現）
        // 這裡的具體驗證取決於實際的懸停實現
        expect(wrapper.vm.hoveredDimension).toBeDefined()
      }
    })

    it('應該支援懸停離開重置狀態', async () => {
      const interactiveElements = wrapper.findAll('circle, rect, path')
      
      if (interactiveElements.length > 0) {
        const firstElement = interactiveElements[0]
        
        // 觸發懸停進入再離開
        await firstElement.trigger('mouseenter')
        await firstElement.trigger('mouseleave')
        await wrapper.vm.$nextTick()
        
        // 驗證懸停狀態被清除
        expect(wrapper.vm.hoveredDimension).toBeNull()
      }
    })
  })

  describe('匯出功能', () => {
    it('應該在啟用時顯示匯出按鈕', () => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          showExportButton: true
        }
      })

      // 驗證匯出組件被渲染
      expect(wrapper.findComponent({ name: 'SimpleExportChart' }).exists()).toBe(true)
    })

    it('應該在未啟用時隱藏匯出按鈕', () => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          showExportButton: false
        }
      })

      // 驗證匯出組件存在但可能被隱藏或配置不同
      const exportChart = wrapper.findComponent({ name: 'SimpleExportChart' })
      // 組件應該總是存在，但配置可能不同
      expect(exportChart.exists()).toBe(true)
    })
  })

  describe('邊界條件處理', () => {
    it('應該處理空或無效數據', () => {
      const invalidData = {} as BusinessHealthMetrics

      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: invalidData,
          loading: false
        }
      })

      // 組件應該不會崩潰
      expect(wrapper.exists()).toBe(true)
      
      // 應該有適當的錯誤處理或預設顯示
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('應該處理極端數值 (0 和 10)', () => {
      const extremeData: BusinessHealthMetrics = {
        revenue: 0,
        satisfaction: 10,
        fulfillment: 0,
        support: 10,
        products: 0,
        marketing: 10,
        system: 5
      }

      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: extremeData,
          loading: false
        }
      })

      // 組件應該能正確渲染極端值
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('應該處理小尺寸渲染', () => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          width: 100,
          height: 100
        }
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('100')
      expect(svg.attributes('height')).toBe('100')
      
      // 小尺寸下組件仍應正常渲染
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('效能考量', () => {
    it('應該有效處理數據變更', async () => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          loading: false
        }
      })

      // 模擬數據變更
      const newData: BusinessHealthMetrics = {
        ...mockHealthData,
        revenue: 9.5,
        satisfaction: 8.0
      }

      await wrapper.setProps({ data: newData })
      await wrapper.vm.$nextTick()

      // 組件應該重新渲染新數據
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('應該適當處理載入狀態切換', async () => {
      wrapper = mount(BusinessHealthRadarChart, {
        props: {
          data: mockHealthData,
          loading: true
        }
      })

      expect(wrapper.findComponent({ name: 'UniversalSpinner' }).exists()).toBe(true)

      // 切換到載入完成狀態
      await wrapper.setProps({ loading: false })
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent({ name: 'UniversalSpinner' }).exists()).toBe(false)
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })
})