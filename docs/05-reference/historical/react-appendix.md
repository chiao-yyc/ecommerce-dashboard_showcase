# React 技術差異附錄

> 🔖 **歷史參考文檔** - 本文檔為早期專案規劃時期的 React vs Vue 技術對比，僅供參考。當前專案使用 Vue 3 + TypeScript 技術棧。
>
> - **文檔性質**: 歷史參考
> - **最後更新**: 2025-10-07 (標記為歷史文檔)
> - **適用對象**: 對 React/Vue 技術選型感興趣的開發者

## 概述

本文檔說明使用 React 開發電商後台管理系統與 Vue 版本的技術差異、工具選擇和開發思路對比。

> **注意**: 本專案以 Vue 為主要開發框架，React 版本作為學習練習使用。

## 技術棧對比

### 核心框架對比

| 功能類別 | Vue 3 (主專案) | React 18 (練習專案) | 備註 |
|---------|---------------|-------------------|------|
| **核心框架** | Vue 3 + Composition API | React 18 + Hooks | 兩者都支援函數式組件 |
| **狀態管理** | Pinia | Zustand / Redux Toolkit | Pinia 更簡潔，Zustand 類似概念 |
| **路由管理** | Vue Router | React Router v6 | 聲明式路由 vs 組件化路由 |
| **HTTP 客戶端** | TanStack Query + Axios | TanStack Query + Fetch | Query 層相同，底層請求不同 |
| **CSS 框架** | Tailwind CSS + shadcn/ui | Tailwind CSS + Radix UI | 組件庫不同，設計系統相似 |
| **表單處理** | VeeValidate | React Hook Form | 都支援 schema 驗證 |
| **國際化** | Vue I18n | React i18next | 功能相似 |
| **測試框架** | Vitest + Playwright | Jest + Testing Library | 測試理念相同 |

### 建構工具對比

| 工具類型 | Vue 版本 | React 版本 | 說明 |
|---------|---------|-----------|------|
| **建構工具** | Vite | Vite / Create React App | 推薦使用 Vite |
| **TypeScript** | 原生支援 | 原生支援 | 配置略有不同 |
| **開發伺服器** | Vite Dev Server | Vite Dev Server | 熱重載機制相同 |

## 框架特性對比

### 1. 組件定義方式

#### Vue 3 Composition API
```vue
<template>
  <div class="customer-card">
    <h3>{{ customer.name }}</h3>
    <p>訂單數量: {{ orderCount }}</p>
    <button @click="handleEdit">編輯</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Customer } from '@/types/customer'

const props = defineProps<{
  customer: Customer
}>()

const emit = defineEmits<{
  edit: [customer: Customer]
}>()

const orderCount = computed(() => props.customer.orders?.length || 0)

const handleEdit = () => {
  emit('edit', props.customer)
}
</script>
```

#### React + TypeScript
```tsx
import React from 'react'
import type { Customer } from '@/types/customer'

interface CustomerCardProps {
  customer: Customer
  onEdit: (customer: Customer) => void
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit
}) => {
  const orderCount = customer.orders?.length || 0
  
  const handleEdit = () => {
    onEdit(customer)
  }
  
  return (
    <div className="customer-card">
      <h3>{customer.name}</h3>
      <p>訂單數量: {orderCount}</p>
      <button onClick={handleEdit}>編輯</button>
    </div>
  )
}
```

### 2. 狀態管理對比

#### Vue (Pinia)
```typescript
// stores/customer.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Customer } from '@/types/customer'

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  
  const activeCustomers = computed(() => 
    customers.value.filter(c => c.status === 'active')
  )
  
  const fetchCustomers = async () => {
    loading.value = true
    try {
      customers.value = await api.getCustomers()
    } finally {
      loading.value = false
    }
  }
  
  return {
    customers,
    loading,
    activeCustomers,
    fetchCustomers
  }
})
```

#### React (Zustand)
```typescript
// stores/customer.ts
import { create } from 'zustand'
import type { Customer } from '@/types/customer'

interface CustomerStore {
  customers: Customer[]
  loading: boolean
  activeCustomers: Customer[]
  fetchCustomers: () => Promise<void>
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  
  get activeCustomers() {
    return get().customers.filter(c => c.status === 'active')
  },
  
  fetchCustomers: async () => {
    set({ loading: true })
    try {
      const customers = await api.getCustomers()
      set({ customers })
    } finally {
      set({ loading: false })
    }
  }
}))
```

### 3. 生命週期對比

#### Vue Composition API
```typescript
import { onMounted, onUnmounted, watch } from 'vue'

export default {
  setup() {
    // 組件掛載
    onMounted(() => {
      console.log('Component mounted')
    })
    
    // 組件卸載
    onUnmounted(() => {
      console.log('Component unmounted')
    })
    
    // 響應式監聽
    watch(() => props.customerId, (newId) => {
      fetchCustomerData(newId)
    })
  }
}
```

#### React Hooks
```typescript
import { useEffect } from 'react'

export const CustomerComponent = ({ customerId }) => {
  // 組件掛載和更新
  useEffect(() => {
    console.log('Component mounted or updated')
    
    // 組件卸載清理
    return () => {
      console.log('Component will unmount')
    }
  }, [])
  
  // 監聽 props 變化
  useEffect(() => {
    fetchCustomerData(customerId)
  }, [customerId])
}
```

## 開發思路差異

### 1. 響應式系統
- **Vue**: 基於 Proxy 的自動響應式，`ref` 和 `reactive` 包裝數據
- **React**: 基於 `setState` 的手動更新，使用 `useState` 管理狀態

### 2. 組件通信
- **Vue**: Props 下傳，Emits 上傳，provide/inject 跨層級
- **React**: Props 下傳，回調函數上傳，Context 跨層級

### 3. 模板語法
- **Vue**: 聲明式模板，指令系統（`v-if`, `v-for`, `v-model`）
- **React**: JSX 語法，JavaScript 表達式直接嵌入

## 轉換策略

### 階段一：核心結構轉換
1. 組件結構對應
2. 狀態管理設置
3. 路由系統建立

### 階段二：業務邏輯轉換
1. API 服務層
2. 資料處理邏輯
3. 表單驗證

### 階段三：進階功能
1. 圖表系統
2. 即時通知
3. 許可權控制

## 學習重點

### React 特有概念
1. **JSX 語法**: HTML-in-JS 的寫法
2. **Hooks 規則**: 只能在函數頂層調用
3. **依賴陣列**: useEffect 的依賴管理
4. **Key 屬性**: 列表渲染的性能優化

### Vue 到 React 的心理轉換
1. **命令式 → 聲明式**: React 更注重「描述應該是什麼」
2. **模板 → JSX**: 從模板思維轉向 JavaScript 思維
3. **雙向綁定 → 單向資料流**: 明確的資料流方向

## 專案結構建議

### React 專案結構
```
admin-platform-react/
├── src/
│   ├── components/          # 業務組件
│   │   ├── ui/             # 基礎 UI 組件
│   │   ├── customer/       # 客戶相關組件
│   │   ├── order/          # 訂單相關組件
│   │   └── charts/         # 圖表組件
│   ├── hooks/              # 自定義 Hooks
│   ├── stores/             # Zustand 狀態管理
│   ├── services/           # API 服務
│   ├── pages/              # 頁面組件
│   ├── types/              # TypeScript 類型
│   └── utils/              # 工具函數
├── docs/                   # React 專用文檔
└── tests/                  # 測試文件
```

## 效能對比

| 面向 | Vue 3 | React 18 | 說明 |
|------|-------|----------|------|
| **初始包大小** | ~34KB | ~42KB | Vue 略小 |
| **執行時效能** | 優秀 | 優秀 | 差異不大 |
| **開發體驗** | 更簡潔 | 更靈活 | 取決於團隊偏好 |
| **學習曲線** | 較平緩 | 較陡峭 | Vue 更易入門 |

## 最佳實踐

### React 專案開發建議
1. **使用 TypeScript**: 提供更好的類型安全
2. **函數式組件**: 統一使用 Hooks 而非 Class Component
3. **狀態管理**: 小型專案用 useState，大型專案用 Zustand
4. **樣式方案**: 使用 Tailwind CSS 保持與 Vue 版本一致
5. **測試策略**: 單元測試 + 整合測試 + E2E 測試

### 開發流程建議
1. **先完成 Vue 版本**: 確保業務邏輯正確
2. **再轉換 React**: 重點關注框架差異
3. **對比學習**: 同功能不同實現的對比
4. **漸進式練習**: 從簡單組件開始轉換

## 總結

React 版本作為學習專案，重點在於：
1. 理解不同框架的設計理念
2. 掌握 React 生態系統的核心工具
3. 提升跨框架開發能力
4. 為未來技術選型提供實踐基礎

透過對比開發，可以更深入理解 Vue 和 React 各自的優勢，並在未來的專案中做出更明智的技術選擇。

---

*更新日期: $(date "+%Y-%m-%d")*
*文檔版本: 1.0*