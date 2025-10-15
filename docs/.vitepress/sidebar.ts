// .vitepress/sidebar.ts
// 面試展示版本 - 精簡 Sidebar 配置

import type { DefaultTheme } from "vitepress";

/**
 * 生成精簡的 sidebar 配置
 * 面試展示版本：只包含核心 30-40 個文件
 */
export function createSidebarConfig(): DefaultTheme.Config["sidebar"] {
  return {
    "/": [
      {
        text: "🏠 首頁",
        items: [
          { text: "專案首頁", link: "/" },
          { text: "快速導航", link: "/quick-navigation" },
        ],
      },
      {
        text: "💡 技術亮點",
        collapsed: false,
        items: [
          { text: "Realtime 連線問題修復", link: "/REALTIME_FIX_SUMMARY" },
          {
            text: "Auth User ID 防護機制",
            link: "/AUTH_USER_ID_DUPLICATE_PREVENTION_GUIDE",
          },
          { text: "RLS 安全稽核報告", link: "/RLS_AUDIT_SUMMARY" },
        ],
      },
      {
        text: "📋 01. 專案概覽",
        collapsed: false,
        items: [
          { text: "專案概覽", link: "/01-project/project-overview" },
          { text: "功能特性", link: "/01-project/features" },
          { text: "開發里程碑", link: "/01-project/milestones" },
          { text: "技術棧", link: "/01-project/tech-stack" },
        ],
      },
      {
        text: "🏗️ 02. 系統架構",
        collapsed: false,
        items: [
          {
            text: "系統架構設計",
            link: "/02-architecture/system-architecture",
          },
          { text: "資料庫設計", link: "/02-architecture/database-design" },
          { text: "API 設計", link: "/02-architecture/api-design" },
          { text: "RLS 安全策略", link: "/02-architecture/rls-security" },
          { text: "圖表架構", link: "/02-architecture/chart-architecture" },
          { text: "Realtime 系統", link: "/02-architecture/realtime-system" },
        ],
      },
      {
        text: "⭐ 03. 核心功能",
        collapsed: false,
        items: [
          {
            text: "Campaign 行銷活動",
            collapsed: false,
            items: [
              { text: "系統概覽", link: "/03-core-features/campaign/overview" },
              {
                text: "使用手冊",
                link: "/03-core-features/campaign/user-manual",
              },
              {
                text: "類型配置",
                link: "/03-core-features/campaign/type-config",
              },
              { text: "API 文件", link: "/03-core-features/campaign/api" },
            ],
          },
          {
            text: "Analytics 分析系統",
            collapsed: false,
            items: [
              {
                text: "服務概覽",
                link: "/03-core-features/analytics/services-overview",
              },
              {
                text: "訂單分析",
                link: "/03-core-features/analytics/order-analytics",
              },
              {
                text: "客戶分析",
                link: "/03-core-features/analytics/customer-analytics",
              },
              {
                text: "客服分析",
                link: "/03-core-features/analytics/support-analytics",
              },
            ],
          },
          {
            text: "Notification 通知系統",
            collapsed: false,
            items: [
              {
                text: "系統概覽",
                link: "/03-core-features/notification/overview",
              },
              {
                text: "架構設計",
                link: "/03-core-features/notification/architecture",
              },
              {
                text: "開發指南",
                link: "/03-core-features/notification/development-guide",
              },
              { text: "API 文件", link: "/03-core-features/notification/api" },
            ],
          },
          {
            text: "Business Health 監控",
            collapsed: false,
            items: [
              {
                text: "系統設計",
                link: "/03-core-features/business-health/system-design",
              },
              {
                text: "規則矩陣",
                link: "/03-core-features/business-health/rules-matrix",
              },
              {
                text: "API 文件",
                link: "/03-core-features/business-health/api",
              },
            ],
          },
        ],
      },
      {
        text: "📚 04. API 參考",
        collapsed: false,
        items: [
          {
            text: "Supabase 參考",
            link: "/04-api-reference/supabase-reference",
          },
          { text: "User API", link: "/04-api-reference/user-api" },
          { text: "Order API", link: "/04-api-reference/order-api" },
          { text: "Product API", link: "/04-api-reference/product-api" },
          { text: "Customer API", link: "/04-api-reference/customer-api" },
        ],
      },
      {
        text: "🚀 05. 部署指南",
        collapsed: false,
        items: [
          { text: "部署說明", link: "/05-deployment/DEPLOYMENT" },
          { text: "Docker 指南", link: "/05-deployment/docker-guide" },
          {
            text: "環境變數配置",
            link: "/05-deployment/environment-variables-guide",
          },
        ],
      },
    ],
  };
}
