# 專案架構與設計模式 (Architecture and Design Patterns)

## 1. 總體架構概覽

本專案採用現代前端應用程式的常見分層架構，旨在提高可維護性、可擴展性和可測試性。

-   **UI 層 (User Interface Layer):** 負責用戶介面的呈現和用戶互動。
    -   主要位於 `src/views` (頁面級組件) 和 `src/components` (可重用 UI 組件)。
-   **業務邏輯層 (Business Logic Layer):** 包含應用程式的核心業務規則和邏輯。
    -   主要位於 `src/composables` (可重用邏輯單元) 和部分 `src/store` (狀態管理中的業務邏輯)。
-   **數據訪問層 (Data Access Layer):** 負責與後端 API 或外部服務進行數據交互。
    -   主要位於 `src/api`。
-   **狀態管理層 (State Management Layer):** 集中管理應用程式的共享狀態。
    -   主要位於 `src/store` (使用 Pinia)。
-   **工具/通用層 (Utilities Layer):** 提供通用的輔助函數和工具。
    -   主要位於 `src/lib`。

## 2. 核心設計模式

### 2.1. 組件模式 (Component Pattern)

-   **原則:** 將 UI 拆分為獨立、可重用、高內聚、低耦合的組件。
-   **實踐:**
    -   單一檔案組件 (SFCs) 結構。
    -   透過 `props` 進行數據傳遞，`emit` 進行事件通訊。
    -   組件命名遵循 Vue 最佳實踐 (多詞命名)。
    -   UI 組件 (如 `src/components/ui`) 應盡可能通用和無狀態。

### 2.2. Composable 模式 (Composable Pattern)

-   **原則:** 提取和重用組件之間的狀態邏輯，提高邏輯的複用性和可測試性。
-   **實踐:**
    -   將與特定功能相關的響應式邏輯封裝在 `src/composables` 目錄下的函數中。
    -   Composables 應專注於單一職責。
    -   透過依賴注入 (Dependency Injection) 提高可測試性。

### 2.3. 狀態管理模式 (State Management Pattern - Pinia)

-   **原則:** 集中管理應用程式的共享狀態，使狀態變化可預測和追蹤。
-   **實踐:**
    -   使用 Pinia 作為狀態管理庫。
    -   每個功能模組應有其獨立的 Pinia Store (例如 `auth.ts`, `permission.ts`)。
    -   Store 應包含狀態 (state)、獲取器 (getters)、動作 (actions)。
    -   狀態持久化 (Persisted State) 應用於需要跨會話保留的數據。

### 2.4. 路由管理 (Routing Management)

-   **原則:** 清晰定義應用程式的導航結構和訪問控制。
-   **實踐:**
    -   使用 Vue Router 進行路由管理。
    -   路由守衛 (Navigation Guards) 用於認證和權限檢查。
    -   路由懶加載 (Lazy Loading) 用於優化初始載入性能。

## 3. 關注點分離 (Separation of Concerns)

-   **原則:** 每個模組、組件或函數應只負責單一的職責。
-   **實踐:**
    -   UI 邏輯、業務邏輯、數據訪問邏輯和狀態管理邏輯應明確分離到不同的檔案或目錄中。
    -   避免在組件中直接處理複雜的數據請求或業務邏輯。

## 4. 可測試性 (Testability)

-   **原則:** 設計程式碼時應考慮其易於測試。
-   **實踐:**
    -   使用 Vitest 進行單元測試。
    -   Composables 和 Store 應易於獨立測試。
    -   依賴注入有助於在測試中模擬外部依賴。

## 5. 未來考量

-   隨著專案的發展，可以考慮引入更複雜的設計模式（如策略模式、觀察者模式）來解決特定問題。
-   持續審查和重構程式碼，以確保架構和設計模式的持續適用性。
