# E-commerce Admin Platform Sitemap 電商管理平台網站地圖

## 1. Authentication 認證
- **SignIn 登入** (`/login`)
  - Email/Password SignIn(Login) 電子郵件/密碼登入
  - OAuth SignIn(Login) (Google) OAuth 登入 (Google)
  - Password Reset 密碼重設
- **SignUp 註冊** (`/register`)
  - Email SignUp(Registration) 電子郵件註冊
  - OAuth SignUp(Registration) OAuth 註冊
- **SignOut 登出** (`/logout`)
- **Onboarding 首次登入引導流程** (`/onboarding`)
  - Feature Tour 功能導覽
  - Basic Setup Guide 基本設定引導
  - Personalization 個人化設定

## 2. Dashboard 儀表板 (`/`)
- **Overview 概覽**
  - Key Performance Indicators (KPIs) 關鍵績效指標
  - Low Stock Alerts 低庫存警告
  - Recent Orders 近期訂單
  - Sales Summary 銷售摘要
  - Revenue Charts 營收圖表
  - Customer Activity 客戶活動
- **Notification Center 通知中心** (`/notifications`)
  - Order Notifications 訂單通知 (WebSocket 推播)
  - Support Messages 客服訊息通知
  - Inventory Alerts 庫存警告通知
  - Notification Settings 通知設定與管理

## 3. Product Management 產品管理
- **Products List 產品列表** (`/products`)
  - Product Search & Filtering 產品搜尋和篩選
  - Product Categories 產品分類
  - Bulk Actions 批量操作
  - Export Products 導出產品
- **Product Detail 產品詳情** (`/products/:id`)
  - Basic Information 基本信息
  - Inventory Management 庫存管理
  - Price Management 價格管理
  - Image Management 圖片管理
  - Product Editing 產品編輯
  - Product Deletion (Soft Delete) 產品刪除（軟刪除）

## 4. Order Management 訂單管理
- **Orders List 訂單列表** (`/orders`)
  - Order Search & Filtering 訂單搜尋和篩選
  - Order Status Management 訂單狀態管理
  - Bulk Actions 批量操作
  - Export Orders 導出訂單
- **Order Detail 訂單詳情** (`/orders/:id`)
  - Order Information 訂單信息
  - Customer Information 客戶信息
  - Order Items 訂單項目
  - Payment Status 付款狀態
  - Shipping Status 配送狀態
  - Order Actions 訂單操作 (Cancel 取消, Complete 完成, etc.)

## 5. Customer Management 客戶管理
- **Customers List 客戶列表** (`/customers`)
  - Customer Search & Filtering 客戶搜尋和篩選
  - Customer Status Management 客戶狀態管理
  - RFM Analysis RFM 分析
  - Export Customer Data 導出客戶數據
- **Customer Detail 客戶詳情** (`/customers/:id`)
  - Customer Information 客戶信息
  - Order History 訂單歷史
  - RFM Score RFM 評分
  - Customer Notes 客戶備註

## 6. Customer Support 客戶支援
- **Support Dashboard 支援儀表板** (`/support`)
  - Open Tickets 待處理工單
  - Recent Conversations 近期對話
  - Support Statistics 支援統計
- **Conversations 對話**
  - Chat Interface 聊天界面
  - Message History 訊息歷史
  - Status Management 狀態管理
- **Tickets 工單**
  - Ticket Management 工單管理
  - Priority Setting 優先級設定
  - Assignment 分配
  - Resolution Tracking 解決追蹤

## 7. Inventory Management 庫存管理
- **Inventory Overview 庫存概覽** (Part of Products or Dashboard)
  - Stock Levels 庫存水平
  - Low Stock Alerts 低庫存警告
  - Inventory Adjustments 庫存調整
  - Inventory Logs 庫存日誌

## 8. Settings 設定 (`/settings`)
- **User Settings 用戶設定**
  - Profile Management 個人資料管理
  - Password Change 密碼變更
  - Notification Preferences 通知偏好設定
- **Application Settings 應用程式設定**
  - Theme Selection 主題選擇
  - Language Selection 語言選擇
  - Display Preferences 顯示偏好設定
- **Localization 多語言與國際化** (`/settings/localization`)
  - System Language 系統語言設定
  - Product Translations 產品翻譯管理
  - Regional Settings 區域設定
- **User & Role Management 用戶與角色管理** (`/settings/users`)
  - User List 用戶列表
  - User Permissions 用戶權限管理
  - Role Definitions 角色定義
  - Role Permissions 角色權限設定

## 9. Analytics & Reports 分析報表
- **Sales Reports 銷售報表**
  - Period Analysis 期間分析
  - Product Performance 產品表現
  - Revenue Tracking 營收追蹤
- **Customer Analysis 客戶分析**
  - RFM Segmentation RFM 分群
  - Customer Behavior 客戶行為
  - Customer Value 客戶價值
- **Inventory Reports 庫存報表**
  - Stock Movement 庫存變動
  - Adjustment History 調整歷史
  - Forecasting 預測

## 10. System Monitoring & Logs 系統監控與日誌
- **System Status 系統狀態** (`/system/status`)
  - System Health 系統健康狀態
  - Performance Monitoring 效能監控
  - Resource Usage 系統資源使用情況
- **Operation Logs 操作日誌** (`/system/logs`)
  - User Activities 用戶操作記錄
  - System Events 系統事件日誌
  - Security Audit 安全審計記錄

## 11. Data Management 資料管理
- **Data Import/Export 資料導入/導出** (`/data`)
  - Bulk Product Import 批量導入商品
  - Bulk Report Export 批量導出報表
  - Scheduled Backup 定期備份設定
  - Data Format Conversion 資料格式轉換

## 12. Edge Cases 邊緣情境
- **Error Pages 錯誤頁面**
  - 404 Not Found 404 頁面未找到 (`/404`)
  - 403 Forbidden 403 禁止訪問 (`/403`)
  - 500 Server Error 500 伺服器錯誤 (`/500`)
- **System Status Pages 系統狀態頁面**
  - Maintenance Mode 維護模式 (`/maintenance`)
  - Service Unavailable 服務不可用 (`/503`)
- **Authentication Edge Cases 認證邊緣情境**
  - Session Expired 會話過期 (`/session-expired`)
  - Insufficient Permissions 權限不足 (`/no-permission`)
  - Account Locked 帳戶鎖定 (`/account-locked`)