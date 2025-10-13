# Notification 通知系統

## 系統概述

通知系統是電商平台的核心功能模組，提供完整的通知管理解決方案，支援個人通知、群組通知、智能建議和即時推送功能。

## 核心功能

### 通知管理功能
- **個人通知管理**: 員工工作通知、任務提醒
- **群組通知系統**: 角色通知、廣播通知、部門通知
- **智能建議系統**: 自動完成建議、業務流程優化
- **即時通知推送**: 基於 Supabase Realtime 的即時更新

### 系統特色
- **模板保護機制**: 8個核心模板受到多層保護
- **智能完成建議**: 基於業務觸發器的自動建議
- **群組路由**: 角色基礎的通知分發
- **實時訂閱**: 基於 Supabase 實時功能的即時更新

## 文檔導航

### 系統架構文檔
- [通知系統架構總覽](../../database/notification-system/architecture/NOTIFICATION_SYSTEM_ARCHITECTURE.md) - 整體架構設計與元件關係
- [通知系統約束](../../database/notification-system/architecture/NOTIFICATION_CONSTRAINTS.md) - 系統約束與業務規則
- [通知規則說明](../../database/notification-system/architecture/NOTIFICATION_RULES.md) - 通知分類與觸發規則

### 開發與設置指南
- [通知系統開發指南](../../database/notification-system/architecture/NOTIFICATION_DEVELOPMENT_GUIDE.md) - 開發環境設置與最佳實踐
- [通知系統設置](../../database/notification-system/architecture/NOTIFICATION_SETUP.md) - 系統初始化與配置

### API 與整合
- [通知系統 API 文檔](../../api/notification-system.md) - API 端點與函數參考
- [通知系統完整指南](../../../04-guides/dev-notes/NOTIFICATION_SYSTEM_COMPLETE_GUIDE.md) - 完整使用指南

## 資料結構

### 核心資料表
- **notifications**: 通知主表
- **notification_templates**: 通知模板管理
- **notification_routing_rules**: 通知路由規則
- **notification_distribution_stats**: 通知統計分析

### 關鍵關係
- 通知 → 模板 (template_id)
- 通知 → 用戶 (target_user_id)
- 路由規則 → 角色 (target_role)

## 智能建議系統

### 核心模板保護
系統維護 8 個核心模板，受到多層保護機制：

#### 訂單建議依賴
- `order_new` - 新訂單通知
- `order_high_value` - 高價值訂單
- `order_paid` - 訂單付款完成

#### 產品建議依賴
- `product_deactivated` - 產品停用通知
- `product_price_major_change` - 產品價格重大變更

#### 客戶建議依賴
- `customer_new_registration` - 新客戶註冊

#### 庫存建議依賴
- `inventory_low_stock` - 低庫存警告
- `inventory_out_of_stock` - 缺貨警告
- `inventory_overstock` - 過量庫存警告

## 🛡️ 保護機制層級

### 1. 資料庫約束保護
- 系統模板強制保持啟用狀態
- `is_system_required` 欄位約束

### 2. 觸發器保護
- 防止刪除核心模板
- 防止停用系統必要模板
- 防止移除保護標記

### 3. 權限控制保護
- 需要超級管理員權限修改
- 視覺化標示系統模板 (🔒)

### 4. 管理視圖保護
- `notification_templates_with_protection` 安全視圖
- 統一的保護狀態查詢介面

## 使用流程

### 基本通知發送
1. 選擇或創建通知模板
2. 設定目標用戶或群組
3. 執行通知發送
4. 追蹤通知狀態

### 群組通知管理
1. 配置路由規則
2. 定義目標角色
3. 批量發送通知
4. 統計分發結果

### 智能建議使用
1. 業務事件觸發
2. 系統自動分析
3. 生成完成建議
4. 用戶採納執行

## 技術實現

### 前端組件
- `NotificationList.vue` - 通知列表管理
- `NotificationBadge.vue` - 通知指示器
- `NotificationTemplateManager.vue` - 模板管理

### API 服務
- `NotificationApiService.ts` - 通知 API 服務
- `NotificationTemplateService.ts` - 模板管理服務

### Composables
- `useNotification.ts` - 通知狀態管理
- `useNotificationRealtime.ts` - 實時訂閱

## 監控與分析

### 系統健康度
- 通知發送成功率
- 模板使用統計
- 系統保護狀態

### 業務分析
- 通知完成率
- 用戶互動統計
- 建議採納率

## 相關系統

- [Campaign 活動系統](../campaign/) - 活動相關通知
- [Analytics 分析系統](../analytics/) - 通知效果分析
- [Customer 客戶系統](../customer/) - 客戶通知管理

## 重要提醒

### 系統模板保護
- 8個核心模板受到嚴格保護
- 修改前須評估對建議功能的影響
- 緊急情況下使用 `emergency_template_unlock.sql`

### 開發注意事項
- 新增建議邏輯時須確保依賴模板存在
- 系統模板必須標記為 `is_system_required = TRUE`
- 保持初始化順序：核心模板 → 路由規則 → 保護機制 → 觸發器

---

*本文檔整合了原有的深層嵌套結構，提供統一的導航和管理入口*