/**
 * DataTable Meta 介面定義
 * 用於定義 DataTable 組件 meta 物件的類型結構
 */

// 基礎 DataTable Meta 介面
export interface BaseDataTableMeta {
  /** 當前選中的項目 IDs */
  selectedIds: string[]
  /** 當前排序欄位 */
  currentSortBy?: string
  /** 當前排序方向 */
  currentSortOrder?: 'asc' | 'desc'
  /** 變更選中項目的回調函數 */
  changeRowSelect: (ids: string[]) => void
}

// 通用行操作介面
export interface RowActionsMeta {
  /** 查看詳情 */
  viewDetail?: (id: string) => void
  /** 刪除項目 */
  deleteRow?: (id: string) => void
  /** 匯出詳情 */
  exportDetail?: (id: string) => void
  /** 編輯項目 */
  editRow?: (id: string) => void
}

// 批量操作介面
export interface BatchActionsMeta {
  /** 批量刪除 */
  batchDelete?: (ids: string[]) => void
  /** 批量匯出 */
  batchExport?: (data: {
    ids: string[]
    type: 'list' | 'detail'
    format?: 'csv' | 'xlsx' | 'json'
  }) => void
}

// 狀態相關操作介面
export interface StatusActionsMeta {
  /** 設定項目狀態 */
  setRowStatus?: (data: { id: string; status: any }) => void
  /** 批量更新狀態 */
  batchUpdateStatus?: (data: { ids: string[]; status: any }) => void
}

// 完整的 DataTable Meta 介面
export interface DataTableMeta extends
  BaseDataTableMeta,
  RowActionsMeta,
  BatchActionsMeta,
  StatusActionsMeta {
  // 可以在這裡添加其他通用欄位
}

// 產品專用的 Meta 介面
export interface ProductDataTableMeta extends Omit<DataTableMeta, 'setRowStatus'> {
  /** 設定產品庫存 */
  setRowStatus?: (data: { id: string; stock: number }) => void
  /** 快速設定庫存 */
  quickSetStock?: (data: { id: string; stock: number }) => void
  /** 查看產品詳情（產品專用） */
  viewProduct?: (id: string) => void
}

// 客戶專用的 Meta 介面
export interface CustomerDataTableMeta extends DataTableMeta {
  /** 設定客戶角色 */
  setRowRole?: (data: { id: string; role: string }) => void
  /** 批量更新角色 */
  batchUpdateRole?: (data: { ids: string[]; role: string }) => void
}

// 角色專用的 Meta 介面
export interface RoleDataTableMeta extends DataTableMeta {
  /** 設定用戶角色 */
  setRowRole?: (data: { id: string; role: string }) => void
  /** 批量更新用戶角色 */
  batchUpdateRole?: (data: { ids: string[]; role: string }) => void
}

// 訂單專用的 Meta 介面
export interface OrderDataTableMeta extends DataTableMeta {
  /** 設定訂單狀態 */
  setRowStatus?: (data: { id: string; status: string }) => void
  /** 批量更新訂單狀態 */
  batchUpdateStatus?: (data: { ids: string[]; status: string }) => void
}

// 工單專用的 Meta 介面
export interface TicketDataTableMeta extends DataTableMeta {
  /** 設定工單狀態 */
  setRowStatus?: (data: { id: string; status: string }) => void
  /** 設定工單優先級 */
  setRowPriority?: (data: { id: string; priority: string }) => void
}

// 匯出 Meta 類型聯合
export type AnyDataTableMeta =
  | DataTableMeta
  | ProductDataTableMeta
  | CustomerDataTableMeta
  | RoleDataTableMeta
  | OrderDataTableMeta
  | TicketDataTableMeta