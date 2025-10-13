import { defineConfig } from "vitepress";
import { createSidebarConfig } from "./sidebar";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    server: {
      port: 8080,
    },
  },
  title: "電商儀表板文檔",
  description:
    "Vue.js 電商後台管理系統完整文檔 - 企業級分析平台，包含 Campaign 管理、四大分析系統、通知管理等完整功能",
  lang: "zh-TW",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首頁", link: "/" },
      { text: "文檔索引", link: "/documentation-index" },
      {
        text: "快速導航",
        items: [
          { text: "📋 專案規劃", link: "/01-planning/" },
          { text: "🔧 開發實作", link: "/02-development/" },
          { text: "🚀 部署運維", link: "/03-operations/" },
          { text: "📖 使用指南", link: "/04-guides/" },
          { text: "📚 參考資料", link: "/05-reference/" },
        ],
      },
    ],

    sidebar: createSidebarConfig(),

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/your-repo/ecommerce-dashboard",
      },
    ],

    // 搜尋功能
    search: {
      provider: "local",
      options: {
        locales: {
          "zh-TW": {
            translations: {
              button: {
                buttonText: "搜尋文檔",
                buttonAriaLabel: "搜尋文檔",
              },
              modal: {
                searchBox: {
                  resetButtonTitle: "清除查詢條件",
                  resetButtonAriaLabel: "清除查詢條件",
                  cancelButtonText: "取消",
                  cancelButtonAriaLabel: "取消",
                },
                startScreen: {
                  recentSearchesTitle: "搜尋歷史",
                  noRecentSearchesText: "沒有搜尋歷史",
                  saveRecentSearchButtonTitle: "儲存至搜尋歷史",
                  removeRecentSearchButtonTitle: "從搜尋歷史中移除",
                  favoriteSearchesTitle: "收藏",
                  removeFavoriteSearchButtonTitle: "從收藏中移除",
                },
                errorScreen: {
                  titleText: "無法獲取結果",
                  helpText: "你可能需要檢查你的網路連線",
                },
                footer: {
                  selectText: "選擇",
                  navigateText: "切換",
                  closeText: "關閉",
                  searchByText: "搜尋提供者",
                },
                noResultsScreen: {
                  noResultsText: "無法找到相關結果",
                  suggestedQueryText: "你可以嘗試查詢",
                  reportMissingResultsText: "你認為這個查詢應該有結果？",
                  reportMissingResultsLinkText: "點擊回饋",
                },
              },
            },
          },
        },
      },
    },

    // 文檔底部編輯連結
    editLink: {
      pattern:
        "https://github.com/your-repo/ecommerce-dashboard/edit/main/docs/:path",
      text: "在 GitHub 上編輯此頁",
    },

    // 上次更新時間
    lastUpdated: {
      text: "最後更新於",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "medium",
      },
    },

    // 頁面底部導航
    docFooter: {
      prev: "上一頁",
      next: "下一頁",
    },

    // outline 設定
    outline: {
      label: "頁面導航",
      level: [2, 4],
    },

    // 返回頂部
    returnToTopLabel: "返回頂部",

    // 側邊欄菜單標籤
    sidebarMenuLabel: "菜單",

    // 深色模式切換
    darkModeSwitchLabel: "主題",
    lightModeSwitchTitle: "切換到淺色模式",
    darkModeSwitchTitle: "切換到深色模式",
  },

  // 頁面 head 設定
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    [
      "meta",
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
    [
      "meta",
      {
        name: "keywords",
        content:
          "Vue.js, TypeScript, 電商, 儀表板, Analytics, Campaign, 分析平台, 企業級, 文檔",
      },
    ],
    [
      "meta",
      { property: "og:title", content: "電商儀表板文檔 - 企業級分析平台" },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Vue.js 電商後台管理系統完整文檔 - 企業級分析平台，包含 Campaign 管理、四大分析系統、通知管理等完整功能",
      },
    ],
    ["meta", { property: "og:type", content: "website" }],
  ],

  // markdown 設定
  markdown: {
    lineNumbers: true,
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },

  // 全站忽略配置（避免不必要的健檢報告）
  srcExclude: [
    // "**/scripts/**/*.sh", // 排除所有腳本檔案
    // "DOCUMENTATION_HEALTH_CHECK.md", // 如果要排除健檢報告（但建議保留）
  ],

  // 精細化失效連結忽略配置（VitePress 官方最佳實踐）
  ignoreDeadLinks: [
    // 忽略 localhost URL（開發文檔中的範例連結）
    /^https?:\/\/localhost/,

    // 忽略 127.0.0.1（Supabase 本地實例）
    /^https?:\/\/127\.0\.0\.1/,

    // 暫時忽略外部檔案引用（如 CLAUDE.local.md）
    /CLAUDE\.local/,

    // 忽略專案根目錄檔案引用（docs 外部檔案）
    /(\.\.\/)+(.*\.)?env/, // .env, .env.example, .env.production 等
    /(\.\.\/)+(.*\.)?toml/, // config.toml 等
    /(\.\.\/)+(.*\.)?vue/, // 所有 Vue 組件

    // 忽略所有 SQL 檔案（全面涵蓋：相對路徑、當前目錄、子目錄）
    /\.sql$/, // 所有 .sql 結尾檔案（如 ./schema.sql, ./emergency_template_unlock.sql）
    /(\.\.\/)+(.*\.)?sql/, // 相對路徑 SQL 檔案（如 ./../database/schema.sql）
    /sql\//, // 所有包含 sql 的目錄（如 notify-sql/, supabase/...sql）

    // 忽略 supabase 目錄檔案
    /supabase\//,

    // 忽略 src 目錄檔案（Vue 組件）
    /\/src\//,

    // 自訂函數：忽略看起來像目錄的路徑
    (url) => {
      // 排除 http/https 開頭的外部連結
      if (url.startsWith("http")) return false;

      // 如果路徑看起來像目錄且沒有副檔名，可能是合法的
      const hasExtension = /\.[a-z]+$/i.test(url);
      const endsWithSlash = url.endsWith("/");

      return !hasExtension || endsWithSlash;
    },
  ],
});
