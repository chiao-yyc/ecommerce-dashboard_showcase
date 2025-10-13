# 通知系統規則定義

## 規則制定原則

### 設計理念

1. **業務導向**：所有通知都應服務於實際業務需求
2. **職責明確**：每種通知都有明確的接收者和處理責任
3. **智能化**：系統能自動判斷和建議，減少人工干預
4. **可配置**：規則可以透過配置調整，無需修改代碼

### 分類原則

- **INFORMATIONAL（資訊型）**：需要知悉但不需要特定行動的通知
- **ACTIONABLE（任務型）**：需要具體行動和完成確認的通知

## 現有通知類型詳細規則

### 1. ORDER_NEW - 新訂單通知

#### 基本資訊

```yaml
類型: ORDER_NEW
分類: ACTIONABLE
完成策略: SUGGESTED
優先級: HIGH
觸發頻率: 每筆訂單一次
```

#### 觸發條件

- **主要條件**：新訂單創建完成
- **金額範圍**：≤ $10,000（高價值訂單有獨立通知）
- **訂單狀態**：pending 或 confirmed

#### 接收者規則

```yaml
主要接收者:
  - 類型: ROLE
  - 角色: sales
  - 部門: 銷售部

次要接收者:
  - 類型: ROLE
  - 角色: order_manager
  - 條件: 訂單數量 > 每日平均 * 1.5 時
```

#### 通知內容模板

```yaml
標題: '新訂單待處理 #{order_number}'
內容: '客戶 {customer_name} 下了新訂單，金額 ${total_amount}，包含 {item_count} 件商品'
動作連結: '/admin/orders/{order_id}'
```

#### 完成條件

- **建議完成**：訂單狀態變更為 `shipped` 或 `completed`
- **手動完成**：銷售人員確認訂單已處理
- **自動歸檔**：7天後自動歸檔

#### 業務規則

1. **處理時效**：4小時內需要有人認領處理
2. **優先級調整**：VIP客戶訂單自動提升為 URGENT
3. **庫存檢查**：如商品庫存不足，同時發送庫存警告

### 2. ORDER_HIGH_VALUE - 高價值訂單警示

#### 基本資訊

```yaml
類型: ORDER_HIGH_VALUE
分類: ACTIONABLE
完成策略: MANUAL
優先級: URGENT
觸發頻率: 每筆高價值訂單一次
```

#### 觸發條件

- **主要條件**：訂單金額 > $10,000
- **次要條件**：單一商品數量 > 100 件
- **VIP條件**：VIP客戶訂單 > $5,000

#### 接收者規則

```yaml
主要接收者:
  - 類型: ROLE
  - 角色: sales_manager
  - 部門: 銷售部

次要接收者:
  - 類型: ROLE
  - 角色: finance_manager
  - 條件: 訂單金額 > $50,000

通知者:
  - 類型: ROLE
  - 角色: ceo
  - 條件: 訂單金額 > $100,000
```

#### 通知內容模板

```yaml
標題: '⚠️ 高價值訂單警示 #{order_number}'
內容: '收到高價值訂單，客戶：{customer_name}，金額：${total_amount}，需要主管關注'
動作連結: '/admin/orders/{order_id}/vip'
```

#### 完成條件

- **手動完成**：銷售經理確認已給予特殊服務
- **必要確認**：客戶滿意度確認
- **不可自動完成**：需要人工確認所有VIP服務流程

#### 業務規則

1. **處理時效**：1小時內需要銷售經理回應
2. **特殊服務**：需要提供VIP客戶服務
3. **風險檢查**：需要進行付款風險評估
4. **庫存保留**：優先保留庫存給高價值訂單

### 3. INVENTORY_LOW_STOCK - 低庫存警告

#### 基本資訊

```yaml
類型: INVENTORY_LOW_STOCK
分類: ACTIONABLE
完成策略: SUGGESTED
優先級: HIGH
觸發頻率: 每個商品一次（直到補貨）
```

#### 觸發條件

- **主要條件**：庫存數量 ≤ 低庫存閾值
- **防重複**：24小時內同一商品不重複發送
- **例外**：熱銷商品閾值動態調整

#### 接收者規則

```yaml
主要接收者:
  - 類型: ROLE
  - 角色: warehouse_manager
  - 部門: 倉庫部

次要接收者:
  - 類型: ROLE
  - 角色: purchasing
  - 部門: 採購部

緊急接收者:
  - 類型: ROLE
  - 角色: operations_manager
  - 條件: 熱銷商品 AND 庫存 < 3天銷量
```

#### 通知內容模板

```yaml
標題: '📦 低庫存警告 - {product_name}'
內容: '商品「{product_name}」庫存不足，目前庫存：{current_stock}，安全庫存：{safety_stock}'
動作連結: '/admin/inventory/{product_id}'
```

#### 完成條件

- **建議完成**：庫存補充至安全庫存以上
- **手動完成**：確認已安排補貨
- **自動完成**：庫存 > 低庫存閾值 \* 1.5

#### 業務規則

1. **補貨時效**：48小時內需要安排補貨
2. **優先級**：根據銷售速度動態調整優先級
3. **預警機制**：預測式庫存警告（基於銷售趨勢）
4. **供應商通知**：自動發送補貨需求給供應商

### 4. INVENTORY_OUT_OF_STOCK - 缺貨通知

#### 基本資訊

```yaml
類型: INVENTORY_OUT_OF_STOCK
分類: ACTIONABLE
完成策略: AUTO
優先級: URGENT
觸發頻率: 即時
```

#### 觸發條件

- **主要條件**：庫存數量 = 0
- **即時性**：庫存變更即時觸發
- **影響範圍**：自動暫停商品銷售

#### 接收者規則

```yaml
主要接收者:
  - 類型: ROLE
  - 角色: warehouse_manager
  - 部門: 倉庫部

緊急接收者:
  - 類型: ROLE
  - 角色: purchasing
  - 部門: 採購部

通知者:
  - 類型: ROLE
  - 角色: operations_manager
  - 條件: 熱銷商品 OR 獨家商品
```

#### 通知內容模板

```yaml
標題: '🚨 商品缺貨 - {product_name}'
內容: '商品「{product_name}」已完全缺貨，已自動暫停銷售，請立即安排緊急補貨'
動作連結: '/admin/inventory/{product_id}/emergency'
```

#### 完成條件

- **自動完成**：庫存 > 0 時自動完成
- **系統動作**：自動恢復商品銷售
- **不可手動完成**：確保庫存真實恢復

#### 業務規則

1. **即時處理**：立即暫停商品銷售
2. **緊急補貨**：啟動緊急補貨流程
3. **客戶通知**：自動通知已下單但未出貨的客戶
4. **替代商品**：推薦替代商品給銷售團隊

### 5. CUSTOMER_SERVICE_NEW_REQUEST - 新客服請求

#### 基本資訊

```yaml
類型: CUSTOMER_SERVICE_NEW_REQUEST
分類: ACTIONABLE
完成策略: SUGGESTED
優先級: MEDIUM (可動態調整)
觸發頻率: 每個客服請求一次
```

#### 觸發條件

- **主要條件**：客戶提交新的服務請求
- **優先級判斷**：根據客戶等級和問題類型調整
- **分配邏輯**：根據客服負載均衡分配

#### 接收者規則

```yaml
主要接收者:
  - 類型: ROLE
  - 角色: customer_service
  - 部門: 客服部
  - 分配策略: 輪詢分配

次要接收者:
  - 類型: ROLE
  - 角色: customer_service_manager
  - 條件: 15分鐘內無人認領

升級接收者:
  - 類型: ROLE
  - 角色: customer_service_supervisor
  - 條件: 1小時內無人回應
```

#### 通知內容模板

```yaml
標題: '💬 新客服請求 - {customer_name}'
內容: '收到來自 {customer_name} 的客服請求，問題類型：{issue_type}，緊急程度：{priority}'
動作連結: '/admin/support/tickets/{ticket_id}'
```

#### 完成條件

- **建議完成**：客服請求狀態變更為 `resolved` 或 `closed`
- **手動完成**：客服人員確認問題已解決
- **客戶確認**：客戶滿意度確認後自動完成

#### 業務規則

1. **回應時效**：15分鐘內需要首次回應
2. **問題分類**：自動分類並分配給專業客服
3. **升級機制**：超時自動升級給上級主管
4. **滿意度追蹤**：解決後自動發送滿意度調查

### 6. CUSTOMER_VIP_ISSUE - VIP客戶問題

#### 基本資訊

```yaml
類型: CUSTOMER_VIP_ISSUE
分類: ACTIONABLE
完成策略: MANUAL
優先級: URGENT
觸發頻率: 每個VIP問題一次
```

#### 觸發條件

- **主要條件**：VIP客戶提交問題
- **VIP等級**：白金級以上客戶
- **問題嚴重度**：自動提升為緊急等級

#### 接收者規則

```yaml
主要接收者:
  - 類型: ROLE
  - 角色: vip_customer_service
  - 部門: VIP客服部

通知者:
  - 類型: ROLE
  - 角色: customer_service_manager
  - 部門: 客服部

升級接收者:
  - 類型: ROLE
  - 角色: customer_relations_director
  - 條件: 30分鐘內無人認領
```

#### 通知內容模板

```yaml
標題: '👑 VIP客戶問題 - {customer_name}'
內容: 'VIP客戶 {customer_name} ({vip_level}) 提交問題，需要立即關注和處理'
動作連結: '/admin/support/vip/{ticket_id}'
```

#### 完成條件

- **手動完成**：VIP客服確認問題完全解決
- **客戶確認**：客戶滿意度確認（必要）
- **主管確認**：客服主管確認處理品質

#### 業務規則

1. **即時響應**：5分鐘內需要專人回應
2. **專屬服務**：指派專屬VIP客服
3. **主管關注**：客服主管需要跟進處理過程
4. **後續服務**：問題解決後提供額外關懷服務

### 7. SECURITY_PERMISSION_CHANGED - 權限變更通知

#### 基本資訊

```yaml
類型: SECURITY_PERMISSION_CHANGED
分類: INFORMATIONAL
完成策略: MANUAL
優先級: MEDIUM
觸發頻率: 每次權限變更一次
```

#### 觸發條件

- **主要條件**：用戶權限被修改
- **變更類型**：包括角色變更、權限增減、帳戶狀態變更
- **安全等級**：根據權限重要性調整優先級

#### 接收者規則

```yaml
主要接收者:
  - 類型: USER
  - 對象: 被變更權限的用戶

監控接收者:
  - 類型: ROLE
  - 角色: it_admin
  - 部門: IT部

安全接收者:
  - 類型: ROLE
  - 角色: security_officer
  - 條件: 高權限變更 OR 異常時間變更
```

#### 通知內容模板

```yaml
標題: '🔐 您的帳戶權限已變更'
內容: '您的帳戶權限已由 {admin_name} 進行調整，變更內容：{permission_changes}'
動作連結: '/admin/profile/permissions'
```

#### 完成條件

- **手動完成**：用戶確認已知悉權限變更
- **安全確認**：IT管理員確認變更無異常
- **自動歸檔**：30天後自動歸檔

#### 業務規則

1. **即時通知**：權限變更立即通知相關人員
2. **變更記錄**：完整記錄權限變更歷史
3. **異常檢測**：檢測異常權限變更並告警
4. **定期審查**：定期審查權限變更的合理性

## 🔄 通知路由規則

### 路由配置表

```sql
-- 完整的通知路由配置
INSERT INTO notification_routing_rules (
  notification_type,
  target_type,
  target_criteria,
  send_to_user,
  priority_adjustment,
  is_active
) VALUES
-- 訂單相關
('order_new', 'role', '{"roles": ["sales"], "department": "sales"}', FALSE, 'high', TRUE),
('order_high_value', 'role', '{"roles": ["sales_manager"], "department": "sales"}', FALSE, 'urgent', TRUE),

-- 庫存相關
('inventory_low_stock', 'role', '{"roles": ["warehouse_manager"], "department": "warehouse"}', FALSE, 'high', TRUE),
('inventory_out_of_stock', 'role', '{"roles": ["warehouse_manager", "purchasing"], "departments": ["warehouse", "purchasing"]}', FALSE, 'urgent', TRUE),

-- 客服相關
('customer_service_new_request', 'role', '{"roles": ["customer_service"], "department": "support"}', FALSE, 'medium', TRUE),
('customer_vip_issue', 'role', '{"roles": ["vip_customer_service"], "department": "support"}', FALSE, 'urgent', TRUE),

-- 安全相關
('security_permission_changed', 'custom', '{"user_affected": true, "roles": ["it_admin"], "department": "it"}', TRUE, 'medium', TRUE);
```

### 路由邏輯

#### 1. 角色路由 (ROLE)

```typescript
// 根據用戶角色分發通知
function routeByRole(
  notificationType: string,
  targetRoles: string[],
): string[] {
  return users
    .filter((user) => targetRoles.includes(user.role) && user.isActive)
    .map((user) => user.id)
}
```

#### 2. 部門路由 (DEPARTMENT)

```typescript
// 根據部門分發通知
function routeByDepartment(
  notificationType: string,
  targetDepartments: string[],
): string[] {
  return users
    .filter(
      (user) => targetDepartments.includes(user.department) && user.isActive,
    )
    .map((user) => user.id)
}
```

#### 3. 廣播路由 (BROADCAST)

```typescript
// 全體廣播通知
function routeBroadcast(notificationType: string, criteria: any): string[] {
  let targetUsers = users.filter((user) => user.isActive)

  // 可以根據條件過濾
  if (criteria.excludeRoles) {
    targetUsers = targetUsers.filter(
      (user) => !criteria.excludeRoles.includes(user.role),
    )
  }

  return targetUsers.map((user) => user.id)
}
```

#### 4. 自定義路由 (CUSTOM)

```typescript
// 自定義條件路由
function routeCustom(notificationType: string, criteria: any): string[] {
  let targetUsers = []

  // 直接指定用戶ID
  if (criteria.userIds) {
    targetUsers.push(...criteria.userIds)
  }

  // 根據複雜條件查詢
  if (criteria.complexQuery) {
    targetUsers.push(...executeComplexQuery(criteria.complexQuery))
  }

  return targetUsers
}
```

## ⚡ 動態規則調整

### 優先級動態調整

```yaml
規則:
  - 條件: VIP客戶相關
    動作: 優先級提升一級

  - 條件: 業務高峰期
    動作: 所有訂單通知提升為 HIGH

  - 條件: 庫存緊急
    動作: 庫存相關通知提升為 URGENT

  - 條件: 系統維護期間
    動作: 非緊急通知降級為 LOW
```

### 通知頻率控制

```yaml
規則:
  - 類型: INVENTORY_LOW_STOCK
    限制: 同一商品24小時內最多1次

  - 類型: CUSTOMER_SERVICE_NEW_REQUEST
    限制: 同一客戶1小時內最多3次

  - 類型: SECURITY_PERMISSION_CHANGED
    限制: 同一用戶1小時內最多5次
```

### 業務時間規則

```yaml
規則:
  - 時間: 非營業時間 (22:00-08:00)
    動作: 非緊急通知延遲到營業時間發送

  - 時間: 週末和假日
    動作: 僅發送 URGENT 等級通知

  - 時間: 系統維護期間
    動作: 暫停所有通知，維護結束後批量發送
```

## 🔍 通知內容規範

### 標題規範

```yaml
格式: '[圖示] 動作 - 對象'
長度: 10-30個字符
範例:
  - '📦 庫存不足 - iPhone 14'
  - '💬 新客服請求 - 張三'
  - '🚨 系統異常 - 付款模組'
```

### 內容規範

```yaml
結構:
  - 背景說明: 簡短描述發生什麼
  - 影響範圍: 說明影響程度
  - 建議動作: 明確的下一步行動

長度: 50-200個字符
語調: 專業、簡潔、明確
```

### 動作連結規範

```yaml
格式: '/admin/{模組}/{對象}/{動作}'
範例:
  - '/admin/orders/12345/process'
  - '/admin/inventory/product-456/restock'
  - '/admin/support/tickets/789/respond'
```

## 統計與監控規則

### 通知統計指標

```yaml
業務指標:
  - 通知發送量（按類型、時間）
  - 通知完成率（按類型、用戶）
  - 平均處理時間
  - 智能建議接受率

性能指標:
  - 通知發送延遲
  - 系統響應時間
  - 資料庫查詢性能
  - 快取命中率
```

### 告警規則

```yaml
業務告警:
  - 條件: 通知完成率 < 80%
    動作: 發送告警給團隊主管

  - 條件: 平均處理時間 > SLA 150%
    動作: 升級告警等級

  - 條件: 智能建議準確率 < 60%
    動作: 檢查建議邏輯

系統告警:
  - 條件: 通知發送失敗率 > 5%
    動作: 立即通知技術團隊

  - 條件: 資料庫連接異常
    動作: 啟動備用服務
```

## 配置管理規則

### 配置變更流程

```yaml
步驟:
  1. 配置提案: 提交配置變更需求
  2. 影響評估: 評估變更對系統的影響
  3. 測試驗證: 在測試環境驗證配置
  4. 審批流程: 相關負責人審批
  5. 上線部署: 分階段上線新配置
  6. 監控回饋: 監控配置效果
```

### 配置回滾機制

```yaml
觸發條件:
  - 配置導致系統異常
  - 業務指標異常下降
  - 用戶投訴增加

回滾步驟: 1. 停止新配置
  2. 恢復之前配置
  3. 清理異常數據
  4. 重新載入配置
  5. 驗證系統正常
```

---

## 規則總結

本規則文件定義了通知系統的完整業務規則，包括：

1. **7種核心通知類型**的詳細規則定義
2. **路由分發機制**的配置和邏輯
3. **動態調整規則**的條件和動作
4. **內容規範**的標準化要求
5. **監控告警**的指標和閾值

所有規則都遵循**可配置、可監控、可調整**的原則，確保系統能夠靈活應對不同的業務場景和需求變化。
