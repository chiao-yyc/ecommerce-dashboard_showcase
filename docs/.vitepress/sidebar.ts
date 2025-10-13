// .vitepress/sidebar.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
}

/**
 * 計算目錄中的 Markdown 文檔數量（遞迴）
 */
function countMarkdownFiles(dir: string): number {
  try {
    const items = fs.readdirSync(dir);
    let count = 0;

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && item.endsWith(".md")) {
        count++;
      } else if (stat.isDirectory() && !item.startsWith(".")) {
        count += countMarkdownFiles(fullPath);
      }
    });

    return count;
  } catch (error) {
    return 0;
  }
}

/**
 * 轉換檔案名稱為友好的顯示名稱
 */
function formatFileName(filename: string): string {
  // 移除特殊前綴 (如 (note))
  let name = filename.replace(/^\([^)]+\)/, "");

  // 處理常見的檔名模式
  name = name
    .replace(/[-_]/g, " ") // 將破折號和底線轉為空格
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // 特殊處理
  const specialNames: { [key: string]: string } = {
    README: "概覽",
    Index: "首頁",
    Api: "API",
    Ui: "UI",
    Ux: "UX",
    Rls: "RLS",
    Sql: "SQL",
    Prd: "PRD",
    "Ci Cd": "CI/CD",
    "Chart Architecture": "圖表架構",
    "Realtime Migration": "即時功能遷移",
    "Api Design": "API 設計",
    "Component Map": "元件結構圖",
    "Data Flow": "資料流設計",
    "Supabase Api Endpoints": "Supabase API",
    "Dashboard Analysis": "儀表板分析",
    "Rls Policy": "RLS 安全政策",
    "Chart Visual Guidelines": "圖表視覺規範",
    "Onboarding Flow": "使用者導入流程",
    "React Appendix": "React 技術差異",
    "Feature Milestones": "功能里程碑",
    "Gantt Chart": "甘特圖規劃",
    "Notification System": "通知系統",
    "Notification System Complete Guide": "通知系統完整指南",
    "Notification System Architecture": "通知系統架構",
    "Notification Constraints": "通知系統約束",
    "Notification Development Guide": "通知開發指南",
    "Notification Rules": "通知規則",
    "Notification Setup": "通知設置",
    "Error Handling Guide": "錯誤處理指南",
    "Performance Testing": "壓力測試指南",
    "Load Testing Scenarios": "負載測試場景",
    "Performance Monitoring": "效能監控",
    "Campaign System": "Campaign 管理系統",
    "Analytics System": "Analytics 分析系統",
    Architecture: "系統架構",
    "System Architecture": "系統架構設計",
    "Database Design": "資料庫設計",
    "Api Reference": "API 參考",
    "Gcp Manual Build Guide": "GCP 手動建置指南",
    "React Vs Vue": "React vs Vue 對比",
  };

  return specialNames[name] || name;
}

/**
 * 轉換資料夾名稱為友好的顯示名稱
 * @param foldername 資料夾名稱
 * @param fullPath 完整路徑（可選，用於計算文檔數量）
 */
function formatFolderName(foldername: string, fullPath?: string): string {
  const folderNames: { [key: string]: string } = {
    "01-planning": "📋 專案規劃",
    "02-development": "🔧 開發實作",
    "03-operations": "🚀 部署運維",
    "04-guides": "📖 使用指南",
    "05-reference": "📚 參考資料",
    prd: "產品需求",
    "project-plan": "專案計劃",
    architecture: "系統架構",
    api: "API 服務",
    "auto-generated": "TypeDoc 自動生成",
    database: "資料庫",
    "notification-system": "通知系統",
    "sql-migrations": "SQL 遷移",
    components: "元件設計",
    design: "設計規範",
    deployment: "部署指南",
    testing: "測試策略",
    monitoring: "監控設定",
    "dev-notes": "開發筆記",
    "dev-guide": "開發指南",
    "user-guide": "使用者指南",
    "demo-tools": "演示工具",
    onboarding: "新手指南",
    "project-info": "專案資訊",
    "ai-collaboration": "AI 協作",
    standards: "開發標準",
    historical: "歷史參考",
    "mock-data-guide": "模擬資料",
    "testing-tools": "測試工具",
    modules: "核心業務模塊",
    campaign: "Campaign 行銷活動系統",
    analytics: "Analytics 分析系統",
    notification: "Notification 通知系統",
    "ai-system": "AI 系統開發",
    "analytics-guides": "分析系統開發指南",
    "performance-optimization": "效能優化與修復",
    "audit-reports": "稽核報告",
    "development-workflow": "開發工作流程",
    documentation: "文檔管理",
    "enhancement-plans": "功能增強計劃",
    // TypeDoc 生成的服務目錄
    AgentApiService: "Agent 管理",
    CampaignScoringApiService: "活動評分",
    CustomerAnalyticsZeroExpansionService: "客戶分析",
    CustomerSegmentationService: "客戶分群",
    GroupNotificationApiService: "群組通知",
    HolidayApiService: "假日管理",
    NotificationApiService: "通知 API",
    OrderAnalyticsService: "訂單分析",
    ProductAnalyticsService: "產品分析",
    SupportAnalyticsApiService: "客服分析",
    classes: "類別",
  };

  let displayName = folderNames[foldername] || formatFileName(foldername);

  // 為大型目錄添加文檔數量提示（超過 15 個文檔）
  if (fullPath) {
    const count = countMarkdownFiles(fullPath);
    if (count > 15) {
      displayName += ` (${count})`;
    }
  }

  return displayName;
}

/**
 * 遞迴處理目錄結構，支援巢狀資料夾
 * @param depth 當前目錄深度（0 為第一層）
 */
function getSidebarItemsRecursive(
  dir: string,
  basePath: string,
  depth: number = 0
): SidebarItem[] {
  try {
    const items = fs.readdirSync(dir);
    const files: SidebarItem[] = [];
    const folders: SidebarItem[] = [];

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && item.endsWith(".md")) {
        // 處理 Markdown 檔案
        const name = path.basename(item, ".md");
        const relativePath = path
          .relative(basePath, fullPath)
          .replace(/\\/g, "/");

        files.push({
          text: formatFileName(name),
          link: "/" + relativePath.replace(/\.md$/, ""),
        });
      } else if (stat.isDirectory() && !item.startsWith(".")) {
        // 處理子資料夾（排除隱藏目錄）
        const subItems = getSidebarItemsRecursive(fullPath, basePath, depth + 1);

        if (subItems.length > 0) {
          // 智能折疊策略：
          // - depth >= 2: 第三層及以上全部折疊
          // - subItems.length > 10: 超過 10 個子項目折疊
          // - 特殊目錄（dev-notes）預設折疊
          const shouldCollapse =
            depth >= 2 ||
            subItems.length > 10 ||
            item === "dev-notes";

          folders.push({
            text: formatFolderName(item, fullPath),
            items: subItems,
            collapsed: shouldCollapse,
          });
        }
      }
    });

    // 排序邏輯：README 優先，然後按檔名排序
    files.sort((a, b) => {
      if (a.text === "概覽") return -1;
      if (b.text === "概覽") return 1;
      if (a.text === "首頁") return -1;
      if (b.text === "首頁") return 1;
      return a.text.localeCompare(b.text);
    });

    folders.sort((a, b) => a.text.localeCompare(b.text));

    // 先顯示檔案，再顯示資料夾
    return [...files, ...folders];
  } catch (error) {
    console.warn(`無法讀取目錄 ${dir}:`, error);
    return [];
  }
}

/**
 * 生成完整的 sidebar 配置
 */
export function generateSidebar(): SidebarItem[] {
  const basePath = path.resolve(__dirname, "../");

  try {
    const items = fs.readdirSync(basePath);
    const sidebar: SidebarItem[] = [];

    // 處理根目錄的檔案
    const rootFiles: SidebarItem[] = [];

    items.forEach((item) => {
      const fullPath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && item.endsWith(".md")) {
        // 根目錄的 Markdown 檔案
        const name = path.basename(item, ".md");
        const displayName =
          name === "index"
            ? "首頁"
            : name === "documentation-index"
            ? "文檔索引"
            : formatFileName(name);

        rootFiles.push({
          text: displayName,
          link: name === "index" ? "/" : "/" + name,
        });
      } else if (stat.isDirectory() && !item.startsWith(".")) {
        // 處理資料夾
        const subItems = getSidebarItemsRecursive(fullPath, basePath, 0);

        if (subItems.length > 0) {
          sidebar.push({
            text: formatFolderName(item, fullPath),
            items: subItems,
            collapsed: false, // 主要分類預設展開
          });
        }
      }
    });

    // 根目錄檔案排序
    rootFiles.sort((a, b) => {
      if (a.text.includes("首頁")) return -1;
      if (b.text.includes("首頁")) return 1;
      if (a.text.includes("文檔索引")) return -2;
      if (b.text.includes("文檔索引")) return 2;
      return a.text.localeCompare(b.text);
    });

    // 如果有根目錄檔案，建立一個導航分組
    if (rootFiles.length > 0) {
      sidebar.unshift({
        text: "🧭 導航",
        items: rootFiles,
        collapsed: false,
      });
    }

    return sidebar;
  } catch (error) {
    console.error("生成 sidebar 失敗:", error);
    return [];
  }
}

/**
 * 生成 VitePress 的 sidebar 配置格式
 */
export function createSidebarConfig() {
  return {
    "/": generateSidebar(),
  };
}
