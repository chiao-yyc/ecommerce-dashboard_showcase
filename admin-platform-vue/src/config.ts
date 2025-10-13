export const config = {
  // 第三方登入配置
  auth: {
    // 基礎 URL 優先使用環境變量
    baseUrl:
      import.meta.env.VITE_AUTH_BASE_URL || import.meta.env.VITE_BASE_URL || '',
    // 回調路徑
    callbackPath: import.meta.env.VITE_AUTH_CALLBACK_PATH || '/auth/callback',
    // 完整的回調 URL
    get callbackUrl() {
      // 如果設置了完整的回調 URL，則直接使用
      if (import.meta.env.VITE_AUTH_CALLBACK_URL) {
        return import.meta.env.VITE_AUTH_CALLBACK_URL
      }
      // 否則組合基礎 URL 和回調路徑
      return `${this.baseUrl}${this.callbackPath}`
    },
    // 重設密碼 URL
    get resetPasswordUrl() {
      // 優先使用完整 URL 環境變數（用於特殊架構需求）
      if (import.meta.env.VITE_AUTH_RESET_PASSWORD_URL) {
        return import.meta.env.VITE_AUTH_RESET_PASSWORD_URL
      }
      // 組合基礎 URL 和重設密碼路徑（與路由保持一致）
      return `${this.baseUrl}/auth/reset-password`
    },
  },
}
