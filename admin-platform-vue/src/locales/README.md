# Locales (國際化系統)

此目錄包含完整的多語言支援系統，使用 Vue i18n 實現。

## 📁 目錄結構

```
locales/
├── zh-TW.json          # 繁體中文翻譯 (主要語言)
└── en.json             # 英文翻譯
```

## 🎯 核心特性

### 多語言支援
- **繁體中文 (zh-TW)**: 完整的業務術語翻譯
- **英文 (en)**: 完整的英文對照翻譯

### 翻譯結構
```json
{
  "common": {
    "actions": { "save": "儲存", "cancel": "取消" },
    "messages": { "success": "操作成功", "error": "操作失敗" }
  },
  "pages": {
    "dashboard": { "title": "儀表板總覽" },
    "orders": { "title": "訂單管理" }
  },
  "components": {
    "dataTable": { "noResults": "沒有資料" }
  }
}
```

## 🔧 使用方式

### 在組件中使用
```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
</script>

<template>
  <h1>{{ t('pages.dashboard.title') }}</h1>
  <button @click="locale = 'en'">Switch to English</button>
</template>
```

### 動態翻譯
```typescript
// 帶參數的翻譯
t('messages.welcome', { name: 'User' })
// 輸出: "歡迎 User"

// 複數形式
t('items.count', { count: 5 })
// 輸出: "5 個項目"
```

## 📊 翻譯範圍

| 模組 | 翻譯鍵數量 | 覆蓋範圍 |
|------|-----------|---------|
| common | 100+ | 通用操作、訊息、狀態 |
| pages | 150+ | 所有頁面標題、描述 |
| components | 200+ | 組件專用文字 |
| validation | 50+ | 表單驗證訊息 |
| errors | 30+ | 錯誤訊息 |

## 🌐 語言切換機制

### 自動偵測
系統會根據瀏覽器語言自動選擇語言：
```typescript
const browserLocale = navigator.language.toLowerCase()
if (browserLocale.startsWith('zh')) {
  locale.value = 'zh-TW'
} else {
  locale.value = 'en'
}
```

### 持久化
語言偏好會儲存在 localStorage：
```typescript
localStorage.setItem('user-locale', locale.value)
```

## 🎨 翻譯最佳實踐

1. **語義化鍵名**: 使用清晰的層級結構
2. **上下文明確**: 避免模糊的翻譯鍵
3. **一致性**: 相同概念使用相同術語
4. **完整性**: 確保所有語言的翻譯鍵同步

## 🔍 Demo 展示重點

- ✅ 完整的多語言架構設計
- ✅ Vue i18n 最佳實踐應用
- ✅ 結構化翻譯管理
- ✅ 語言切換與持久化機制
