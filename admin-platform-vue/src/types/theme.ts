export interface ThemeConfig {
  name: string
  description: string
  features: string[]
  bestFor: string[]
  preview: string
  /**
   * 主題類別定義
   * - classic: 經典商業風格 (default, fluent)
   * - modern: 現代設計風格 (material, glassmorphism, synthwave-glow) 
   * - experimental: 實驗性主題 (預留)
   */
  category: 'classic' | 'modern' | 'experimental'
  tokens: Record<string, string>
  darkTokens?: Record<string, string>
  lightTokens?: Record<string, string>
  scssClasses?: string[]
  effects?: {
    animations?: boolean
    glowIntensity?: number
    neonColors?: string[]
    [key: string]: any
  }
}

/**
 * 主題類別類型定義
 * - classic: 經典商業風格，重視專業性和易讀性
 * - modern: 現代設計風格，追求簡潔和美觀（含發光效果）
 * - experimental: 實驗性主題，探索新的設計可能
 */
export type ThemeCategory = 'classic' | 'modern' | 'experimental'

export interface ThemeSelection {
  key: string
  config: ThemeConfig
}