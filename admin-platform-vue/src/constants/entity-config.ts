import { EntityType } from '@/types/entityTypes'
import type { ModuleType } from '@/components/ui/module-badge'
import {
  ShoppingCart,
  Package,
  MessageCircle,
  Settings,
  User,
  Bell,
  type LucideIcon,
} from 'lucide-vue-next'

/**
 * 實體類型配置介面 - ModuleBadge 模式
 * 使用專屬模組色彩系統，提供更豐富的視覺識別
 */
export interface EntityTypeConfig {
  value: EntityType
  label: string
  description: string
  module: ModuleType
  icon: LucideIcon
}

/**
 * 實體類型配置定義 - ModuleBadge 模式
 * 每個實體類型對應專屬的模組色彩，提供清晰的視覺分類
 */
export const entityTypeConfigs: EntityTypeConfig[] = [
  {
    value: EntityType.SYSTEM,
    label: '系統相關',
    description: '系統層級的通知和事件',
    module: 'system',
    icon: Settings,
  },
  {
    value: EntityType.USER,
    label: '使用者相關',
    description: '使用者帳戶和權限相關',
    module: 'user',
    icon: User,
  },
  {
    value: EntityType.ORDER,
    label: '訂單相關',
    description: '訂單處理和狀態更新',
    module: 'order',
    icon: ShoppingCart,
  },
  {
    value: EntityType.PRODUCT,
    label: '商品相關',
    description: '商品管理和庫存異動',
    module: 'product',
    icon: Package,
  },
  {
    value: EntityType.CONVERSATION,
    label: '客服相關',
    description: '客戶服務對話和工單',
    module: 'conversation',
    icon: MessageCircle,
  },
  {
    value: EntityType.CUSTOMER,
    label: '客戶相關',
    description: '客戶資料和互動記錄',
    module: 'customer',
    icon: User,
  },
]

/**
 * 根據實體類型獲取配置
 * @param entityType - 實體類型
 * @returns 對應的實體類型配置
 */
export function getEntityTypeConfig(
  entityType: EntityType,
): EntityTypeConfig | undefined {
  return entityTypeConfigs.find((config) => config.value === entityType)
}

/**
 * 標準化實體類型處理
 * 將空值、null、undefined 統一轉換為 'system'
 */
export function normalizeEntityType(
  entityType: string | null | undefined,
): EntityType {
  if (!entityType || entityType.trim() === '') {
    return EntityType.SYSTEM
  }
  return entityType.trim() as EntityType
}

/**
 * 獲取實體類型標籤映射
 * @returns 實體類型值到標籤的映射
 */
export function getEntityTypeLabelsMap(): Record<EntityType, string> {
  return entityTypeConfigs.reduce(
    (acc, config) => ({
      ...acc,
      [config.value]: config.label,
    }),
    {} as Record<EntityType, string>,
  )
}

/**
 * 獲取實體類型的 ModuleBadge 屬性
 * @param entityType - 實體類型
 * @returns ModuleBadge 所需的屬性物件
 */
export function getEntityTypeModuleBadgeProps(
  entityType: string | null | undefined,
) {
  const normalizedType = normalizeEntityType(entityType)
  const config = getEntityTypeConfig(normalizedType)
  return config
    ? { module: config.module, icon: config.icon }
    : { module: 'system' as ModuleType, icon: Bell }
}

/**
 * 獲取實體類型的模組類型
 * @param entityType - 實體類型
 * @returns 對應的模組類型
 */
export function getEntityTypeModule(
  entityType: string | null | undefined,
): ModuleType {
  const normalizedType = normalizeEntityType(entityType)
  const config = getEntityTypeConfig(normalizedType)
  return config?.module || 'system'
}

/**
 * 獲取實體類型的圖示
 * @param entityType - 實體類型
 * @returns 對應的 Lucide 圖示組件
 */
export function getEntityTypeIcon(
  entityType: string | null | undefined,
): LucideIcon {
  const normalizedType = normalizeEntityType(entityType)
  const config = getEntityTypeConfig(normalizedType)
  return config?.icon || Bell
}

/**
 * 篩選器選項配置（用於 NotificationList.vue）
 * 保持向後兼容性的同時提供新的配置方式
 */
export const entityTypeFilterOptions = entityTypeConfigs.map((config) => ({
  label: config.label.replace('相關', ''),
  value: config.value,
  icon: config.icon,
}))

/**
 * 篩選邏輯：檢查實體類型是否匹配篩選條件
 * 特殊處理：當篩選 'system' 時，同時匹配空值和 'system'
 */
export function matchesEntityTypeFilter(
  notificationEntityType: string | null | undefined,
  filterEntityType: string,
): boolean {
  const normalizedNotificationType = normalizeEntityType(notificationEntityType)

  // 如果篩選條件是 system，則匹配所有空值和 system
  if (filterEntityType === EntityType.SYSTEM) {
    return (
      normalizedNotificationType === EntityType.SYSTEM ||
      !notificationEntityType ||
      notificationEntityType.trim() === ''
    )
  }

  // 其他情況直接比較標準化後的值
  return normalizedNotificationType === filterEntityType
}

/**
 * 檢查是否為有效的實體類型
 */
export function isValidEntityType(
  entityType: string,
): entityType is EntityType {
  return Object.values(EntityType).includes(entityType as EntityType)
}

/**
 * 獲取所有實體類型列表
 */
export function getAllEntityTypes(): EntityType[] {
  return Object.values(EntityType)
}
