/**
 * Vue 組件分層 Mock 策略工廠
 * 為不同類型的組件提供標準化的 Mock 配置和測試模板
 */

import { vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'

// ============================================================================
// 類型定義
// ============================================================================

export interface MockNotification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'unread' | 'read' | 'completed' | 'dismissed'
  category: string
  completionStrategy: 'suggested' | 'automatic' | 'manual'
  suggestedComplete: boolean
  isPersonal: boolean
  notificationSource: string
  createdAt: string
}

export interface TestEnvironmentOptions {
  props?: Record<string, any>
  stubs?: Record<string, any>
  mocks?: Record<string, any>
  provide?: Record<string, any>
}

// ============================================================================
// 核心 Mock 配置
// ============================================================================

/**
 * 統一的 vue-i18n Mock
 * 支援常用的翻譯鍵映射
 */
export const createI18nMock = () => {
  return vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()
    return {
      ...actual,
      useI18n: () => ({
        t: vi.fn((key: string) => {
          // 常用翻譯映射
          const translations: Record<string, string> = {
            // Dashboard 相關
            'dashboard.title': '儀表板',
            'dashboard.loading': '載入中...',
            'dashboard.error': '載入錯誤',
            
            // 通用操作
            'common.save': '儲存',
            'common.cancel': '取消',
            'common.delete': '刪除',
            'common.edit': '編輯',
            'common.view': '檢視',
            'common.export': '匯出',
            'common.import': '匯入',
            'common.search': '搜尋',
            'common.filter': '篩選',
            'common.refresh': '重新整理',
            
            // 表格相關
            'table.noData': '無資料',
            'table.loading': '載入資料中...',
            'table.actions': '操作',
            'table.selectAll': '全選',
            
            // 表單相關
            'form.required': '必填欄位',
            'form.invalid': '格式錯誤',
            'form.submit': '提交',
            'form.reset': '重設',
            
            // 通知相關
            'notification.success': '操作成功',
            'notification.error': '操作失敗',
            'notification.warning': '警告',
            'notification.info': '資訊',
            
            // 業務健康度相關
            'export.pdf.dimensions.revenue': '營收表現',
            'export.pdf.dimensions.satisfaction': '客戶滿意度',
            'export.pdf.dimensions.fulfillment': '訂單履行',
            'export.pdf.dimensions.support': '客服支援',
            'export.pdf.dimensions.products': '產品管理',
            'export.pdf.dimensions.marketing': '行銷效果',
            'export.pdf.dimensions.system': '系統穩定度',
          }
          return translations[key] || key
        }),
        locale: { value: 'zh-TW' }
      })
    }
  })
}

/**
 * 統一的 Vue Router Mock
 * 支援 useRouter 和 useRoute 兩種模式
 */
export const createRouterMock = () => {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    resolve: vi.fn(),
    currentRoute: {
      value: {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        meta: {}
      }
    }
  }
}

/**
 * 標準化的 Vue Router 完整 Mock
 * 包含 useRouter 和 useRoute
 */
export const createVueRouterMock = () => {
  return vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-router')>()
    const routerMock = createRouterMock()
    
    return {
      ...actual,
      useRoute: () => ({
        query: {},
        params: {},
        path: '/test',
        name: 'test',
        meta: {},
      }),
      useRouter: () => routerMock,
      createRouter: vi.fn(() => ({
        ...routerMock,
        install: vi.fn(),
        options: {},
      })),
      createWebHistory: vi.fn(() => ({})),
      createWebHashHistory: vi.fn(() => ({})),
      createMemoryHistory: vi.fn(() => ({})),
    }
  })
}

/**
 * 常用組件 Stubs 配置
 */
export const createCommonStubs = () => ({
  // Loading 組件
  UniversalSpinner: true,
  LoadingSpinner: true,
  LoadingOverlay: true,
  
  // 圖表組件
  SimpleExportChart: true,
  ChartContainer: true,
  ChartCard: true,
  
  // UI 組件
  Button: true,
  Input: true,
  Select: true,
  Dialog: true,
  DialogContent: true,
  DialogHeader: true,
  DialogFooter: true,
  
  // 圖標
  'lucide-react': true,
  Icon: true,
  
  // 第三方組件
  VueResizeObserver: true,
  Teleport: true,
})

/**
 * 完整 UI 組件 Mock 配置
 * 用於需要完整 UI 交互測試的複雜組件
 */
export const createCompleteUIMocks = () => ({
  // Tabs 系列組件
  '@/components/ui/tabs': {
    Tabs: {
      name: 'Tabs',
      props: ['defaultValue', 'value', 'modelValue'],
      emits: ['update:modelValue'],
      template: '<div class="tabs-mock"><slot /></div>'
    },
    TabsContent: {
      name: 'TabsContent', 
      props: ['value'],
      template: '<div class="tabs-content" style="display: block !important;"><slot /></div>'
    },
    TabsList: {
      name: 'TabsList',
      template: '<div class="tabs-list"><slot /></div>'
    },
    TabsTrigger: {
      name: 'TabsTrigger',
      props: ['value'],
      template: '<button class="tabs-trigger"><slot /></button>'
    },
  },
  
  // Button 系列組件
  '@/components/ui/button': {
    Button: {
      name: 'Button',
      props: ['variant', 'size', 'disabled'],
      emits: ['click'],
      template: '<button @click="$emit(\'click\', $event)" :disabled="disabled"><slot /></button>'
    },
  },
  
  // Badge 系列組件
  '@/components/ui/badge': {
    Badge: {
      name: 'Badge',
      props: ['variant', 'class'],
      template: '<span :class="class"><slot /></span>'
    },
  },
  
  // Card 系列組件
  '@/components/ui/card': {
    Card: { name: 'Card', template: '<div class="card-mock"><slot /></div>' },
    CardContent: { name: 'CardContent', template: '<div class="card-content-mock"><slot /></div>' },
    CardHeader: { name: 'CardHeader', template: '<div class="card-header-mock"><slot /></div>' },
    CardTitle: { name: 'CardTitle', template: '<div class="card-title-mock"><slot /></div>' },
  },
  
  // Input 系列組件
  '@/components/ui/input': {
    Input: {
      name: 'Input',
      props: ['modelValue', 'placeholder', 'disabled'],
      emits: ['update:modelValue', 'input'],
      template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" data-testid="mock-input" />'
    },
  },
  
  // Select 系列組件
  '@/components/ui/select': {
    Select: { name: 'Select', template: '<div class="select-mock"><slot /></div>' },
    SelectContent: { name: 'SelectContent', template: '<div class="select-content-mock"><slot /></div>' },
    SelectItem: { 
      name: 'SelectItem',
      props: ['value'],
      template: '<div class="select-item-mock" @click="$emit(\'select\', value)"><slot /></div>'
    },
    SelectTrigger: { name: 'SelectTrigger', template: '<div class="select-trigger-mock"><slot /></div>' },
    SelectValue: { name: 'SelectValue', template: '<div class="select-value-mock"><slot /></div>' },
  },
  
  // Dropdown Menu 系列組件
  '@/components/ui/dropdown-menu': {
    DropdownMenu: { name: 'DropdownMenu', template: '<div class="dropdown-mock"><slot /></div>' },
    DropdownMenuContent: { name: 'DropdownMenuContent', template: '<div class="dropdown-content-mock"><slot /></div>' },
    DropdownMenuItem: {
      name: 'DropdownMenuItem',
      emits: ['click'],
      template: '<div class="dropdown-item-mock" @click="$emit(\'click\')" data-testid="dropdown-item"><slot /></div>'
    },
    DropdownMenuLabel: { name: 'DropdownMenuLabel', template: '<div class="dropdown-label-mock"><slot /></div>' },
    DropdownMenuSeparator: { name: 'DropdownMenuSeparator', template: '<div class="dropdown-separator-mock"></div>' },
    DropdownMenuTrigger: { name: 'DropdownMenuTrigger', template: '<div class="dropdown-trigger-mock" data-testid="dropdown-trigger"><slot /></div>' },
  },
  
  // 其他 UI 組件
  '@/components/ui/skeleton': {
    Skeleton: {
      name: 'Skeleton',
      template: '<div class="skeleton-mock" data-testid="loading-skeleton"></div>'
    },
  },
  
  '@/components/ui/separator': {
    Separator: { name: 'Separator', template: '<div class="separator-mock"></div>' },
  },
  
  '@/components/ui/scroll-area': {
    ScrollArea: {
      name: 'ScrollArea',
      template: '<div class="scroll-area-mock" data-testid="scroll-area"><slot /></div>'
    },
  },
})

// ============================================================================
// 組件測試工廠
// ============================================================================

/**
 * 圖表組件測試配置工廠
 */
export class ChartComponentTestFactory {
  static createMountOptions(customProps = {}, customStubs = {}) {
    return {
      props: {
        loading: false,
        width: 320,
        height: 200,
        showExportButton: false,
        ...customProps
      },
      global: {
        stubs: {
          ...createCommonStubs(),
          ...customStubs
        },
        mocks: {
          $router: createRouterMock(),
        }
      }
    }
  }

  static createMockChartData() {
    return {
      labels: ['測試1', '測試2', '測試3'],
      datasets: [{
        data: [10, 20, 30],
        backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe']
      }]
    }
  }

  /**
   * 標準圖表組件測試案例
   */
  static getStandardTestCases() {
    return [
      {
        name: '應該能夠成功掛載組件',
        test: (wrapper: VueWrapper<any>) => {
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm).toBeTruthy()
        }
      },
      {
        name: '應該在載入時顯示載入指示器',
        props: { loading: true },
        test: (wrapper: VueWrapper<any>) => {
          const spinner = wrapper.findComponent({ name: 'UniversalSpinner' })
          expect(spinner.exists()).toBe(true)
        }
      },
      {
        name: '應該在非載入狀態時隱藏載入指示器',
        props: { loading: false },
        test: (wrapper: VueWrapper<any>) => {
          const spinner = wrapper.findComponent({ name: 'UniversalSpinner' })
          expect(spinner.exists()).toBe(false)
        }
      },
      {
        name: '應該渲染 SVG 或 Canvas 元素',
        test: (wrapper: VueWrapper<any>) => {
          const hasSvg = wrapper.find('svg').exists()
          const hasCanvas = wrapper.find('canvas').exists()
          expect(hasSvg || hasCanvas).toBe(true)
        }
      }
    ]
  }
}

/**
 * 表格組件測試配置工廠
 */
export class DataTableComponentTestFactory {
  static createMountOptions(customProps = {}, customStubs = {}) {
    return {
      props: {
        data: [],
        loading: false,
        columns: [],
        pagination: { page: 1, pageSize: 20, total: 0 },
        ...customProps
      },
      global: {
        stubs: {
          ...createCommonStubs(),
          DataTablePagination: true,
          DataTableViewOptions: true,
          DataTableToolbar: true,
          DataTableHeader: true,
          DataTableBody: true,
          DataTableRow: true,
          DataTableCell: true,
          ...customStubs
        },
        mocks: {
          $router: createRouterMock(),
        }
      }
    }
  }

  static createMockTableData() {
    return [
      { id: '1', name: '測試項目 1', status: 'active' },
      { id: '2', name: '測試項目 2', status: 'inactive' },
      { id: '3', name: '測試項目 3', status: 'pending' }
    ]
  }

  static createMockColumns() {
    return [
      { key: 'id', title: 'ID' },
      { key: 'name', title: '名稱' },
      { key: 'status', title: '狀態' },
      { key: 'actions', title: '操作' }
    ]
  }

  /**
   * 標準表格組件測試案例
   */
  static getStandardTestCases() {
    return [
      {
        name: '應該能夠成功掛載組件',
        test: (wrapper: VueWrapper<any>) => {
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm).toBeTruthy()
        }
      },
      {
        name: '應該渲染表格元素',
        test: (wrapper: VueWrapper<any>) => {
          const table = wrapper.find('table')
          expect(table.exists()).toBe(true)
        }
      },
      {
        name: '應該顯示空資料狀態',
        props: { data: [] },
        test: (wrapper: VueWrapper<any>) => {
          // 檢查是否有空資料提示
          const emptyText = wrapper.text()
          expect(emptyText.includes('無資料') || emptyText.includes('No data')).toBe(true)
        }
      },
      {
        name: '應該接受資料並渲染',
        props: { data: DataTableComponentTestFactory.createMockTableData() },
        test: (wrapper: VueWrapper<any>) => {
          expect(wrapper.props('data')).toHaveLength(3)
        }
      }
    ]
  }
}

/**
 * 表單組件測試配置工廠
 */
export class FormComponentTestFactory {
  static createMountOptions(customProps = {}, customStubs = {}) {
    return {
      props: {
        loading: false,
        disabled: false,
        ...customProps
      },
      global: {
        stubs: {
          ...createCommonStubs(),
          FormField: true,
          FormLabel: true,
          FormControl: true,
          FormMessage: true,
          FormItem: true,
          ...customStubs
        },
        mocks: {
          $router: createRouterMock(),
        }
      }
    }
  }

  /**
   * 標準表單組件測試案例
   */
  static getStandardTestCases() {
    return [
      {
        name: '應該能夠成功掛載組件',
        test: (wrapper: VueWrapper<any>) => {
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm).toBeTruthy()
        }
      },
      {
        name: '應該渲染表單元素',
        test: (wrapper: VueWrapper<any>) => {
          const form = wrapper.find('form')
          expect(form.exists()).toBe(true)
        }
      },
      {
        name: '應該在停用狀態時禁用輸入',
        props: { disabled: true },
        test: (wrapper: VueWrapper<any>) => {
          const inputs = wrapper.findAll('input, select, textarea')
          inputs.forEach(input => {
            expect(input.attributes('disabled')).toBeDefined()
          })
        }
      }
    ]
  }
}

/**
 * Notification 組件測試配置工廠
 * 專門處理通知系統相關組件的複雜 Mock 需求
 */
export class NotificationComponentTestFactory {
  /**
   * 建立 Notification 相關組件的標準 Mock 配置
   */
  static createMountOptions(customProps = {}, customStubs = {}) {
    return {
      props: {
        loading: false,
        notifications: [],
        suggestions: [],
        ...customProps
      },
      global: {
        stubs: {
          ...createCommonStubs(),
          // Notification 專用組件
          NotificationCard: true,
          SuggestionCard: true,
          GroupNotificationCard: true,
          NotificationBadge: true,
          ...customStubs
        },
        mocks: {
          $router: createRouterMock(),
        },
        provide: {
          // Toast provider mock
          toast: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn(),
            info: vi.fn(),
          },
        }
      }
    }
  }

  /**
   * 標準化的 Notification 子組件 Mock
   */
  static createNotificationChildMocks() {
    return {
      '../NotificationCard.vue': {
        default: {
          name: 'NotificationCard',
          props: ['notification', 'loading'],
          emits: [
            'click', 'mark-as-read', 'mark-as-unread', 'mark-as-completed',
            'mark-as-dismissed', 'accept-suggestion', 'dismiss-suggestion',
            'archive', 'delete'
          ],
          template: '<div data-testid="notification-card" @click="$emit(\'click\', notification)">{{ notification?.title || \'Mock Notification\' }}</div>'
        }
      },
      '../SuggestionCard.vue': {
        default: {
          name: 'SuggestionCard',
          props: ['suggestions', 'loading'],
          emits: [
            'accept-suggestion', 'dismiss-suggestion', 'accept-all-suggestions',
            'dismiss-all-suggestions', 'view-notification'
          ],
          template: '<div data-testid="suggestion-card">Mock Suggestions</div>'
        }
      },
      '../GroupNotificationCard.vue': {
        default: {
          name: 'GroupNotificationCard',
          props: ['distribution', 'stats', 'recipients', 'loading'],
          emits: ['retry-failed', 'view-details', 'export-recipients', 'delete'],
          template: '<div data-testid="group-notification-card">Mock Group Notification</div>'
        }
      }
    }
  }

  /**
   * Mock 通知配置相關工具
   */
  static createNotifyConfigMock() {
    return vi.mock('@/components/notify/notifyConfig', () => ({
      getNotificationIcon: vi.fn().mockReturnValue('Bell'),
      getPriorityIconClass: vi.fn().mockReturnValue('text-blue-500'),
      getPriorityBadgeClass: vi.fn().mockReturnValue('bg-blue-500 text-white'),
      priorityText: { urgent: '緊急', high: '高', medium: '中', low: '低' },
      categoryClasses: { actionable: 'bg-blue-100 text-blue-800' },
      categoryText: { actionable: '可操作' },
      completionStrategyClasses: { 
        suggested: 'bg-amber-100 text-amber-800',
        automatic: 'bg-green-100 text-green-800',
        manual: 'bg-gray-100 text-gray-800'
      },
      completionStrategyText: {
        suggested: '智能建議',
        automatic: '自動處理',
        manual: '手動處理'
      },
    }))
  }

  /**
   * 建立測試用的 Mock Notification 資料
   */
  static createMockNotification(overrides = {}) {
    return {
      id: 'test-notification-1',
      userId: 'test-user-1',
      type: 'order_new',
      title: 'Mock 新訂單通知',
      message: 'Mock 訊息內容',
      priority: 'medium',
      status: 'unread',
      category: 'actionable',
      completionStrategy: 'suggested',
      suggestedComplete: false,
      isPersonal: true,
      notificationSource: 'personal',
      createdAt: '2024-01-01T00:00:00Z',
      ...overrides
    }
  }

  /**
   * 建立多個測試通知資料
   */
  static createMockNotifications(count = 3) {
    return Array.from({ length: count }, (_, index) => 
      this.createMockNotification({
        id: `test-notification-${index + 1}`,
        title: `Mock 通知 ${index + 1}`,
        status: index === 0 ? 'unread' : 'read'
      })
    )
  }

  /**
   * 建立特定業務場景的通知資料
   */
  static createBusinessScenarioNotifications() {
    return {
      orderNotification: this.createMockNotification({
        type: 'order_new',
        title: '新訂單通知',
        message: '收到新訂單 #ORD-001',
        priority: 'high',
        category: 'actionable'
      }),
      
      productNotification: this.createMockNotification({
        type: 'product_deactivated',
        title: '產品停用通知',
        message: '產品已停用需要處理',
        priority: 'medium',
        category: 'actionable'
      }),
      
      customerNotification: this.createMockNotification({
        type: 'customer_new_registration',
        title: '新客戶註冊',
        message: '有新客戶完成註冊',
        priority: 'low',
        completionStrategy: 'automatic'
      }),
      
      inventoryNotification: this.createMockNotification({
        type: 'inventory_low_stock',
        title: '庫存不足警告',
        message: '產品庫存量過低',
        priority: 'urgent',
        category: 'actionable'
      })
    }
  }

  /**
   * 建立完整的 UI 組件 Mock 環境
   * 用於替代手動定義的 Button、Dialog 系列組件
   */
  static createCompleteNotificationUIMocks() {
    return {
      ...createCompleteUIMocks(),
      
      // Notification 專用的複雜組件
      '@/components/notify/notifyConfig': {
        getNotificationIcon: vi.fn().mockReturnValue('Bell'),
        getPriorityIconClass: vi.fn().mockReturnValue('text-blue-500'),
        getPriorityBadgeClass: vi.fn().mockReturnValue('bg-blue-500 text-white'),
        priorityText: { urgent: '緊急', high: '高', medium: '中', low: '低' },
        categoryClasses: { actionable: 'bg-blue-100 text-blue-800' },
        categoryText: { actionable: '可操作' },
        completionStrategyClasses: { 
          suggested: 'bg-amber-100 text-amber-800',
          automatic: 'bg-green-100 text-green-800',
          manual: 'bg-gray-100 text-gray-800'
        },
        completionStrategyText: {
          suggested: '智能建議',
          automatic: '自動處理',
          manual: '手動處理'
        }
      },
      
      // 時間格式化工具 Mock
      '@/utils': {
        formatRelativeTime: vi.fn().mockReturnValue('5 分鐘前'),
        formatDateTime: vi.fn().mockReturnValue('2024-01-01 12:00:00'),
        formatDate: vi.fn().mockReturnValue('2024-01-01')
      }
    }
  }

  /**
   * 標準 Notification 組件測試案例
   */
  static getStandardTestCases() {
    return [
      {
        name: '應該能夠成功掛載組件',
        test: (wrapper: VueWrapper<any>) => {
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm).toBeTruthy()
        }
      },
      {
        name: '應該在載入時顯示載入狀態',
        props: { loading: true },
        test: (wrapper: VueWrapper<any>) => {
          const skeleton = wrapper.find('[data-testid="loading-skeleton"]')
          expect(skeleton.exists() || wrapper.text().includes('載入')).toBe(true)
        }
      },
      {
        name: '應該顯示空狀態當沒有通知時',
        props: { notifications: [] },
        test: (wrapper: VueWrapper<any>) => {
          const text = wrapper.text()
          expect(text.includes('無通知') || text.includes('暫無') || text.includes('No notification')).toBe(true)
        }
      },
      {
        name: '應該渲染通知卡片',
        props: { notifications: NotificationComponentTestFactory.createMockNotifications(2) },
        test: (wrapper: VueWrapper<any>) => {
          const cards = wrapper.findAll('[data-testid="notification-card"]')
          expect(cards.length).toBeGreaterThan(0)
        }
      }
    ]
  }
}

/**
 * 通用 View 組件測試配置工廠
 */
export class ViewComponentTestFactory {
  static createMountOptions(customProps = {}, customStubs = {}) {
    return {
      props: {
        ...customProps
      },
      global: {
        stubs: {
          ...createCommonStubs(),
          RouterView: true,
          RouterLink: true,
          Breadcrumb: true,
          PageHeader: true,
          PageContent: true,
          PageFooter: true,
          ...customStubs
        },
        mocks: {
          $router: createRouterMock(),
        }
      }
    }
  }

  /**
   * 標準 View 組件測試案例
   */
  static getStandardTestCases() {
    return [
      {
        name: '應該能夠成功掛載組件',
        test: (wrapper: VueWrapper<any>) => {
          expect(wrapper.exists()).toBe(true)
          expect(wrapper.vm).toBeTruthy()
        }
      },
      {
        name: '應該渲染主要內容區域',
        test: (wrapper: VueWrapper<any>) => {
          const main = wrapper.find('main, .main-content, [role="main"]')
          expect(main.exists()).toBe(true)
        }
      }
    ]
  }
}

// ============================================================================
// 組合工廠管理器
// ============================================================================

/**
 * 組件測試工廠管理器
 * 提供統一的組件測試配置入口
 */
export class ComponentTestFactoryManager {
  static getFactory(componentType: 'chart' | 'table' | 'form' | 'view' | 'notification') {
    switch (componentType) {
      case 'chart':
        return ChartComponentTestFactory
      case 'table':
        return DataTableComponentTestFactory
      case 'form':
        return FormComponentTestFactory
      case 'view':
        return ViewComponentTestFactory
      case 'notification':
        return NotificationComponentTestFactory
      default:
        throw new Error(`不支援的組件類型: ${componentType}`)
    }
  }

  /**
   * 快速創建組件測試模板
   */
  static createTestTemplate(
    componentType: 'chart' | 'table' | 'form' | 'view' | 'notification',
    componentName: string,
    customOptions = {}
  ) {
    const factory = this.getFactory(componentType)
    const standardTestCases = factory.getStandardTestCases()
    
    return {
      factoryClass: factory,
      standardTestCases,
      mountOptions: factory.createMountOptions(customOptions),
      componentName
    }
  }
}

// ============================================================================
// Mock 應用輔助工具
// ============================================================================

/**
 * 批量應用 UI Mock
 * 簡化複雜組件的 Mock 設定過程
 */
export const applyUIMocks = () => {
  // 返回標準化的 UI Mock 配置
  // 避免批量註冊的作用域問題，改用配置返回方式
  return createCompleteUIMocks()
}

/**
 * 應用標準 Vue Router Mock
 */
export const applyRouterMock = () => {
  return createVueRouterMock()
}

/**
 * 應用通用工具函數 Mock
 */
export const applyUtilsMock = () => {
  return vi.mock('@/utils', () => ({
    formatRelativeTime: vi.fn().mockReturnValue('5 分鐘前'),
    formatDate: vi.fn().mockReturnValue('2024-01-01'),
    formatDateOnly: vi.fn().mockImplementation((date: Date | string) => {
      if (!date) return ''
      const d = typeof date === 'string' ? new Date(date) : date
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : ''
    }),
    formatCurrency: vi.fn().mockReturnValue('NT$ 1,000'),
    debounce: vi.fn().mockImplementation((fn) => fn),
    throttle: vi.fn().mockImplementation((fn) => fn),
    cn: vi.fn().mockImplementation((...args) => args.filter(Boolean).join(' ')), // CSS class name utility
  }))
}

/**
 * 一鍵應用 Notification 組件所需的所有 Mock
 */
export const applyNotificationMocks = () => {
  // 應用 UI Mock
  applyUIMocks()
  
  // 應用 Router Mock
  applyRouterMock()
  
  // 應用工具函數 Mock
  applyUtilsMock()
  
  // 應用 Notification 專用 Mock
  NotificationComponentTestFactory.createNotifyConfigMock()
  
  // 子組件 Mock 採用個別導入方式避免作用域問題
  // 使用 createSimpleTestEnvironment 已經包含常用子組件 Mock
  // 如需特定子組件 Mock，請使用 wrapper 的 stubs 選項
}

// ============================================================================
// 輔助工具
// ============================================================================

/**
 * 組件測試輔助工具
 */
export const componentTestUtils = {
  /**
   * 檢查組件是否正確接收 props
   */
  expectPropsReceived: (wrapper: VueWrapper<any>, expectedProps: Record<string, any>) => {
    Object.entries(expectedProps).forEach(([key, value]) => {
      expect(wrapper.props(key)).toEqual(value)
    })
  },

  /**
   * 檢查組件是否正確渲染內容
   */
  expectContentRendered: (wrapper: VueWrapper<any>, expectedContent: string | string[]) => {
    const text = wrapper.text()
    if (Array.isArray(expectedContent)) {
      expectedContent.forEach(content => {
        expect(text).toContain(content)
      })
    } else {
      expect(text).toContain(expectedContent)
    }
  },

  /**
   * 檢查測試環境是否正確設置
   */
  expectMockEnvironment: (wrapper: VueWrapper<any>) => {
    // 基本組件掛載檢查
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm).toBeTruthy()
    
    // Vue Router Mock 檢查
    if (wrapper.vm.$router) {
      expect(typeof wrapper.vm.$router.push).toBe('function')
    }
  },

  /**
   * 檢查 Notification 組件特定功能
   */
  expectNotificationFeatures: (wrapper: VueWrapper<any>) => {
    // 檢查是否有通知相關的測試標識
    const hasNotificationElements = wrapper.find('[data-testid*="notification"]').exists() ||
                                   wrapper.find('[data-testid*="suggestion"]').exists() ||
                                   wrapper.text().includes('通知') ||
                                   wrapper.text().includes('Notification')
    
    expect(hasNotificationElements).toBe(true)
  },

  /**
   * 檢查組件是否發射正確的事件
   */
  expectEventEmitted: (wrapper: VueWrapper<any>, eventName: string, times = 1) => {
    const emitted = wrapper.emitted(eventName)
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(times)
  },

  /**
   * 等待組件異步更新完成
   */
  waitForUpdate: async (wrapper: VueWrapper<any>) => {
    await wrapper.vm.$nextTick()
  },

  /**
   * 模擬用戶互動
   */
  simulateUserInteraction: {
    click: async (wrapper: VueWrapper<any>, selector: string) => {
      await wrapper.find(selector).trigger('click')
      await wrapper.vm.$nextTick()
    },
    input: async (wrapper: VueWrapper<any>, selector: string, value: string) => {
      const input = wrapper.find(selector)
      await input.setValue(value)
      await wrapper.vm.$nextTick()
    },
    submit: async (wrapper: VueWrapper<any>, selector = 'form') => {
      await wrapper.find(selector).trigger('submit')
      await wrapper.vm.$nextTick()
    },
    
    // Notification 特定的交互
    clickNotification: async (wrapper: VueWrapper<any>, index = 0) => {
      const notifications = wrapper.findAll('[data-testid="notification-card"]')
      if (notifications.length > index) {
        await notifications[index].trigger('click')
        await wrapper.vm.$nextTick()
      }
    },
    
    toggleTab: async (wrapper: VueWrapper<any>, tabValue: string) => {
      const tab = wrapper.find(`[value="${tabValue}"]`)
      if (tab.exists()) {
        await tab.trigger('click')
        await wrapper.vm.$nextTick()
      }
    }
  }
}

// ============================================================================
// 快捷方式和便利函數
// ============================================================================

/**
 * 快速創建 Notification 組件測試環境
 */
export const createNotificationTestEnvironment = (customProps = {}, customStubs = {}) => {
  // 自動應用所有必要的 Mock
  applyNotificationMocks()
  
  // 返回標準化的 mount options
  return NotificationComponentTestFactory.createMountOptions(customProps, customStubs)
}

/**
 * 快速創建簡化的組件測試環境
 * 適用於只需要基本 Mock 的簡單組件
 */
export const createSimpleTestEnvironment = (componentType: 'chart' | 'table' | 'form' | 'view' = 'view') => {
  // 只應用基本的 Router 和 Utils Mock
  applyRouterMock()
  applyUtilsMock()
  
  const factory = ComponentTestFactoryManager.getFactory(componentType)
  return factory.createMountOptions()
}

/**
 * 測試用的 Mock 資料生成器集合
 */
export const mockDataGenerators = {
  // 通知相關 Mock 資料生成器
  notification: NotificationComponentTestFactory.createMockNotification,
  notifications: NotificationComponentTestFactory.createMockNotifications,
  businessNotifications: NotificationComponentTestFactory.createBusinessScenarioNotifications,
  
  // 其他組件的 Mock 資料生成器
  chartData: ChartComponentTestFactory.createMockChartData,
  tableData: DataTableComponentTestFactory.createMockTableData,
  tableColumns: DataTableComponentTestFactory.createMockColumns,
}

export default ComponentTestFactoryManager