import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer' // 引入 visualizer

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // 修改為函數形式以獲取 mode
  plugins: [
    vue(),
    tailwindcss(),
    mode === 'production' &&
      visualizer({
        open: true, // 自動在瀏覽器中打開報告
        filename: 'dist/bundle-analyzer.html', // 報告檔案名稱
      }),
  ].filter(Boolean), // 過濾掉 false 值
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist', // 確保輸出到 dist
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 手動 chunk 分割策略
        manualChunks(id) {
          // 核心 Vue 生態系統
          if (id.includes('vue') && (id.includes('/vue/') || id.includes('/vue-router/'))) {
            return 'vue-vendor'
          }
          
          // Pinia 狀態管理
          if (id.includes('pinia')) {
            return 'pinia'
          }
          
          // Supabase 相關
          if (id.includes('@supabase/')) {
            return 'supabase'
          }
          
          // 圖表庫
          if (id.includes('@unovis/')) {
            return 'charts'
          }
          
          // 查詢管理
          if (id.includes('@tanstack/vue-query') || id.includes('@tanstack/query-core')) {
            return 'query'
          }
          
          // 表格
          if (id.includes('@tanstack/vue-table')) {
            return 'table'
          }
          
          // Lodash 工具庫 (獨立 chunk)
          if (id.includes('lodash-es')) {
            return 'lodash'
          }
          
          // 其他工具庫
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('date-fns') || 
              id.includes('zod') || id.includes('class-variance-authority')) {
            return 'utilities'
          }
          
          // 圖標
          if (id.includes('lucide-vue-next')) {
            return 'icons'
          }
          
          // 國際化
          if (id.includes('vue-i18n')) {
            return 'i18n'
          }
          
          // 分析相關組件 (較大的業務組件群)
          if (id.includes('src/views') && (
            id.includes('Analytics') || 
            id.includes('Dashboard')
          )) {
            return 'analytics-views'
          }
          
          // 通用組件
          if (id.includes('src/components/ui/')) {
            return 'ui-components'
          }

          // API 服務層：移除獨立分割，避免循環依賴和模組初始化問題
          // 讓 API 服務與其他業務邏輯一起打包，減少跨 chunk 依賴
          // if (id.includes('src/api/services/')) {
          //   return 'api-services'
          // }

          // 導出相關依賴（移除 XLSX，保留 file-saver 和 papaparse）
          if (id.includes('file-saver') || id.includes('papaparse')) {
            return 'export-libs'
          }
          
          // 圖表相關大型依賴
          if (id.includes('d3-') || id.includes('three') || id.includes('leaflet') || 
              id.includes('maplibre') || id.includes('robust-predicates')) {
            return 'chart-deps'
          }
          
          // 大型第三方庫的通用處理
          if (id.includes('node_modules') && id.split('/').length > 3) {
            const packageName = id.split('node_modules/')[1].split('/')[0]
            if (packageName.startsWith('@')) {
              const fullPackageName = id.split('node_modules/')[1].split('/').slice(0, 2).join('/')
              return `vendor-${fullPackageName.replace('@', '').replace('/', '-')}`
            }
            return `vendor-${packageName}`
          }
        },
      },
    },
    // 設定 chunk 大小警告限制 (1MB)
    chunkSizeWarningLimit: 1000,
    // 優化相關設定
    reportCompressedSize: true,
    sourcemap: mode === 'development',
  },
}))
