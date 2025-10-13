/**
 * 實體類型基礎定義
 * 遵循階層式組織原則：types → constants → components
 *
 * 此檔案僅包含純類型定義，UI 配置請參考 @/constants/entity-config.ts
 */

/**
 * 實體類型枚舉定義
 * 通知系統中使用的所有實體類型
 */
export enum EntityType {
  SYSTEM = 'system',
  USER = 'user',
  ORDER = 'order',
  PRODUCT = 'product',
  CONVERSATION = 'conversation',
  CUSTOMER = 'customer',
  // 預留給未來擴展使用
  // FINANCE = 'finance',
  // SECURITY = 'security',
  // ANALYTICS = 'analytics',
  // MARKETING = 'marketing',
}
