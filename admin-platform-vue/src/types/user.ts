import type { BaseResponse, PaginationOptions } from '@/types/common'
// 使用者相關型別定義
import type {
  Provider as SupabaseProvider,
  AuthError,
} from '@supabase/supabase-js'

// auth users 模型
export interface AuthUser {
  id: string
  email: string
  lastSignInAt: string
  userMetadata: {
    avatarUrl: string
    email: string
    fullName: string
    name: string
  }
}

// 角色模型
export interface DbRole {
  id: number
  name: string // 例如 'customer', 'admin', 'staff' 等
  description?: string
}

export interface DbUser {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
  auth_user_id?: string
}

// 使用者狀態枚舉
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}

// 前端/UI 模型（使用 camelCase）
// 基本使用者介面
export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  authUserId?: string
  roles?: Role[]
  providers?: string[]
  status?: UserStatus
}

// 使用者預覽類型（用於列表顯示等）
export type UserPreview = Pick<User, 'id' | 'fullName' | 'email' | 'status'>

// 使用者詳細資訊（包含完整資料）
export type UserDetail = User & {
  roles: Role[]
  providers: string[]
  createdAt: string
  updatedAt: string
}

// 使用者簡要資訊（用於下拉選單等）
export type UserSummary = Pick<User, 'id' | 'fullName' | 'email'>

// 使用者個人資料更新請求
export type UserProfileUpdate = Pick<User, 'fullName' | 'phone' | 'avatarUrl'>

export interface Role {
  id: number
  name: string
  description?: string
  sort_order?: number
}

// 帶有詳細角色資訊的使用者
export interface DbUserDetail extends DbUser {
  roles?: Role[] // 完整角色物件列表
}

// 認證相關回應，與 Supabase Auth 回應結構一致
export interface AuthResponse extends BaseResponse<User> {
  session: Session | null
}

export interface OAuthResponse {
  provider: SupabaseProvider
  url: string | null
  error: AuthError | null
}

// 與 Supabase Auth session 結構一致
export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: User
}

// 取得使用者清單（可分頁、搜尋、排序）
export interface UsersPaginationOptions extends PaginationOptions {
  roleIds?: number[]
}
