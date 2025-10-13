/**
 * 標準 Supabase Mock 導出
 * 為了向後兼容性和統一命名，重新導出 supabaseMock 中的標準函數
 */

export { createStandardMockSupabase as createStandardSupabaseMock } from './supabaseMock'
export type { 
  MockSupabaseClient, 
  CreateMockSupabaseClientOptions,
  MockConfigurationOptions 
} from './supabaseMock'