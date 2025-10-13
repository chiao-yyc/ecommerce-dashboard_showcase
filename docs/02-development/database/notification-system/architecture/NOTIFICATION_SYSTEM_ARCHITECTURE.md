# 通知系統架構與設計文件

## 系統定位與範圍

### 系統目標

本通知系統專為**後台管理系統**設計，服務於內部員工的工作協作與業務處理需求。

### 明確邊界

- **✅ 包含範圍**：內部員工工作通知、系統監控警報、業務流程通知
- **❌ 不包含範圍**：客戶端通知、行銷推播、外部系統通知

### 用戶對象

- **主要用戶**：內部員工（管理員、銷售、客服、倉庫、IT等）
- **次要用戶**：系統管理員、開發人員

## 系統架構設計

### 核心架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                     通知系統架構                            │
├─────────────────────────────────────────────────────────────┤
│  前端 UI 層                                                 │
│  ├─ NotificationList.vue     (通知列表)                     │
│  ├─ NotificationCard.vue     (通知卡片)                     │
│  └─ NotificationBadge.vue    (通知徽章)                     │
├─────────────────────────────────────────────────────────────┤
│  業務邏輯層                                                 │
│  ├─ useNotification.ts       (Vue Composable)              │
│  ├─ NotificationApiService.ts (API 服務)                   │
│  └─ GroupNotificationApiService.ts (群組通知服務)          │
├─────────────────────────────────────────────────────────────┤
│  資料處理層                                                 │
│  ├─ 通知分類系統             (INFORMATIONAL/ACTIONABLE)    │
│  ├─ 完成策略系統             (AUTO/SUGGESTED/MANUAL)       │
│  ├─ 群組通知機制             (ROLE/DEPARTMENT/BROADCAST)   │
│  └─ 智能建議引擎             (自動建議完成)                │
├─────────────────────────────────────────────────────────────┤
│  資料庫層                                                   │
│  ├─ notifications            (核心通知表)                  │
│  ├─ notification_templates   (通知模板)                    │
│  ├─ notification_groups      (群組定義)                    │
│  ├─ notification_distributions (分發記錄)                 │
│  └─ notification_recipients  (接收者記錄)                  │
├─────────────────────────────────────────────────────────────┤
│  觸發器層                                                   │
│  ├─ 自動觸發器               (Database Triggers)           │
│  ├─ 智能建議觸發器           (Smart Suggestions)           │
│  └─ 業務邏輯觸發器           (Business Rules)              │
└─────────────────────────────────────────────────────────────┘
```

### 核心組件

#### 1. 通知分類系統

```typescript
enum NotificationCategory {
  INFORMATIONAL = 'informational', // 資訊推送：只需知悉
  ACTIONABLE = 'actionable', // 任務管理：需要處理
}
```

#### 2. 完成策略系統

```typescript
enum CompletionStrategy {
  AUTO = 'auto', // 自動完成：系統狀態變更自動完成
  SUGGESTED = 'suggested', // 智能建議：系統建議，用戶確認
  MANUAL = 'manual', // 純手動：用戶完全控制
}
```

#### 3. 群組通知機制

```typescript
enum NotificationTargetType {
  USER = 'user', // 個人通知
  ROLE = 'role', // 角色群組
  DEPARTMENT = 'department', // 部門群組
  BROADCAST = 'broadcast', // 全體廣播
  CUSTOM = 'custom', // 自定義群組
}
```

## 資料庫設計

### 核心表結構

#### 主要通知表 (notifications)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                    -- 接收用戶
  type TEXT NOT NULL,                       -- 通知類型
  title TEXT NOT NULL,                      -- 通知標題
  message TEXT NOT NULL,                    -- 通知內容
  priority TEXT NOT NULL DEFAULT 'medium', -- 優先級
  status TEXT NOT NULL DEFAULT 'unread',   -- 狀態
  channels TEXT[] DEFAULT '{in_app}',       -- 發送管道陣列
  metadata JSONB DEFAULT '{}',              -- 額外資料
  related_entity_type TEXT,                 -- 關聯實體類型
  related_entity_id TEXT,                   -- 關聯實體ID
  action_url TEXT,                          -- 操作連結
  expires_at TIMESTAMP WITH TIME ZONE,     -- 過期時間
  read_at TIMESTAMP WITH TIME ZONE,        -- 已讀時間
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 新增分類和完成策略欄位 (來自 05_notification_categories_fixed.sql)
  category TEXT NOT NULL DEFAULT 'informational', -- 分類
  completion_strategy TEXT NOT NULL DEFAULT 'manual', -- 完成策略
  suggested_complete BOOLEAN DEFAULT FALSE, -- 智能建議標記
  suggested_at TIMESTAMP WITH TIME ZONE,   -- 建議時間
  suggestion_reason TEXT,                   -- 建議原因
  auto_completed_at TIMESTAMP WITH TIME ZONE, -- 自動完成時間
  -- 群組通知相關欄位 (來自 08_multi_user_notifications.sql)
  distribution_id UUID,                     -- 分發記錄ID
  is_personal BOOLEAN DEFAULT TRUE          -- 是否個人通知
);
```

#### 群組通知表 (notification_groups)

```sql
CREATE TABLE notification_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                       -- 群組名稱
  description TEXT,                         -- 群組描述
  target_type notification_target_type NOT NULL, -- 目標類型
  target_criteria JSONB NOT NULL,          -- 群組條件
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 通知分發表 (notification_distributions)

```sql
CREATE TABLE notification_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type notification_target_type NOT NULL, -- 目標類型
  target_criteria JSONB NOT NULL,          -- 分發條件
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 約束與索引

#### 資料完整性約束

- **分類約束**：`category IN ('informational', 'actionable')`
- **完成策略約束**：`completion_strategy IN ('auto', 'suggested', 'manual')`
- **狀態約束**：`status IN ('unread', 'read', 'completed', 'dismissed', 'archived')`
- **通知類型約束**：確保 `NotificationType` 和 `RelatedEntityType` 的一致性

#### 性能優化索引

```sql
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_completion_strategy ON notifications(completion_strategy);
CREATE INDEX idx_notifications_suggested_complete ON notifications(suggested_complete)
  WHERE suggested_complete = TRUE;
```

## 通知分類與規則

### 現有通知類型分析

#### 後台管理通知（7種核心類型）

1. **ORDER_NEW** - 新訂單通知
   - **分類**：ACTIONABLE
   - **完成策略**：SUGGESTED
   - **接收者**：銷售團隊角色
   - **觸發條件**：新訂單創建
   - **處理動作**：處理訂單、確認庫存

2. **ORDER_HIGH_VALUE** - 高價值訂單警示
   - **分類**：ACTIONABLE
   - **完成策略**：MANUAL
   - **接收者**：銷售經理角色
   - **觸發條件**：訂單金額 > $10,000
   - **處理動作**：VIP客戶關懷、特殊處理

3. **INVENTORY_LOW_STOCK** - 低庫存警告
   - **分類**：ACTIONABLE
   - **完成策略**：SUGGESTED
   - **接收者**：倉庫管理員角色
   - **觸發條件**：庫存 ≤ 低庫存閾值
   - **處理動作**：安排補貨、聯繫供應商

4. **INVENTORY_OUT_OF_STOCK** - 缺貨通知
   - **分類**：ACTIONABLE
   - **完成策略**：AUTO
   - **接收者**：倉庫管理員 + 採購部門
   - **觸發條件**：庫存 = 0
   - **處理動作**：緊急補貨、暫停銷售

5. **CUSTOMER_SERVICE_NEW_REQUEST** - 新客服請求
   - **分類**：ACTIONABLE
   - **完成策略**：SUGGESTED
   - **接收者**：客服團隊角色
   - **觸發條件**：客戶提交服務請求
   - **處理動作**：分配客服、回覆客戶

6. **CUSTOMER_VIP_ISSUE** - VIP客戶問題
   - **分類**：ACTIONABLE
   - **完成策略**：MANUAL
   - **接收者**：VIP客服專員角色
   - **觸發條件**：VIP客戶提交問題
   - **處理動作**：優先處理、主管關注

7. **SECURITY_PERMISSION_CHANGED** - 權限變更通知
   - **分類**：INFORMATIONAL
   - **完成策略**：MANUAL
   - **接收者**：被變更用戶 + IT管理員
   - **觸發條件**：用戶權限被修改
   - **處理動作**：確認權限變更、安全監控

### 通知路由規則

#### 配置驅動的路由系統

```sql
-- 通知路由配置表
CREATE TABLE notification_routing_rules (
  notification_type TEXT PRIMARY KEY,
  target_type notification_target_type NOT NULL,
  target_criteria JSONB NOT NULL,
  send_to_user BOOLEAN DEFAULT FALSE,  -- 是否同時發送給相關用戶
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 預設路由規則
INSERT INTO notification_routing_rules VALUES
('order_new', 'role', '{"roles": ["sales"]}', FALSE, TRUE),
('order_high_value', 'role', '{"roles": ["sales_manager"]}', FALSE, TRUE),
('inventory_low_stock', 'role', '{"roles": ["warehouse_manager"]}', FALSE, TRUE),
('inventory_out_of_stock', 'role', '{"roles": ["warehouse_manager", "purchasing"]}', FALSE, TRUE),
('customer_service_new_request', 'role', '{"roles": ["customer_service"]}', FALSE, TRUE),
('customer_vip_issue', 'role', '{"roles": ["vip_customer_service"]}', FALSE, TRUE),
('security_permission_changed', 'role', '{"roles": ["it_admin"]}', TRUE, TRUE);
```

## 🤖 智能建議系統

### 智能建議原理

#### 1. 自動完成 (AUTO)

系統檢測到明確的狀態變更時，自動將通知標記為已完成。

**範例**：

- 缺貨通知 → 庫存恢復時自動完成
- 訂單取消通知 → 訂單狀態變更為已取消時自動完成

#### 2. 智能建議 (SUGGESTED)

系統檢測到相關業務狀態變更時，建議用戶標記通知為已完成。

**範例**：

- 新訂單通知 → 訂單狀態變更為已出貨時建議完成
- 低庫存警告 → 庫存補充超過閾值時建議完成

#### 3. 純手動 (MANUAL)

重要或複雜的通知，完全由用戶控制完成時機。

**範例**：

- 高價值訂單 → 需要人工確認所有處理步驟
- VIP客戶問題 → 需要確認客戶滿意度

### 智能建議觸發器

#### 庫存相關建議

```sql
-- 庫存補充建議
IF NEW.stock > NEW.low_stock_threshold AND OLD.stock <= OLD.low_stock_threshold THEN
  UPDATE notifications
  SET suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '庫存已補充至 ' || NEW.stock || ' 件'
  WHERE related_entity_type = 'product'
    AND related_entity_id = NEW.id::text
    AND type IN ('inventory_low_stock')
    AND completion_strategy = 'suggested';
END IF;
```

#### 訂單相關建議

```sql
-- 訂單出貨建議
IF NEW.shipping_status = 'shipped' AND OLD.shipping_status != 'shipped' THEN
  UPDATE notifications
  SET suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '訂單已出貨'
  WHERE related_entity_type = 'order'
    AND related_entity_id = NEW.id::text
    AND type IN ('order_new', 'order_high_value')
    AND completion_strategy = 'suggested';
END IF;
```

## 🔄 通知生命週期

### 狀態轉換圖

```
UNREAD → READ → COMPLETED (ACTIONABLE)
               ↓
             DISMISSED (INFORMATIONAL)
               ↓
            ARCHIVED
```

### 狀態說明

- **UNREAD**：未讀狀態，用戶尚未查看
- **READ**：已讀狀態，用戶已查看但未處理
- **COMPLETED**：已完成狀態，僅適用於 ACTIONABLE 通知
- **DISMISSED**：已知悉狀態，僅適用於 INFORMATIONAL 通知
- **ARCHIVED**：已歸檔狀態，不再顯示在主要列表中

### 操作流程

#### 資訊型通知流程

1. **系統觸發** → 創建 UNREAD 通知
2. **用戶查看** → 狀態變更為 READ
3. **用戶操作** → 點擊「已知悉」→ 狀態變更為 DISMISSED
4. **系統清理** → 定期將舊通知歸檔為 ARCHIVED

#### 任務型通知流程

1. **系統觸發** → 創建 UNREAD 通知
2. **用戶查看** → 狀態變更為 READ
3. **智能建議** → 系統檢測狀態變更，設置 suggested_complete = TRUE
4. **用戶確認** → 接受建議或手動標記 → 狀態變更為 COMPLETED
5. **系統清理** → 定期將舊通知歸檔為 ARCHIVED

## 📈 性能與擴展設計

### 性能優化策略

#### 1. 資料庫層級優化

- **索引策略**：針對常用查詢建立複合索引
- **分區策略**：按時間分區存儲歷史通知
- **清理策略**：定期清理過期通知和建議

#### 2. 應用層級優化

- **快取策略**：常用通知數據快取
- **批量操作**：群組通知批量創建
- **異步處理**：大量通知異步分發

#### 3. 前端層級優化

- **虛擬滾動**：大量通知列表虛擬化
- **實時更新**：WebSocket 或 Server-Sent Events
- **本地快取**：通知狀態本地快取

### 擴展性設計

#### 1. 通知類型擴展

- **模板系統**：新增通知類型的標準化流程
- **插件機制**：支援第三方通知插件
- **配置管理**：通知規則動態配置

#### 2. 通道擴展

- **多通道支援**：In-App、Email、SMS、Push
- **通道策略**：根據優先級和用戶偏好選擇通道
- **外部整合**：支援第三方通知服務

#### 3. 分散式部署

- **微服務架構**：通知服務獨立部署
- **消息隊列**：使用 Redis/RabbitMQ 處理高並發
- **負載均衡**：支援水平擴展

## 安全性考慮

### 資料安全

- **權限控制**：用戶只能查看自己的通知
- **資料加密**：敏感通知內容加密存儲
- **審計日誌**：完整的通知操作記錄

### 系統安全

- **輸入驗證**：所有通知內容嚴格驗證
- **XSS防護**：通知內容 HTML 轉義
- **CSRF保護**：通知操作 CSRF Token 驗證

### 隱私保護

- **資料最小化**：只收集必要的通知資料
- **保留政策**：定期清理過期通知
- **匿名化處理**：歷史數據匿名化

## 🧪 測試策略

### 單元測試

- **核心功能測試**：通知 CRUD 操作
- **業務邏輯測試**：分類、完成策略邏輯
- **約束驗證測試**：資料完整性約束

### 整合測試

- **觸發器測試**：各種業務觸發器
- **API測試**：通知服務 API 端點
- **群組通知測試**：群組分發邏輯

### 端到端測試

- **用戶流程測試**：完整的通知處理流程
- **性能測試**：大量通知處理性能
- **可靠性測試**：系統異常情況處理

## 部署與維護

### 部署策略

- **漸進式部署**：分階段上線新功能
- **藍綠部署**：零停機更新
- **回滾機制**：快速回滾異常版本

### 監控與告警

- **性能監控**：通知處理時間和成功率
- **業務監控**：通知分發統計和用戶行為
- **系統告警**：異常情況即時告警

### 維護指南

- **資料庫維護**：定期清理、索引優化
- **配置管理**：通知規則版本控制
- **故障排除**：常見問題診斷指南

---

## 總結

本通知系統採用分層架構設計，專注於後台管理需求，提供：

1. **智能分類**：INFORMATIONAL/ACTIONABLE 雙重分類
2. **智能建議**：AUTO/SUGGESTED/MANUAL 三層完成策略
3. **群組通知**：角色、部門、廣播多種分發方式
4. **擴展性**：模組化設計，易於擴展和維護
5. **高性能**：優化的資料庫設計和快取策略

系統設計遵循**簡單、可靠、高效**的原則，為內部協作提供強有力的通知支撐。
