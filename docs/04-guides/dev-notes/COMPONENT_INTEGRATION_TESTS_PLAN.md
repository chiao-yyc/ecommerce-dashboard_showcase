# Component Integration Tests 計劃

## 目標

Component Integration Tests 專注於測試組件之間的互動、props/events 傳遞、以及與 composables 的整合。確保組件生態系統的正確協作。

## 測試範圍

### 核心測試組件
- **RoleUsersView**：使用者角色管理主頁面
- **DataTable 系列**：資料表格和相關組件
- **RoleSelector**：角色選擇器組件
- **ConfirmDialog**：確認對話框組件

### 測試層級
1. **View Level**：頁面組件與子組件的整合
2. **Component Level**：業務組件內部互動
3. **Composable Integration**：組件與 composables 的協作

## 測試結構

```
tests/integration/
├── setup/
│   ├── test-utils.ts          # 測試工具函數
│   ├── mock-data.ts           # 測試資料
│   └── component-helpers.ts   # 組件測試輔助
├── views/
│   └── RoleUsersView/
│       ├── basic-rendering.spec.ts
│       ├── role-assignment-dialog.spec.ts
│       ├── data-table-interaction.spec.ts
│       ├── filtering-sorting.spec.ts
│       └── permissions.spec.ts
└── components/
    ├── data-table/
    ├── role/
    └── common/
```

## 關鍵測試案例

### RoleUsersView Integration Tests

#### 1. 基本渲染測試
- 頁面結構正確顯示
- 所有子組件正確載入
- 初始狀態驗證

#### 2. 角色分配對話框測試
- 對話框開啟/關閉流程
- 角色預選狀態正確
- 角色變更 API 整合
- 錯誤處理機制

#### 3. 資料表格互動測試
- 分頁控制功能
- 排序和篩選整合
- 行選擇和批量操作
- 搜尋功能整合

#### 4. 權限控制測試
- 不同角色的介面差異
- 操作權限限制驗證
- 禁用狀態正確顯示

## 測試工具設定

### 核心工具
```typescript
// 組件測試包裝器
export function createTestWrapper(component, options = {}) {
  const pinia = createTestingPinia()
  const router = createTestRouter()
  
  return mount(component, {
    global: {
      plugins: [pinia, router],
      stubs: { /* 必要的 stubs */ }
    },
    ...options
  })
}

// 使用者互動模擬
export const userInteraction = {
  async click(wrapper, selector) { /* 實作 */ },
  async type(wrapper, selector, text) { /* 實作 */ },
  async select(wrapper, selector, value) { /* 實作 */ }
}
```

### 測試資料
```typescript
// 統一的測試資料
export const mockUsers = [/* 測試使用者資料 */]
export const mockRoles = [/* 測試角色資料 */]
export const mockApiResponse = {
  success: (data, totalPages, count) => ({ /* 格式 */ }),
  error: (message) => ({ /* 格式 */ })
}
```

## Mock 策略

### API Mocking
- Mock 所有外部 API 呼叫
- 使用真實的資料結構
- 模擬成功和失敗場景

### 組件 Stubbing
- 選擇性 stub 複雜的 UI 組件
- 保持核心業務邏輯組件的真實性
- 避免過度 stubbing 影響測試有效性

## 測試執行

### 指令
```bash
# 執行所有 integration tests
npm run test:integration

# 執行特定測試套件
npm run test:integration -- RoleUsersView

# 覆蓋率報告
npm run test:integration -- --coverage
```

### 效能要求
- 單一測試套件執行時間 < 10 秒
- 總測試執行時間 < 2 分鐘
- 記憶體使用量 < 512MB

## 覆蓋率目標

| 組件類型 | 覆蓋率目標 | 重點 |
|----------|------------|------|
| View Components | 85%+ | 頁面結構、路由整合 |
| Business Components | 90%+ | 業務邏輯、資料處理 |
| UI Components | 80%+ | 使用者互動、狀態變化 |
| Composable Integration | 95%+ | 組件與 composable 協作 |

## CI/CD 整合

### 品質門檻
- Integration Tests 通過率：100%
- 測試覆蓋率：85%+
- 測試執行時間：< 2 分鐘
- 無記憶體洩漏

### GitHub Actions
```yaml
integration-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run test:integration -- --coverage
    - uses: codecov/codecov-action@v3
```

## 最佳實踐

### 1. 測試隔離
- 每個測試案例獨立運行
- 使用 `beforeEach/afterEach` 清理狀態
- 避免測試間依賴

### 2. 可讀性
- 使用描述性的測試名稱
- 結構：Arrange → Act → Assert
- 適度註釋複雜邏輯

### 3. 維護性
- 共享測試工具和資料
- 避免重複測試邏輯
- 保持測試代碼簡潔

### 4. 真實性
- 盡量使用真實的組件互動
- 最小化 mocking 範圍
- 測試使用者實際操作流程

## 維護指南

### 定期檢查
- [ ] 測試覆蓋率達標
- [ ] 新功能測試完整
- [ ] 過時測試及時更新
- [ ] 測試執行效能正常

### 重構指標
- 測試執行時間過長（> 5分鐘）
- 測試失敗率過高（> 5%）
- 重複測試代碼過多（> 30%）
- 新功能覆蓋率不足（< 80%）

此計劃確保完整的組件整合測試覆蓋，為系統穩定性和可維護性提供保障。詳細測試實作請參考 `tests/integration/` 目錄。