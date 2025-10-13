export interface DbPermissionGroup {
  id: number
  name: string
  description?: string
  sort_order: number
  created_at: string
}

export interface PermissionGroup {
  id: number
  name: string
  description?: string
  sortOrder: number
  createdAt: string
}

export interface DbPermission {
  id: number
  group_id: number
  code: string
  name: string
  description?: string
  sort_order: number
  created_at: string
  // 擴展屬性，不在數據庫中
  group?: PermissionGroup
}

export interface Permission {
  id: number
  groupId: number
  code: string
  name: string
  description?: string
  sortOrder: number
  createdAt: string
  // 擴展屬性，不在數據庫中
  group?: PermissionGroup
}

export interface DbRolePermission {
  role_id: number
  permission_id: number
  created_at: string
}

export interface RolePermission {
  roleId: number
  permissionId: number
  createdAt: string
}

// 權限視圖接口
export interface DbRolePermissionView extends DbRolePermission {
  role_name: string
  permission_code: string
  permission_name: string
  group_id: number
  group_name: string
}

// 權限視圖接口
export interface RolePermissionView extends RolePermission {
  roleName: string
  permissionCode: string
  permissionName: string
  groupId: number
  groupName: string
}

// 用於權限矩陣顯示的結構
export interface PermissionMatrix {
  groups: PermissionGroupWithPermissions[]
  rolePermissions?: Record<number, number[]> // roleId -> permissionIds[]
}

export interface PermissionGroupWithPermissions extends PermissionGroup {
  permissions: Permission[]
}

export interface UserPermissionView {
  permissionId: number
  permissionCode: string
  permissionName: string
  groupId: number | null
  groupName: string | null
  fromRoles: string[]
}

export const ModulePermission = {
  CATEGORY: {
    CREATE: 'category.create',
    UPDATE: 'category.update',
    DELETE: 'category.delete',
  },
  PRODUCT: {
    CREATE: 'product.create',
    UPDATE: 'product.update',
    DELETE: 'product.delete',
  },
  CAMPAIGN: {
    CREATE: 'campaign.create',
    UPDATE: 'campaign.edit',
    DELETE: 'campaign.delete',
    ANALYTICS: 'campaign.analytics',
  },
  AI_PROVIDER: {
    CREATE: 'ai_provider.create',
    UPDATE: 'ai_provider.edit',
    DELETE: 'ai_provider.delete',
    TEST: 'ai_provider.test',
  },
  // ... 其他模組
} as const

export const ViewPermission = {
  CATEGORY: {
    _: 'category.view',
  },
  PRODUCT: {
    _: 'product.view',
  },
  ROLE: {
    _: 'role.view',
  },
  USER: {
    _: 'user.view',
  },
  PERMISSION: {
    _: 'permission.view',
  },
  INVENTORY: {
    _: 'inventory.view',
  },
  CUSTOMER: {
    _: 'customer.view',
  },
  SUPPORT: {
    _: 'support.tickets.view',
    TICKETS: 'support.tickets.view', // TICKETS: 'support.respond',
    MANAGE: 'support.tickets.manage', // MANAGE: 'support.assign',
    ANALYTICS: 'support.analytics',
  },
  ORDER: {
    _: 'order.view',
    ADD: 'order.create',
  },
  SETTING: {
    _: 'setting.view',
    ROLES: 'role.view',
    ROLE_USERS: 'role.user.manage', // ROLE_USERS: 'user.view',
    ROLE_PERMISSIONS: 'role.permission.manage', // ROLE_PERMISSIONS: 'permission.view',
    AI_PROVIDER: 'ai_provider.view',
  },
  NOTIFICATION: {
    _: 'notification.view',
    SEND: 'notification.send',
    MANAGE: 'notification.manage',
    MANAGE_TEMPLATES: 'notification.template.manage',
    GROUP_MANAGE: 'notification.group.manage',
  },
  HOLIDAY: {
    _: 'holiday.view',
  },
  CAMPAIGN: {
    _: 'campaign.view',
    CREATE: 'campaign.create',
    EDIT: 'campaign.edit',
    DELETE: 'campaign.delete',
    ANALYTICS: 'campaign.analytics',
  },
  ANALYTICS: {
    _: 'analytics.export', // 使用 export 作為基本權限，因為資料庫中沒有 analytics.view
    EXPORT: 'analytics.export',
    ADVANCED: 'analytics.advanced',
    REALTIME: 'analytics.realtime',
  },
  DASHBOARD: {
    _: 'dashboard.overview', // 使用 overview 作為基本權限，因為資料庫中沒有 dashboard.view
    OVERVIEW: 'dashboard.overview',
    EXECUTIVE: 'dashboard.executive',
    OPERATIONS: 'dashboard.operations',
    RISK: 'dashboard.risk',
    REVENUE: 'dashboard.revenue',
    CUSTOMER_VALUE: 'dashboard.customer_value',
    SUPPORT: 'dashboard.support',
  },
} as const
