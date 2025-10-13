# Vue Calendar 響應式 Key 機制開發筆記

## 概述

此文檔記錄 Vue Calendar 組件中 `calendarKey` 響應式機制的最佳實踐，基於 Holiday 編輯功能修復過程中發現的 btoa 雜湊碰撞問題所建立的標準化指引。

## 技術背景

### calendarKey 機制原理

`calendarKey` 是 Vue 3 中用於強制組件重新渲染的響應式鍵值模式：

```vue
<BaseCalendar :key="calendarKey" />
```

當 `key` 屬性改變時，Vue 會：
1. **銷毀舊組件實例**
2. **創建新的組件實例**
3. **重新執行所有生命週期**
4. **重新渲染整個組件樹**

這是一種**強制更新模式**，用於處理深層數據變更無法觸發響應式更新的場景。

### 適用場景

- ✅ **複雜的數據結構變更**：陣列內物件的深層屬性修改
- ✅ **外部數據源更新**：API 回應的數據結構變化
- ✅ **條件渲染重置**：需要完全重置組件狀態
- ❌ **簡單響應式數據**：Vue 已能自動追蹤的淺層變更

## 常見問題分析

### 問題案例：btoa 雜湊碰撞

#### **錯誤實現**：
```typescript
// ❌ 有問題的實現
const calendarKey = computed(() => {
  const holidayData = holidays.value.map(h =>
    `${h.id}-${h.name}-${h.date}`
  ).sort().join('|')

  // 問題：Base64 編碼 + 截取容易產生碰撞
  const contentHash = btoa(encodeURIComponent(holidayData)).substring(0, 20)
  return `${holidays.value.length}-${contentHash}`
})
```

#### **問題分析**：

1. **編碼限制**：
   ```javascript
   btoa('測試') // ❌ 錯誤: 中文字符超出 Latin-1 範圍
   btoa(encodeURIComponent('測試')) // ✅ 需要預處理
   ```

2. **截取導致碰撞**：
   ```javascript
   const data1 = "very-long-string-with-similar-content-abc"
   const data2 = "very-long-string-with-similar-content-def"

   const hash1 = btoa(encodeURIComponent(data1)).substring(0, 20)
   const hash2 = btoa(encodeURIComponent(data2)).substring(0, 20)
   // 可能產生相同的前20字符 → 雜湊碰撞
   ```

3. **實際案例**：
   ```
   編輯前：yuyu123 → Base64 → 截取 → MDY2MjI1ZDItYWQzOS00
   編輯後：yuyu456 → Base64 → 截取 → MDY2MjI1ZDItYWQzOS00 (相同！)

   結果：calendarKey 沒有變化 → 組件不重新渲染 → 編輯無法即時更新
   ```

### btoa 函式說明

#### **基本資訊**：
- **全名**：Binary to ASCII
- **功能**：將二進制數據編碼為 Base64 字符串
- **主要用途**：數據傳輸和存儲，而非雜湊計算

#### **使用範例**：
```javascript
btoa('Hello World')      // 'SGVsbG8gV29ybGQ='
btoa('測試中文')          // ❌ 會出錯！需要先處理
btoa(encodeURIComponent('測試中文')) // 'JUU2JUI4JUFGJUU4JUFSJTk4JUU0JUI4JUFEJUU2JTk2JTg3'
```

#### **不適用於雜湊的原因**：
1. **設計目的不同**：Base64 用於編碼，不是雜湊演算法
2. **碰撞風險高**：截取字符容易產生重複
3. **字符集限制**：需要額外處理 Unicode 字符
4. **性能非最佳**：編碼 + 截取的組合效率不高

## 🌟 最佳實踐方案

### 推薦實現：字串雜湊演算法

```typescript
// ✅ 推薦的實現
const calendarKey = computed(() => {
  // 1. 完整的欄位序列化
  const dataString = items.value.map(item =>
    `${item.id}|${item.name}|${item.date}|${item.type || 'default'}|${item.description || ''}|${item.updatedAt || item.createdAt}`
  ).sort().join('::')

  // 2. 可靠的字串雜湊演算法
  let hash = 0
  if (dataString.length > 0) {
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 轉換為 32bit 整數
    }
  }

  // 3. 組合最終的 key
  return `prefix-${items.value.length}-${Math.abs(hash)}`
})
```

### 設計原則

#### **1. 完整性**：
```typescript
// 包含所有影響顯示的欄位
const dataString = items.value.map(item => [
  item.id,                    // 唯一識別
  item.name,                  // 顯示名稱
  item.date,                  // 時間資訊
  item.type || 'default',     // 類型（含預設值）
  item.description || '',     // 描述（含預設值）
  item.updatedAt || item.createdAt  // 時間戳
].join('|')).sort().join('::')
```

#### **2. 一致性**：
```typescript
// 使用相同的分隔符和排序邏輯
.map(item => `${field1}|${field2}|${field3}`)  // 欄位分隔符：|
.sort()                                        // 固定順序
.join('::')                                    // 記錄分隔符：::
```

#### **3. 可靠性**：
```typescript
// 標準字串雜湊演算法（Java hashCode 風格）
let hash = 0
for (let i = 0; i < str.length; i++) {
  const char = str.charCodeAt(i)
  hash = ((hash << 5) - hash) + char  // hash * 31 + char
  hash = hash & hash                  // 確保 32bit 整數
}
return Math.abs(hash)                 // 避免負數
```

### 演算法比較

| 方法 | 速度 | 碰撞率 | Bundle影響 | Unicode支援 | 適用場景 |
|------|------|--------|------------|-------------|----------|
| **字串雜湊** | 🚀 極快 | 🟡 中等 | ✅ 零 | ✅ 完全 | ✅ **響應式Key** |
| **btoa截取** | 🚀 極快 | 🔴 高 | ✅ 零 | ❌ 需預處理 | ❌ 不推薦 |
| **Crypto API** | 🐌 慢 | 🟢 極低 | ✅ 零 | ✅ 完全 | 安全性要求 |
| **第三方庫** | 🚀 快 | 🟢 低 | ❌ 增加 | ✅ 完全 | 複雜應用 |

## 實現範例

### Holiday Calendar 實現

```typescript
// src/components/holiday/HolidayCalendar.vue
const calendarKey = computed(() => {
  const holidayData = holidays.value.map(h =>
    `${h.id}|${h.name}|${h.date}|${h.holidayType || 'national'}|${h.priority || 1}|${h.description || ''}|${h.updatedAt || h.createdAt}`
  ).sort().join('::')

  let hash = 0
  if (holidayData.length > 0) {
    for (let i = 0; i < holidayData.length; i++) {
      const char = holidayData.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
  }

  return `holidays-${holidays.value.length}-${Math.abs(hash)}`
})
```

### Campaign Calendar 實現

```typescript
// src/components/campaign/CampaignCalendar.vue
const calendarKey = computed(() => {
  const campaignData = campaigns.value.map(c =>
    `${c.id}|${c.campaignName}|${c.startDate}|${c.endDate}|${c.campaignType || 'general'}|${c.description || ''}|${c.updatedAt || c.createdAt}`
  ).sort().join('::')

  let hash = 0
  if (campaignData.length > 0) {
    for (let i = 0; i < campaignData.length; i++) {
      const char = campaignData.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
  }

  return `campaigns-${campaigns.value.length}-${Math.abs(hash)}`
})
```

### 可重用工具函數

```typescript
// src/utils/calendar-key.ts
export function createCalendarKey(
  prefix: string,
  items: any[],
  fieldsMapper: (item: any) => string[]
): string {
  const dataString = items
    .map(item => fieldsMapper(item).join('|'))
    .sort()
    .join('::')

  let hash = 0
  if (dataString.length > 0) {
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
  }

  return `${prefix}-${items.length}-${Math.abs(hash)}`
}

// 使用範例
const calendarKey = computed(() =>
  createCalendarKey('holidays', holidays.value, (h) => [
    h.id,
    h.name,
    h.date,
    h.holidayType || 'national',
    String(h.priority || 1),
    h.description || '',
    h.updatedAt || h.createdAt
  ])
)
```

## 團隊指引

### 開發檢查清單

#### **新增 Calendar 組件時**：
- [ ] 使用標準字串雜湊演算法
- [ ] 包含所有影響顯示的欄位
- [ ] 使用一致的分隔符（`|` 和 `::`）
- [ ] 加入時間戳欄位（`updatedAt` 或 `createdAt`）
- [ ] 為可選欄位提供預設值

#### **Code Review 重點**：
- [ ] 避免使用 `btoa` + `substring` 組合
- [ ] 確認雜湊演算法的一致性
- [ ] 檢查欄位完整性
- [ ] 驗證 Unicode 字符支援

### 效能考量

#### **最佳化建議**：
1. **欄位精選**：只包含真正影響顯示的欄位
2. **快取機制**：對大量數據考慮使用 `shallowRef`
3. **條件計算**：在數據為空時跳過雜湊計算

```typescript
// 效能最佳化範例
const calendarKey = computed(() => {
  if (items.value.length === 0) {
    return `${prefix}-0-0`
  }

  // 只有在數據存在時才進行雜湊計算
  // ... 雜湊邏輯
})
```

### 偵錯技巧

#### **碰撞檢測**（開發模式）：
```typescript
// 開發環境下的碰撞檢測
const calendarKey = computed(() => {
  // ... 計算 key

  if (import.meta.env.DEV) {
    // 記錄 key 變化以檢測碰撞
    console.log(`Calendar Key: ${key}`, {
      itemCount: items.value.length,
      hash: Math.abs(hash),
      sample: dataString.substring(0, 100)
    })
  }

  return key
})
```

#### **常見問題診斷**：
1. **編輯後不更新**：檢查 key 是否真的有變化
2. **頻繁重新渲染**：確認欄位是否包含不必要的動態值
3. **Unicode 問題**：避免使用 `btoa` 處理中文字符

### 維護標準

#### **命名慣例**：
```typescript
// 統一的前綴命名
const calendarKey = computed(() => `${moduleName}-${count}-${hash}`)

// 範例
`holidays-39-1203424859`     // Holiday 模組
`campaigns-12-874526312`     // Campaign 模組
`events-5-234567890`         // Event 模組
```

#### **更新流程**：
1. **修改演算法前**：確認所有相關組件
2. **測試覆蓋**：驗證編輯、新增、刪除功能
3. **文檔更新**：同步更新此開發筆記

---

## 相關文檔

- [Vue 3 Key Attribute 官方文檔](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)
- [JavaScript String Hash 演算法](https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/)
- [Base64 編碼原理說明](https://developer.mozilla.org/en-US/docs/Web/API/btoa)

---

**最後更新**：2025-09-22
**更新原因**：Holiday 編輯功能修復，統一 Calendar 組件 calendarKey 實現標準