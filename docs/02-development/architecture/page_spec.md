# E-commerce Admin Platform 頁面與元件規格

---

## 1. Authentication 認證

### 1.1 SignIn 登入 (`/login`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 登入頁 SignIn Page |
| 使用情境 | 用戶輸入帳號密碼或 OAuth 登入，進入管理後台 |
| 使用者角色 | 所有未登入用戶 |
| 功能清單 | Email/Password 登入、OAuth 登入、忘記密碼連結 |
| 資料來源 | /auth/login, /auth/google |
| 元件拆解 | LoginFormCard、Input、Button、Link |
| 邊界情況處理 | 登入失敗顯示錯誤、登入中顯示 loading、登入成功跳轉 |
| 可互動元素 | 登入按鈕、OAuth 登入按鈕、忘記密碼連結 |
| 權限控制 | 僅未登入可進入 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | LoginFormCard 登入表單卡片 |
| 描述 | 提供帳號密碼、OAuth 登入與忘記密碼操作 |
| 觸發條件 | 用戶填寫表單並點擊登入 |
| 輸入/輸出 | input: email, password → output: 登入成功/失敗 |
| 使用元件 | Card, Input, Button, Link (shadcn UI) |
| 外部依賴 | /auth/login, /auth/google |
| 狀態定義 | idle/loading/error/success |
| 回饋機制 | 錯誤顯示 toast，成功跳轉 dashboard |

- **shadcn UI 元件建議**：Card, Input, Button, Separator, Alert, Toast

---

### 1.2 SignUp 註冊 (`/register`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 註冊頁 SignUp Page |
| 使用情境 | 新用戶註冊帳號，填寫資料或用 Google 註冊 |
| 使用者角色 | 所有未登入用戶 |
| 功能清單 | Email 註冊、OAuth 註冊、協議同意勾選 |
| 資料來源 | /auth/register, /auth/google |
| 元件拆解 | SignUpFormCard、Input、Button、Checkbox、Link |
| 邊界情況處理 | 註冊失敗顯示錯誤、註冊中 loading、註冊成功跳轉 |
| 可互動元素 | 註冊按鈕、OAuth 註冊按鈕、協議勾選 |
| 權限控制 | 僅未登入可進入 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | SignUpFormCard 註冊表單卡片 |
| 描述 | 提供帳號密碼、OAuth 註冊與協議勾選 |
| 觸發條件 | 用戶填寫表單並點擊註冊 |
| 輸入/輸出 | input: email, password, checked → output: 註冊成功/失敗 |
| 使用元件 | Card, Input, Button, Checkbox, Link (shadcn UI) |
| 外部依賴 | /auth/register, /auth/google |
| 狀態定義 | idle/loading/error/success |
| 回饋機制 | 錯誤顯示 toast，成功跳轉 onboarding |

- **shadcn UI 元件建議**：Card, Input, Button, Checkbox, Alert, Toast

---

### 1.3 Password Reset 密碼重設

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 密碼重設頁 Password Reset Page |
| 使用情境 | 用戶忘記密碼時，通過郵箱重設 |
| 使用者角色 | 所有未登入用戶 |
| 功能清單 | 輸入郵箱、發送驗證信、重設密碼 |
| 資料來源 | /auth/reset-password |
| 元件拆解 | ResetFormCard、Input、Button |
| 邊界情況處理 | 郵箱不存在、API 失敗、成功提示 |
| 可互動元素 | 發送驗證信按鈕、重設密碼按鈕 |
| 權限控制 | 僅未登入可進入 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | ResetFormCard 密碼重設卡片 |
| 描述 | 提供郵箱輸入、發送驗證信與密碼重設 |
| 觸發條件 | 用戶輸入郵箱並點擊發送 |
| 輸入/輸出 | input: email → output: 成功/失敗 |
| 使用元件 | Card, Input, Button, Alert (shadcn UI) |
| 外部依賴 | /auth/reset-password |
| 狀態定義 | idle/loading/error/success |
| 回饋機制 | 成功顯示提示，失敗顯示錯誤 |

- **shadcn UI 元件建議**：Card, Input, Button, Alert, Toast

---

### 1.4 Onboarding 首次登入引導流程 (`/onboarding`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 首次登入引導 Onboarding Page |
| 使用情境 | 新註冊用戶首次登入時進行平台導覽與基本設定 |
| 使用者角色 | 新註冊用戶 |
| 功能清單 | 功能導覽、基本設定、個人化設定 |
| 資料來源 | /user/profile, /onboarding/info |
| 元件拆解 | Stepper, TourCard, Input, Button |
| 邊界情況處理 | API 失敗、可跳過流程 |
| 可互動元素 | 下一步、上一步、跳過按鈕 |
| 權限控制 | 僅新註冊首次登入可進入 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | Stepper 導覽步驟條 |
| 描述 | 顯示導覽進度與步驟內容 |
| 觸發條件 | 頁面載入或用戶操作 |
| 輸入/輸出 | input: 當前步驟 → output: 導覽內容 |
| 使用元件 | Steps, Card, Button (shadcn UI) |
| 外部依賴 | /onboarding/info |
| 狀態定義 | active/complete |
| 回饋機制 | 步驟完成顯示提示 |

- **shadcn UI 元件建議**：Steps, Card, Button, Alert

---

## 2. Dashboard 儀表板 (`/`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 儀表板 Dashboard |
| 使用情境 | 管理員快速瀏覽營運指標、通知與近期動態 |
| 使用者角色 | 管理員、客服、庫存管理員 |
| 功能清單 | KPI 顯示、最新訂單、通知中心、低庫存警示、銷售圖表 |
| 資料來源 | /dashboard/summary, /orders/recent, /notifications |
| 元件拆解 | KpiCard, OrderList, NotificationCenter, ChartCard |
| 邊界情況處理 | 無資料顯示空狀態、API 錯誤顯示錯誤卡片 |
| 可互動元素 | 查看詳情按鈕、通知點擊展開、圖表篩選 |
| 權限控制 | 僅登入用戶可進入 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | KpiCard 營運指標卡片 |
| 描述 | 顯示如銷售額、訂單數、活躍用戶等關鍵指標 |
| 觸發條件 | 頁面載入時自動取得資料 |
| 輸入/輸出 | input: 無 → output: KPI 數據 |
| 使用元件 | Card, Skeleton, Tooltip (shadcn UI) |
| 外部依賴 | /dashboard/summary |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Card, Skeleton, Tooltip, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | OrderList 最新訂單清單 |
| 描述 | 顯示近期訂單摘要，可點擊查看詳情 |
| 觸發條件 | 頁面載入時自動取得資料 |
| 輸入/輸出 | input: 無 → output: 訂單列表資料 |
| 使用元件 | Table, Button, Badge, Skeleton (shadcn UI) |
| 外部依賴 | /orders/recent |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Table, Button, Badge, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | NotificationCenter 通知中心 |
| 描述 | 顯示各類系統通知與即時推播 |
| 觸發條件 | 頁面載入與 WebSocket 推播時 |
| 輸入/輸出 | input: 通知資料流 → output: 通知列表 |
| 使用元件 | Card, List, Badge, Button (shadcn UI) |
| 外部依賴 | /notifications (REST/WebSocket) |
| 狀態定義 | idle/receiving/error |
| 回饋機制 | 新通知高亮，錯誤顯示提示 |

- **shadcn UI 元件建議**：Card, List, Badge, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | ChartCard 銷售圖表卡片 |
| 描述 | 顯示營收、訂單等統計圖表，支援篩選 |
| 觸發條件 | 用戶選擇篩選條件或頁面載入 |
| 輸入/輸出 | input: 篩選條件 → output: 圖表資料 |
| 使用元件 | Card, Tabs, Chart, Skeleton (shadcn UI) |
| 外部依賴 | /dashboard/summary |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Card, Tabs, Skeleton, Alert, Chart (外部)

---

## 3. Product Management 產品管理

### 3.1 Products List 產品列表 (`/products`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 產品列表頁 Products List |
| 使用情境 | 管理員瀏覽、搜尋、編輯、批量管理所有產品 |
| 使用者角色 | 管理員、庫存管理員 |
| 功能清單 | 搜尋、篩選、分類、批量操作、導出產品、查看詳情 |
| 資料來源 | /products, /products/search |
| 元件拆解 | ProductTable, SearchBar, FilterPanel, BulkActionBar, ExportButton |
| 邊界情況處理 | 無資料顯示空狀態、API 錯誤顯示錯誤卡片 |
| 可互動元素 | 搜尋欄、篩選器、批量勾選、操作按鈕 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | ProductTable 產品清單表格 |
| 描述 | 顯示產品列表，支援分頁、排序、批量勾選 |
| 觸發條件 | 頁面載入、自動/手動刷新 |
| 輸入/輸出 | input: 篩選條件 → output: 產品資料列表 |
| 使用元件 | Table, Checkbox, Button, Badge, Pagination (shadcn UI) |
| 外部依賴 | /products, /products/search |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Table, Checkbox, Button, Badge, Pagination, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | SearchBar 產品搜尋欄 |
| 描述 | 提供關鍵字搜尋與自動補全 |
| 觸發條件 | 使用者輸入並觸發搜尋 |
| 輸入/輸出 | input: string → output: 搜尋結果 |
| 使用元件 | Input, Button, AutoComplete (shadcn UI) |
| 外部依賴 | /products/search |
| 狀態定義 | idle/loading/error |
| 回饋機制 | 錯誤顯示提示，搜尋結果即時更新 |

- **shadcn UI 元件建議**：Input, Button, Popover, Skeleton, Alert

---

### 3.2 Product Detail 產品詳情 (`/products/:id`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 產品詳情頁 Product Detail |
| 使用情境 | 管理員查看與編輯單一產品資訊、庫存、價格、圖片 |
| 使用者角色 | 管理員、庫存管理員 |
| 功能清單 | 編輯基本資訊、庫存、價格、圖片、刪除產品 |
| 資料來源 | /products/:id |
| 元件拆解 | ProductInfoForm, InventoryPanel, PricePanel, ImageUploader, DeleteButton |
| 邊界情況處理 | 資料不存在、API 失敗、刪除確認 |
| 可互動元素 | 編輯欄位、儲存、刪除、上傳圖片 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | ProductInfoForm 產品資訊表單 |
| 描述 | 編輯產品名稱、分類、描述等基本資訊 |
| 觸發條件 | 頁面載入或點擊編輯 |
| 輸入/輸出 | input: 產品欄位 → output: 更新結果 |
| 使用元件 | Form, Input, Select, Button (shadcn UI) |
| 外部依賴 | /products/:id |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 儲存成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Form, Input, Select, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | InventoryPanel 庫存管理面板 |
| 描述 | 顯示與調整產品庫存數量 |
| 觸發條件 | 點擊展開或頁面載入 |
| 輸入/輸出 | input: 新庫存數 → output: 更新結果 |
| 使用元件 | Card, InputNumber, Button (shadcn UI) |
| 外部依賴 | /products/:id/inventory |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 更新成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Card, Input, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | ImageUploader 圖片上傳元件 |
| 描述 | 上傳、刪除與管理產品圖片 |
| 觸發條件 | 點擊上傳或刪除 |
| 輸入/輸出 | input: 圖片檔案 → output: 上傳結果 |
| 使用元件 | Upload, Image, Button (shadcn UI) |
| 外部依賴 | /products/:id/images |
| 狀態定義 | idle/uploading/success/error |
| 回饋機制 | 上傳成功顯示縮圖，錯誤顯示提示 |

- **shadcn UI 元件建議**：Upload, Image, Button, Alert

---

## 4. Order Management 訂單管理

### 4.1 Orders List 訂單列表 (`/orders`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 訂單列表頁 Orders List |
| 使用情境 | 管理員瀏覽、查詢、批量處理所有訂單 |
| 使用者角色 | 管理員、客服 |
| 功能清單 | 搜尋、篩選、狀態管理、批量操作、導出訂單、查看詳情 |
| 資料來源 | /orders, /orders/search |
| 元件拆解 | OrderTable, SearchBar, FilterPanel, BulkActionBar, ExportButton |
| 邊界情況處理 | 無資料顯示空狀態、API 錯誤顯示錯誤卡片 |
| 可互動元素 | 搜尋欄、篩選器、批量勾選、操作按鈕 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | OrderTable 訂單清單表格 |
| 描述 | 顯示訂單列表，支援分頁、排序、批量勾選與狀態變更 |
| 觸發條件 | 頁面載入、自動/手動刷新 |
| 輸入/輸出 | input: 篩選條件 → output: 訂單資料列表 |
| 使用元件 | Table, Checkbox, Button, Badge, Pagination (shadcn UI) |
| 外部依賴 | /orders, /orders/search |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Table, Checkbox, Button, Badge, Pagination, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | BulkActionBar 批量操作列 |
| 描述 | 對多個訂單進行批量狀態變更、導出等操作 |
| 觸發條件 | 勾選多筆訂單後顯示 |
| 輸入/輸出 | input: 選取訂單 → output: 操作結果 |
| 使用元件 | Button, DropdownMenu, Tooltip (shadcn UI) |
| 外部依賴 | /orders/bulk-action |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 操作成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Button, DropdownMenu, Tooltip, Alert

---

### 4.2 Order Detail 訂單詳情 (`/orders/:id`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 訂單詳情頁 Order Detail |
| 使用情境 | 管理員查看與處理單一訂單資訊、付款、配送、狀態 |
| 使用者角色 | 管理員、客服 |
| 功能清單 | 查看訂單資訊、付款狀態、配送狀態、訂單操作 |
| 資料來源 | /orders/:id |
| 元件拆解 | OrderInfoPanel, PaymentStatus, ShippingStatus, OrderActionBar |
| 邊界情況處理 | 訂單不存在、API 失敗、操作失敗 |
| 可互動元素 | 狀態切換、操作按鈕 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | OrderInfoPanel 訂單資訊面板 |
| 描述 | 顯示訂單基本資料、客戶、項目明細 |
| 觸發條件 | 頁面載入 |
| 輸入/輸出 | input: 訂單 id → output: 訂單明細 |
| 使用元件 | Card, List, Badge (shadcn UI) |
| 外部依賴 | /orders/:id |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Card, List, Badge, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | OrderActionBar 訂單操作列 |
| 描述 | 提供取消、完成等訂單狀態操作 |
| 觸發條件 | 點擊操作按鈕 |
| 輸入/輸出 | input: 操作指令 → output: 結果 |
| 使用元件 | Button, DropdownMenu, Tooltip, Dialog (shadcn UI) |
| 外部依賴 | /orders/:id/action |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 操作成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Button, DropdownMenu, Tooltip, Dialog, Alert

---

## 5. Customer Management 客戶管理

### 5.1 Customers List 客戶列表 (`/customers`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 客戶列表頁 Customers List |
| 使用情境 | 管理員查詢、篩選、分析所有客戶資料 |
| 使用者角色 | 管理員、客服 |
| 功能清單 | 搜尋、篩選、狀態管理、RFM 分析、導出客戶 |
| 資料來源 | /customers, /customers/search |
| 元件拆解 | CustomerTable, SearchBar, FilterPanel, ExportButton, RfmCard |
| 邊界情況處理 | 無資料顯示空狀態、API 錯誤顯示錯誤卡片 |
| 可互動元素 | 搜尋欄、篩選器、操作按鈕 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | CustomerTable 客戶清單表格 |
| 描述 | 顯示客戶列表，支援分頁、篩選、狀態標記 |
| 觸發條件 | 頁面載入、自動/手動刷新 |
| 輸入/輸出 | input: 篩選條件 → output: 客戶資料列表 |
| 使用元件 | Table, Badge, Pagination, Button (shadcn UI) |
| 外部依賴 | /customers, /customers/search |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Table, Badge, Pagination, Button, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | RfmCard RFM 分析卡片 |
| 描述 | 顯示客戶 RFM 分數與分群標籤 |
| 觸發條件 | 頁面載入或點擊展開 |
| 輸入/輸出 | input: 客戶資料 → output: RFM 分析結果 |
| 使用元件 | Card, Badge, Tooltip (shadcn UI) |
| 外部依賴 | /customers/:id/rfm |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Card, Badge, Tooltip, Skeleton, Alert

---

### 5.2 Customer Detail 客戶詳情 (`/customers/:id`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 客戶詳情頁 Customer Detail |
| 使用情境 | 管理員查看單一客戶資訊、訂單歷史、RFM 分析 |
| 使用者角色 | 管理員、客服 |
| 功能清單 | 查看基本資料、訂單歷史、RFM 分數、備註 |
| 資料來源 | /customers/:id |
| 元件拆解 | CustomerInfoPanel, OrderHistory, RfmCard, NotePanel |
| 邊界情況處理 | 客戶不存在、API 失敗 |
| 可互動元素 | 編輯備註、展開訂單 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | CustomerInfoPanel 客戶資訊面板 |
| 描述 | 顯示客戶基本資料與狀態標記 |
| 觸發條件 | 頁面載入 |
| 輸入/輸出 | input: 客戶 id → output: 客戶明細 |
| 使用元件 | Card, Badge, List (shadcn UI) |
| 外部依賴 | /customers/:id |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Card, Badge, List, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | NotePanel 備註面板 |
| 描述 | 編輯、儲存客戶備註 |
| 觸發條件 | 點擊編輯或儲存 |
| 輸入/輸出 | input: 備註文字 → output: 更新結果 |
| 使用元件 | Textarea, Button, Alert (shadcn UI) |
| 外部依賴 | /customers/:id/notes |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 儲存成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Textarea, Button, Alert

---

## 6. Customer Support 客戶支援

### 6.1 Support Dashboard 支援儀表板 (`/support`)

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 支援儀表板 Support Dashboard |
| 使用情境 | 客服人員瀏覽待處理工單、統計、近期對話 |
| 使用者角色 | 客服、管理員 |
| 功能清單 | 工單列表、對話紀錄、支援統計 |
| 資料來源 | /support/tickets, /support/conversations, /support/stats |
| 元件拆解 | TicketTable, ConversationList, StatCard |
| 邊界情況處理 | 無資料顯示空狀態、API 錯誤顯示錯誤卡片 |
| 可互動元素 | 查看詳情、標記狀態 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | TicketTable 工單清單表格 |
| 描述 | 顯示待處理工單列表，支援標記狀態、分配 |
| 觸發條件 | 頁面載入、自動/手動刷新 |
| 輸入/輸出 | input: 篩選條件 → output: 工單列表 |
| 使用元件 | Table, Badge, Button, DropdownMenu (shadcn UI) |
| 外部依賴 | /support/tickets |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Table, Badge, Button, DropdownMenu, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | ConversationList 對話紀錄清單 |
| 描述 | 顯示客服與客戶間的對話紀錄 |
| 觸發條件 | 頁面載入或點擊展開 |
| 輸入/輸出 | input: 客戶 id → output: 對話內容 |
| 使用元件 | List, Card, Badge, Button (shadcn UI) |
| 外部依賴 | /support/conversations |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：List, Card, Badge, Button, Skeleton, Alert

---

## 7. Inventory Management 庫存管理

### 7.1 Inventory Overview 庫存概覽

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 庫存概覽 Inventory Overview |
| 使用情境 | 管理員/庫存管理員監控庫存水平、調整庫存 |
| 使用者角色 | 管理員、庫存管理員 |
| 功能清單 | 庫存列表、低庫存警示、庫存調整、日誌查詢 |
| 資料來源 | /inventory, /inventory/logs |
| 元件拆解 | InventoryTable, LowStockAlert, AdjustmentPanel, LogList |
| 邊界情況處理 | 無資料顯示空狀態、API 錯誤顯示錯誤卡片 |
| 可互動元素 | 調整按鈕、日誌篩選 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | InventoryTable 庫存清單表格 |
| 描述 | 顯示所有產品庫存資訊，支援調整操作 |
| 觸發條件 | 頁面載入、自動/手動刷新 |
| 輸入/輸出 | input: 篩選條件 → output: 庫存資料列表 |
| 使用元件 | Table, Badge, Button, InputNumber (shadcn UI) |
| 外部依賴 | /inventory |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Table, Badge, Button, Input, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | LowStockAlert 低庫存警示元件 |
| 描述 | 顯示低於警戒線的產品警示 |
| 觸發條件 | 頁面載入或自動檢查 |
| 輸入/輸出 | input: 庫存資料 → output: 警示清單 |
| 使用元件 | Alert, Badge (shadcn UI) |
| 外部依賴 | /inventory |
| 狀態定義 | idle/alert |
| 回饋機制 | 顯示警示訊息 |

- **shadcn UI 元件建議**：Alert, Badge

---

## 8. Settings 設定 (`/settings`)

### 8.1 User Settings 用戶設定

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 用戶設定頁 User Settings || 使用情境 | 用戶管理個人資料、密碼、通知偏好 |
| 使用者角色 | 所有登入用戶 |
| 功能清單 | 編輯個人資料、變更密碼、通知偏好設定 |
| 資料來源 | /settings/profile, /settings/password, /settings/notifications |
| 元件拆解 | ProfileForm, PasswordForm, NotificationPrefPanel |
| 邊界情況處理 | API 失敗、儲存失敗 |
| 可互動元素 | 編輯欄位、儲存按鈕 |
| 權限控制 | 僅登入用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | ProfileForm 個人資料表單 |
| 描述 | 編輯用戶名稱、信箱、頭像等資料 |
| 觸發條件 | 點擊編輯或頁面載入 |
| 輸入/輸出 | input: 個人資料欄位 → output: 更新結果 |
| 使用元件 | Form, Input, Avatar, Button (shadcn UI) |
| 外部依賴 | /settings/profile |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 儲存成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Form, Input, Avatar, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | PasswordForm 密碼變更表單 |
| 描述 | 提供舊密碼、新密碼欄位與驗證 |
| 觸發條件 | 點擊變更密碼 |
| 輸入/輸出 | input: 舊密碼、新密碼 → output: 更新結果 |
| 使用元件 | Form, Input, Button, Alert (shadcn UI) |
| 外部依賴 | /settings/password |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 儲存成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Form, Input, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | NotificationPrefPanel 通知偏好面板 |
| 描述 | 設定用戶通知類型與頻率（如 Email、推播等） |
| 觸發條件 | 點擊通知偏好設定 |
| 輸入/輸出 | input: 通知選項、頻率 → output: 更新結果 |
| 使用元件 | Checkbox, Switch, Button, Alert (shadcn UI) |
| 外部依賴 | /settings/notifications |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 設定成功/失敗提示 |

- **shadcn UI 元件建議**：Checkbox, Switch, Button, Alert

---

### 8.2 Application Settings 應用程式設定

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 應用程式設定 Application Settings |
| 使用情境 | 管理員設定主題、語言、顯示偏好 |
| 使用者角色 | 管理員 |
| 功能清單 | 主題選擇、語言切換、顯示偏好設定 |
| 資料來源 | /settings/app |
| 元件拆解 | ThemeSelector, LanguageSelector, DisplayPrefPanel |
| 邊界情況處理 | API 失敗、儲存失敗 |
| 可互動元素 | 選擇器、儲存按鈕 |
| 權限控制 | 僅管理員可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | ThemeSelector 主題選擇器 |
| 描述 | 切換平台主題（深色/淺色） |
| 觸發條件 | 點擊選擇主題 |
| 輸入/輸出 | input: 主題選項 → output: 畫面主題 |
| 使用元件 | Select, Button (shadcn UI) |
| 外部依賴 | /settings/app |
| 狀態定義 | idle/selected |
| 回饋機制 | 切換後即時預覽 |

- **shadcn UI 元件建議**：Form, Input, Button, Alert, Progress

| 項目 | 說明 |
|---|---|
| 功能名稱 | LanguageSelector 語言選擇器 |
| 描述 | 切換平台語言 |
| 觸發條件 | 點擊選擇語言 |
| 輸入/輸出 | input: 語言選項 → output: 畫面語言 |
| 使用元件 | Select, Button (shadcn UI) |
| 外部依賴 | /settings/app |
| 狀態定義 | idle/selected |
| 回饋機制 | 切換後即時預覽 |

- **shadcn UI 元件建議**：Select, Button

| 項目 | 說明 |
|---|---|
| 功能名稱 | DisplayPrefPanel 顯示偏好面板 |
| 描述 | 設定平台顯示模式（如列表/卡片、密度、顏色偏好） |
| 觸發條件 | 點擊顯示偏好設定 |
| 輸入/輸出 | input: 顯示選項 → output: 畫面更新 |
| 使用元件 | RadioGroup, Switch, Button, Alert (shadcn UI) |
| 外部依賴 | /settings/app |
| 狀態定義 | idle/selected |
| 回饋機制 | 切換後即時預覽、設定成功提示 |

- **shadcn UI 元件建議**：RadioGroup, Switch, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | ExportPanel 匯出面板 |
| 描述 | 選擇匯出類型與條件，匯出報表 |
| 觸發條件 | 選擇類型、點擊匯出 |
| 輸入/輸出 | input: 匯出條件 → output: 檔案下載 |
| 使用元件 | Select, Button, Alert (shadcn UI) |
| 外部依賴 | /data/export |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 匯出成功/失敗提示 |

- **shadcn UI 元件建議**：Select, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | BackupScheduler 備份排程設定 |
| 描述 | 設定定期備份排程 |
| 觸發條件 | 設定/儲存排程 |
| 輸入/輸出 | input: 排程參數 → output: 設定結果 |
| 使用元件 | Form, Input, Button, Alert, Switch (shadcn UI) |
| 外部依賴 | /data/backup |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 設定成功/失敗提示 |

- **shadcn UI 元件建議**：Form, Input, Button, Alert, Switch

### 8.3 Localization 多語言與國際化

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 多語言與國際化設定 Localization |
| 使用情境 | 管理員設定支援語言、預設語言、翻譯管理 |
| 使用者角色 | 管理員 |
| 功能清單 | 語言開關、預設語言設定、翻譯內容管理 |
| 資料來源 | /settings/localization, /settings/translations |
| 元件拆解 | LanguageList, DefaultLanguageSelector, TranslationTable |
| 邊界情況處理 | API 失敗、儲存失敗 |
| 可互動元素 | 語言開關、預設語言選擇、翻譯編輯欄位 |
| 權限控制 | 僅管理員可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | LanguageList 語言列表 |
| 描述 | 顯示與管理所有支援語言 |
| 觸發條件 | 頁面載入、語言新增/刪除 |
| 輸入/輸出 | input: 語言資料 → output: 語言列表 |
| 使用元件 | List, Button, Switch (shadcn UI) |
| 外部依賴 | /settings/localization |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 操作成功/失敗提示 |

- **shadcn UI 元件建議**：List, Button, Switch, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | DefaultLanguageSelector 預設語言選擇器 |
| 描述 | 設定系統預設語言 |
| 觸發條件 | 選擇預設語言 |
| 輸入/輸出 | input: 語言選項 → output: 預設語言變更 |
| 使用元件 | Select, Button (shadcn UI) |
| 外部依賴 | /settings/localization |
| 狀態定義 | idle/selected |
| 回饋機制 | 切換後即時預覽 |

- **shadcn UI 元件建議**：Select, Button

| 項目 | 說明 |
|---|---|
| 功能名稱 | TranslationTable 翻譯內容表格 |
| 描述 | 編輯各語言的翻譯內容 |
| 觸發條件 | 選擇語言或搜尋關鍵字 |
| 輸入/輸出 | input: 關鍵字/翻譯內容 → output: 更新結果 |
| 使用元件 | Table, Input, Button, Alert (shadcn UI) |
| 外部依賴 | /settings/translations |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 儲存成功/失敗提示 |

- **shadcn UI 元件建議**：Table, Input, Button, Alert

### 8.4 User & Role Management 用戶與角色管理

#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 用戶與角色管理 User & Role Management |
| 使用情境 | 管理員管理平台用戶、分配角色與權限 |
| 使用者角色 | 管理員 |
| 功能清單 | 用戶列表、角色分配、權限管理、用戶新增/編輯/停用 |
| 資料來源 | /settings/users, /settings/roles |
| 元件拆解 | UserList, RoleSelector, PermissionPanel, UserForm |
| 邊界情況處理 | API 失敗、儲存失敗、權限不足 |
| 可互動元素 | 用戶操作按鈕、角色選擇、權限切換 |
| 權限控制 | 僅管理員可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | UserList 用戶列表 |
| 描述 | 顯示所有用戶資訊並可編輯/停用 |
| 觸發條件 | 頁面載入、用戶操作 |
| 輸入/輸出 | input: 用戶資料 → output: 用戶列表 |
| 使用元件 | Table, Button, Switch, Avatar, Alert (shadcn UI) |
| 外部依賴 | /settings/users |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 操作成功/失敗提示 |

- **shadcn UI 元件建議**：Table, Button, Switch, Avatar, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | RoleSelector 角色選擇器 |
| 描述 | 分配用戶角色 |
| 觸發條件 | 選擇角色 |
| 輸入/輸出 | input: 角色選項 → output: 角色變更 |
| 使用元件 | Select, Button (shadcn UI) |
| 外部依賴 | /settings/roles |
| 狀態定義 | idle/selected |
| 回饋機制 | 角色變更後即時反映 |

- **shadcn UI 元件建議**：Select, Button

| 項目 | 說明 |
|---|---|
| 功能名稱 | PermissionPanel 權限管理面板 |
| 描述 | 調整各角色權限 |
| 觸發條件 | 編輯角色權限 |
| 輸入/輸出 | input: 權限設定 → output: 權限變更 |
| 使用元件 | Checkbox, Button, Alert (shadcn UI) |
| 外部依賴 | /settings/roles |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 儲存成功/失敗提示 |

- **shadcn UI 元件建議**：Checkbox, Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | UserForm 用戶編輯表單 |
| 描述 | 新增或編輯用戶資訊 |
| 觸發條件 | 點擊新增/編輯用戶 |
| 輸入/輸出 | input: 用戶欄位 → output: 更新結果 |
| 使用元件 | Form, Input, Button, Alert (shadcn UI) |
| 外部依賴 | /settings/users |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 儲存成功/失敗提示 |

- **shadcn UI 元件建議**：Form, Input, Button, Alert

---

## 9. Analytics & Reports 分析報表

### 9.1 Sales Reports 銷售報表 (`/analytics/sales`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 銷售報表 Sales Reports |
| 使用情境 | 檢視各期間銷售表現、產品績效、營收追蹤 |
| 使用者角色 | 管理員、營運人員 |
| 功能清單 | 期間分析、產品表現、營收追蹤、圖表視覺化、匯出報表 |
| 資料來源 | /analytics/sales, /analytics/sales/export |
| 元件拆解 | SalesKpiCard, PeriodFilter, ProductPerformanceTable, RevenueChart, ExportButton |
| 邊界情況處理 | 無資料、API 失敗、匯出失敗 |
| 可互動元素 | 篩選器、匯出按鈕、產品點擊查看詳情 |
| 權限控制 | 僅授權用戶可檢視 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | SalesKpiCard 銷售指標卡片 |
| 描述 | 顯示 GMV、訂單數、平均客單等關鍵指標 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 指標數值 |
| 使用元件 | Card, Badge (shadcn UI) |
| 外部依賴 | /analytics/sales |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Card, Badge

| 項目 | 說明 |
|---|---|
| 功能名稱 | PeriodFilter 期間篩選器 |
| 描述 | 選擇日期區間過濾銷售資料 |
| 觸發條件 | 選擇日期後自動查詢 |
| 輸入/輸出 | input: 日期區間 → output: 篩選後資料 |
| 使用元件 | DatePicker, Button (shadcn UI) |
| 外部依賴 | - |
| 狀態定義 | idle/selected |
| 回饋機制 | 篩選後即時更新 |

- **shadcn UI 元件建議**：DatePicker, Button

| 項目 | 說明 |
|---|---|
| 功能名稱 | ProductPerformanceTable 產品績效表 |
| 描述 | 顯示各產品銷售數據與表現排名 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 產品數據列表 |
| 使用元件 | Table, Badge, Pagination (shadcn UI) |
| 外部依賴 | /analytics/sales |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Table, Badge, Pagination

| 項目 | 說明 |
|---|---|
| 功能名稱 | RevenueChart 營收趨勢圖表 |
| 描述 | 顯示營收變化趨勢與比較分析 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 圖表資料 |
| 使用元件 | Chart, Card (shadcn UI) |
| 外部依賴 | /analytics/sales |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Chart, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | ExportButton 匯出報表按鈕 |
| 描述 | 匯出目前篩選條件下的銷售報表 |
| 觸發條件 | 點擊匯出按鈕 |
| 輸入/輸出 | input: 篩選條件 → output: 檔案下載 |
| 使用元件 | Button, Alert (shadcn UI) |
| 外部依賴 | /analytics/sales/export |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 匯出成功/失敗提示 |

- **shadcn UI 元件建議**：Button, Alert

---

### 9.2 Customer Analysis 客戶分析 (`/analytics/customers`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 客戶分析 Customer Analysis |
| 使用情境 | 分析客戶分群、行為與價值，輔助行銷決策 |
| 使用者角色 | 管理員、行銷人員 |
| 功能清單 | RFM 分群、行為分析、客戶價值、圖表視覺化、匯出分析 |
| 資料來源 | /analytics/customers, /analytics/customers/export |
| 元件拆解 | RfmSegmentationChart, BehaviorChart, CustomerValueCard, FilterPanel, ExportButton |
| 邊界情況處理 | 無資料、API 失敗、匯出失敗 |
| 可互動元素 | 篩選器、匯出按鈕、分群點擊展開 |
| 權限控制 | 僅授權用戶可檢視 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | RfmSegmentationChart RFM 分群圖表 |
| 描述 | 顯示客戶 RFM 分數分布與分群標籤 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 分群圖表 |
| 使用元件 | Chart, Card (shadcn UI) |
| 外部依賴 | /analytics/customers |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Chart, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | BehaviorChart 行為分析圖表 |
| 描述 | 顯示客戶活躍度、購買頻率等行為指標 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 行為圖表 |
| 使用元件 | Chart, Card (shadcn UI) |
| 外部依賴 | /analytics/customers |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Chart, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | CustomerValueCard 客戶價值卡片 |
| 描述 | 顯示客戶 LTV、平均消費等價值指標 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 價值指標 |
| 使用元件 | Card, Badge (shadcn UI) |
| 外部依賴 | /analytics/customers |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Card, Badge

| 項目 | 說明 |
|---|---|
| 功能名稱 | FilterPanel 篩選面板 |
| 描述 | 提供多維度條件過濾分析資料 |
| 觸發條件 | 條件變更自動查詢 |
| 輸入/輸出 | input: 篩選條件 → output: 過濾後資料 |
| 使用元件 | Form, Select, Button (shadcn UI) |
| 外部依賴 | - |
| 狀態定義 | idle/selected |
| 回饋機制 | 篩選後即時更新 |

- **shadcn UI 元件建議**：Form, Select, Button

| 項目 | 說明 |
|---|---|
| 功能名稱 | ExportButton 匯出分析按鈕 |
| 描述 | 匯出目前篩選條件下的分析資料 |
| 觸發條件 | 點擊匯出按鈕 |
| 輸入/輸出 | input: 篩選條件 → output: 檔案下載 |
| 使用元件 | Button, Alert (shadcn UI) |
| 外部依賴 | /analytics/customers/export |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 匯出成功/失敗提示 |

- **shadcn UI 元件建議**：Button, Alert

---

### 9.3 Inventory Reports 庫存報表 (`/analytics/inventory`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 庫存報表 Inventory Reports |
| 使用情境 | 追蹤庫存變動、調整歷史、預測未來庫存需求 |
| 使用者角色 | 管理員、倉儲人員 |
| 功能清單 | 庫存變動、調整歷史、預測分析、圖表視覺化、匯出報表 |
| 資料來源 | /analytics/inventory, /analytics/inventory/export |
| 元件拆解 | StockMovementChart, AdjustmentHistoryTable, ForecastChart, FilterPanel, ExportButton |
| 邊界情況處理 | 無資料、API 失敗、匯出失敗 |
| 可互動元素 | 篩選器、匯出按鈕、調整詳情展開 |
| 權限控制 | 僅授權用戶可檢視 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | StockMovementChart 庫存變動圖表 |
| 描述 | 顯示庫存進出、異動趨勢 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 圖表資料 |
| 使用元件 | Chart, Card (shadcn UI) |
| 外部依賴 | /analytics/inventory |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Chart, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | AdjustmentHistoryTable 調整歷史表 |
| 描述 | 顯示所有庫存調整歷史紀錄 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 調整紀錄列表 |
| 使用元件 | Table, Badge, Pagination (shadcn UI) |
| 外部依賴 | /analytics/inventory |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Table, Badge, Pagination

| 項目 | 說明 |
|---|---|
| 功能名稱 | ForecastChart 庫存預測圖表 |
| 描述 | 預測未來庫存走勢與補貨需求 |
| 觸發條件 | 頁面載入或篩選條件變更 |
| 輸入/輸出 | input: 篩選條件 → output: 預測圖表 |
| 使用元件 | Chart, Card (shadcn UI) |
| 外部依賴 | /analytics/inventory |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading skeleton、錯誤提示 |

- **shadcn UI 元件建議**：Chart, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | FilterPanel 篩選面板 |
| 描述 | 提供多維度條件過濾報表資料 |
| 觸發條件 | 條件變更自動查詢 |
| 輸入/輸出 | input: 篩選條件 → output: 過濾後資料 |
| 使用元件 | Form, Select, Button (shadcn UI) |
| 外部依賴 | - |
| 狀態定義 | idle/selected |
| 回饋機制 | 篩選後即時更新 |

- **shadcn UI 元件建議**：Form, Select, Button

| 項目 | 說明 |
|---|---|
| 功能名稱 | ExportButton 匯出報表按鈕 |
| 描述 | 匯出目前篩選條件下的庫存報表 |
| 觸發條件 | 點擊匯出按鈕 |
| 輸入/輸出 | input: 篩選條件 → output: 檔案下載 |
| 使用元件 | Button, Alert (shadcn UI) |
| 外部依賴 | /analytics/inventory/export |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 匯出成功/失敗提示 |

- **shadcn UI 元件建議**：Button, Alert

---

## 12. Edge Cases 邊緣情境

### 12.1 Error Pages 錯誤頁面 (`/404`, `/403`, `/500`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 錯誤頁面 Error Pages |
| 使用情境 | 用戶遇到錯誤狀況時顯示 |
| 使用者角色 | 所有用戶 |
| 功能清單 | 404 頁面、403 頁面、500 頁面 |
| 資料來源 | 無 |
| 元件拆解 | ErrorMessage, ReturnButton |
| 邊界情況處理 | 無 |
| 可互動元素 | 返回首頁按鈕 |
| 權限控制 | 無 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | ErrorMessage 錯誤訊息元件 |
| 描述 | 顯示錯誤代碼與說明 |
| 觸發條件 | 導航至錯誤頁 |
| 輸入/輸出 | input: 錯誤代碼 → output: 訊息顯示 |
| 使用元件 | Alert, Card (shadcn UI) |
| 外部依賴 | 無 |
| 狀態定義 | idle |
| 回饋機制 | 顯示錯誤訊息 |

- **shadcn UI 元件建議**：Alert, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | ReturnButton 返回首頁按鈕 |
| 描述 | 導回首頁 |
| 觸發條件 | 點擊按鈕 |
| 輸入/輸出 | 無 |
| 使用元件 | Button (shadcn UI) |
| 外部依賴 | 無 |
| 狀態定義 | idle |
| 回饋機制 | 導航至首頁 |

- **shadcn UI 元件建議**：Button

---

### 12.2 System Status Pages 系統狀態頁 (`/maintenance`, `/503`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 系統狀態頁 System Status Pages |
| 使用情境 | 維護、服務不可用時顯示 |
| 使用者角色 | 所有用戶 |
| 功能清單 | 維護模式、服務不可用 |
| 資料來源 | 無 |
| 元件拆解 | StatusMessage, ReturnButton |
| 邊界情況處理 | 無 |
| 可互動元素 | 返回首頁按鈕 |
| 權限控制 | 無 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | StatusMessage 狀態訊息元件 |
| 描述 | 顯示維護/服務不可用訊息 |
| 觸發條件 | 導航至狀態頁 |
| 輸入/輸出 | input: 狀態類型 → output: 訊息顯示 |
| 使用元件 | Alert, Card (shadcn UI) |
| 外部依賴 | 無 |
| 狀態定義 | idle |
| 回饋機制 | 顯示狀態訊息 |

- **shadcn UI 元件建議**：Alert, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | ReturnButton 返回首頁按鈕 |
| 描述 | 導回首頁 |
| 觸發條件 | 點擊按鈕 |
| 輸入/輸出 | 無 |
| 使用元件 | Button (shadcn UI) |
| 外部依賴 | 無 |
| 狀態定義 | idle |
| 回饋機制 | 導航至首頁 |

- **shadcn UI 元件建議**：Button

---

### 12.3 Authentication Edge Cases 認證邊緣情境 (`/session-expired`, `/no-permission`, `/account-locked`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 認證異常頁 Authentication Edge Cases |
| 使用情境 | 會話過期、權限不足、帳戶鎖定時顯示 |
| 使用者角色 | 所有用戶 |
| 功能清單 | 會話過期、權限不足、帳戶鎖定 |
| 資料來源 | 無 |
| 元件拆解 | AuthErrorMessage, ReturnButton |
| 邊界情況處理 | 無 |
| 可互動元素 | 返回首頁按鈕 |
| 權限控制 | 無 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | AuthErrorMessage 認證錯誤訊息元件 |
| 描述 | 顯示認證相關錯誤訊息 |
| 觸發條件 | 導航至認證異常頁 |
| 輸入/輸出 | input: 錯誤類型 → output: 訊息顯示 |
| 使用元件 | Alert, Card (shadcn UI) |
| 外部依賴 | 無 |
| 狀態定義 | idle |
| 回饋機制 | 顯示錯誤訊息 |

- **shadcn UI 元件建議**：Alert, Card

| 項目 | 說明 |
|---|---|
| 功能名稱 | ReturnButton 返回首頁按鈕 |
| 描述 | 導回首頁 |
| 觸發條件 | 點擊按鈕 |
| 輸入/輸出 | 無 |
| 使用元件 | Button (shadcn UI) |
| 外部依賴 | 無 |
| 狀態定義 | idle |
| 回饋機制 | 導航至首頁 |

- **shadcn UI 元件建議**：Button

---
---


## 10. System Monitoring & Logs 系統監控與日誌

### 10.1 System Status 系統狀態 (`/system/status`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 系統狀態頁 System Status |
| 使用情境 | 管理員監控系統健康、效能、資源使用 |
| 使用者角色 | 管理員、技術人員 |
| 功能清單 | 系統健康狀態、效能監控、資源用量圖表 |
| 資料來源 | /system/status |
| 元件拆解 | StatusCard, ResourceChart, RefreshButton |
| 邊界情況處理 | API 錯誤顯示錯誤卡片 |
| 可互動元素 | 刷新按鈕 |
| 權限控制 | 僅授權用戶可檢視 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | StatusCard 狀態卡片 |
| 描述 | 顯示系統健康、CPU、記憶體、磁碟等狀態 |
| 觸發條件 | 頁面載入、手動刷新 |
| 輸入/輸出 | input: 狀態資料 → output: 狀態卡片顯示 |
| 使用元件 | Card, Badge, Progress (shadcn UI) |
| 外部依賴 | /system/status |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Card, Badge, Progress, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | ResourceChart 資源用量圖表 |
| 描述 | 顯示 CPU、記憶體、磁碟等資源用量時間序列圖 |
| 觸發條件 | 頁面載入、手動刷新 |
| 輸入/輸出 | input: 資源用量資料 → output: 圖表顯示 |
| 使用元件 | Chart, Card (shadcn UI) |
| 外部依賴 | /system/status |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Chart, Card, Skeleton, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | RefreshButton 刷新按鈕 |
| 描述 | 手動刷新系統狀態資料 |
| 觸發條件 | 點擊按鈕 |
| 輸入/輸出 | 無 |
| 使用元件 | Button (shadcn UI) |
| 外部依賴 | 無 |
| 狀態定義 | idle/loading |
| 回饋機制 | loading 顯示 spinner，完成後更新資料 |

- **shadcn UI 元件建議**：Button, Spinner

### 10.2 Operation Logs 操作日誌 (`/system/logs`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 操作日誌頁 Operation Logs |
| 使用情境 | 管理員查閱用戶操作紀錄、系統事件 |
| 使用者角色 | 管理員、技術人員 |
| 功能清單 | 查詢、篩選、分頁、查看詳細紀錄 |
| 資料來源 | /system/logs |
| 元件拆解 | LogTable, SearchBar, FilterPanel |
| 邊界情況處理 | 無資料顯示空狀態、API 錯誤顯示錯誤卡片 |
| 可互動元素 | 搜尋欄、篩選器、分頁器 |
| 權限控制 | 僅授權用戶可檢視 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | LogTable 日誌表格 |
| 描述 | 顯示操作日誌，支援篩選、分頁、詳細資訊展開 |
| 觸發條件 | 頁面載入、查詢、篩選、分頁 |
| 輸入/輸出 | input: 查詢條件 → output: 日誌資料列表 |
| 使用元件 | Table, Badge, Pagination (shadcn UI) |
| 外部依賴 | /system/logs |
| 狀態定義 | loading/success/error |
| 回饋機制 | loading 顯示 skeleton，錯誤顯示提示 |

- **shadcn UI 元件建議**：Table, Badge, Pagination, Skeleton, Alert

---

## 11. Data Management 資料管理

### 11.1 Data Import/Export 資料導入/導出 (`/data`)
#### Page Spec
| 項目 | 說明 |
|---|---|
| 頁面名稱 | 資料導入導出頁 Data Import/Export |
| 使用情境 | 管理員批量導入商品、匯出報表、設定備份 |
| 使用者角色 | 管理員 |
| 功能清單 | 批量導入商品、批量匯出報表、定期備份、格式轉換 |
| 資料來源 | /data/import, /data/export |
| 元件拆解 | ImportForm, ExportButton, BackupScheduleCard |
| 邊界情況處理 | 上傳失敗、匯出失敗、格式錯誤顯示提示 |
| 可互動元素 | 上傳按鈕、匯出按鈕、備份設定表單 |
| 權限控制 | 僅授權用戶可操作 |

#### 📦 Component Spec
| 項目 | 說明 |
|---|---|
| 功能名稱 | ImportForm 導入表單 |
| 描述 | 上傳商品資料檔案，支援格式驗證與進度顯示 |
| 觸發條件 | 點擊上傳按鈕 |
| 輸入/輸出 | input: 檔案 → output: 導入結果、進度條 |
| 使用元件 | Upload, Progress, Alert (shadcn UI) |
| 外部依賴 | /data/import |
| 狀態定義 | idle/uploading/success/error |
| 回饋機制 | 上傳成功顯示結果，錯誤顯示提示 |

- **shadcn UI 元件建議**：Upload, Progress, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | ExportButton 匯出按鈕 |
| 描述 | 一鍵匯出報表或資料備份 |
| 觸發條件 | 點擊匯出按鈕 |
| 輸入/輸出 | 無 |
| 使用元件 | Button, Alert (shadcn UI) |
| 外部依賴 | /data/export |
| 狀態定義 | idle/loading/success/error |
| 回饋機制 | 匯出成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Button, Alert

| 項目 | 說明 |
|---|---|
| 功能名稱 | BackupScheduleCard 備份排程卡片 |
| 描述 | 顯示與設定定期備份排程 |
| 觸發條件 | 頁面載入、設定變更 |
| 輸入/輸出 | input: 備份設定 → output: 當前排程顯示 |
| 使用元件 | Card, Form, Alert (shadcn UI) |
| 外部依賴 | /data/backup |
| 狀態定義 | idle/saving/success/error |
| 回饋機制 | 設定成功顯示提示，錯誤顯示警告 |

- **shadcn UI 元件建議**：Card, Form, Alert

---

## 全域錯誤處理情境總表 Global Error Handling Scenarios

以下列出本專案所有主要功能模組（含認證、資料管理、報表、設定等）可能遇到的錯誤處理情境，避免重複，並提供中英雙語說明：

### 1. 認證/Authentication
- 登入失敗：帳號或密碼錯誤，顯示錯誤提示。
  - Login failed: Invalid credentials, show error message.
- 註冊失敗：信箱已存在、密碼不符規則，顯示錯誤提示。
  - Registration failed: Email exists/password invalid, show error.
- 密碼重設失敗：信箱不存在或 token 失效，顯示提示。
  - Password reset failed: Email not found or token expired, show message.
- 會話過期：自動登出並導向登入頁。
  - Session expired: Auto logout and redirect to login.
- OAuth 流程錯誤：第三方登入異常，顯示錯誤訊息。
  - OAuth error: Third-party login failed, show error.
- 帳戶鎖定/停用：顯示帳戶異常提示。
  - Account locked/disabled: Show account status message.

### 2. 權限/Permissions
- 權限不足：顯示警告或導向無權限頁。
  - Insufficient permission: Show warning or redirect to no-access page.
- 非授權操作：按鈕禁用或隱藏。
  - Unauthorized action: Disable or hide button.

### 3. 資料操作/CRUD Operations
- API 請求失敗：顯示錯誤提示與重試選項。
  - API request failed: Show error and retry option.
- 無資料：顯示空狀態插畫與說明。
  - No data: Show empty state illustration and message.
- 資料驗證錯誤：表單即時顯示欄位錯誤。
  - Data validation error: Show field error instantly on form.
- 儲存失敗：顯示儲存錯誤訊息。
  - Save failed: Show error message.
- 刪除失敗：顯示刪除錯誤提示。
  - Delete failed: Show delete error message.
- 匯入/匯出失敗：顯示操作錯誤訊息。
  - Import/Export failed: Show operation error message.

### 4. 檔案/上傳/下載 File Upload/Download
- 上傳失敗：顯示上傳錯誤提示。
  - Upload failed: Show upload error message.
- 格式錯誤：顯示格式不符提示。
  - Invalid file format: Show format error message.
- 匯出失敗：顯示匯出錯誤訊息。
  - Export failed: Show export error message.

### 5. 網路/系統 Network/System
- 網路異常：顯示網路錯誤與重試建議。
  - Network error: Show network error and suggest retry.
- 系統維護/服務不可用：顯示維護/503 狀態頁。
  - System maintenance/unavailable: Show maintenance/503 page.
- 系統內部錯誤：顯示 500 錯誤頁或彈窗。
  - Internal server error: Show 500 error page or dialog.

### 6. UI/UX 回饋 UI/UX Feedback
- Loading 狀態：顯示 loading skeleton/spinner。
  - Loading: Show skeleton or spinner.
- 操作成功：顯示成功提示。
  - Success: Show success message.
- 操作取消：顯示取消提示。
  - Cancelled: Show cancelled message.

---

（如需擴充其他專案特有情境，請於此區塊補充）
