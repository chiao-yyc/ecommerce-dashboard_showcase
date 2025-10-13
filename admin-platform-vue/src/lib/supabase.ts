import { createClient } from '@supabase/supabase-js'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Lib', 'Supabase')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// 註: Supabase 效能監控透過 Fetch API 攔截器自動處理
// 不需要額外包裝客戶端，避免查詢鏈中斷問題

// 使用環境變數配置，提供預設值作為備援
const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'ecommerce-dashboard'

export async function getSignedUrl(filePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      log.error('Error creating signed URL', { error })
      return ''
    }

    return data?.signedUrl ?? ''
  } catch (error) {
    log.error('Error creating signed URL', { error })
    return ''
  }
}

// 向後兼容保留舊函數，但標記為 deprecated
/** @deprecated Use getSignedUrl instead for private buckets */
export function getPublicUrl(filePath: string) {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
  return data?.publicUrl ?? ''
}

export async function transUrl(url: string | null | undefined): Promise<string> {
  if (!url) return ''

  // 如果已經是完整 URL，直接返回
  if (url.startsWith('http')) return url

  // 否則生成 signed URL
  return await getSignedUrl(url)
}
