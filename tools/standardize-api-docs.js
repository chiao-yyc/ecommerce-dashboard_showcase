#!/usr/bin/env node
/**
 * API 文檔標準化腳本
 * 功能：
 * 1. 移除過多的 emoji（保留 ⭐ 用於推薦方法）
 * 2. 統一標題格式
 * 3. 統一 metadata 區塊
 */

const fs = require('fs');
const path = require('path');

const API_DOCS_DIR = path.join(__dirname, '../docs/02-development/api');

// 定義需要處理的文件
const API_FILES = [
  'customer-api.md',
  'order-api.md',
  'product-api.md',
  'role-api.md',
  'user-api.md',
  'conversation-api.md',
  'campaign-api.md',
  'dashboard-api.md',
  'campaign-analytics-api.md',
  'business-health-analytics-api.md',
  'campaign-type-api.md',
  'inventory-operations.md',
  'notification-system.md'
];

// Emoji 映射（移除章節標題的 emoji）
const EMOJI_REPLACEMENTS = [
  // 移除章節 emoji
  { pattern: /^(##\s+)📋\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)🔌\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)📊\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)💡\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)⚠️\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)🔗\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)📝\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)🎯\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)🚀\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)🔒\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)📡\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)🔧\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)🤝\s+/gm, replacement: '$1' },
  { pattern: /^(##\s+)📚\s+/gm, replacement: '$1' },

  // 移除子標題 emoji
  { pattern: /^(###\s+)📋\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)🔌\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)📊\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)💡\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)⚠️\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)🔗\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)📝\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)🎯\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)🚀\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)🔒\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)📡\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)🔧\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)🤝\s+/gm, replacement: '$1' },
  { pattern: /^(###\s+)📚\s+/gm, replacement: '$1' }
];

// Metadata 標準化
function standardizeMetadata(content, filename) {
  // 提取標題
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (!titleMatch) return content;

  const title = titleMatch[1];
  const today = new Date().toISOString().split('T')[0];

  // 根據文件名判斷業務重要性
  const importanceMap = {
    'customer-api.md': '⭐⭐⭐⭐⭐ (核心業務)',
    'order-api.md': '⭐⭐⭐⭐⭐ (核心業務)',
    'product-api.md': '⭐⭐⭐⭐⭐ (核心業務)',
    'role-api.md': '⭐⭐⭐⭐ (權限系統核心)',
    'user-api.md': '⭐⭐⭐⭐ (權限系統核心)',
    'conversation-api.md': '⭐⭐⭐⭐ (客服系統核心)',
    'campaign-api.md': '⭐⭐⭐⭐ (行銷系統核心)',
    'dashboard-api.md': '⭐⭐⭐⭐⭐ (分析系統核心)',
    'campaign-analytics-api.md': '⭐⭐⭐ (分析系統)',
    'business-health-analytics-api.md': '⭐⭐⭐ (分析系統)',
    'campaign-type-api.md': '⭐⭐⭐ (配置管理)',
    'inventory-operations.md': '⭐⭐⭐ (庫存管理)',
    'notification-system.md': '⭐⭐⭐ (通知系統)'
  };

  const importance = importanceMap[filename] || '⭐⭐⭐';

  // 標準化的 metadata 區塊
  const standardMetadata = `# ${title}

> **最後更新**: ${today}
> **業務重要性**: ${importance}

---`;

  // 移除舊的 metadata（到第一個 ## 之前）
  const firstH2Index = content.indexOf('\n## ');
  if (firstH2Index === -1) return content;

  const contentWithoutOldMetadata = content.substring(firstH2Index);

  return standardMetadata + contentWithoutOldMetadata;
}

// 處理單個文件
function processFile(filename) {
  const filePath = path.join(API_DOCS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  跳過: ${filename} (檔案不存在)`);
    return;
  }

  console.log(`📝 處理: ${filename}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 標準化 metadata
  content = standardizeMetadata(content, filename);

  // 2. 移除 emoji
  EMOJI_REPLACEMENTS.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  // 3. 確保 "資料庫層 API 參考" 章節的格式一致（如果存在）
  content = content.replace(/^###\s+資料庫層\s+API\s+參考/gm, '### 資料庫層 API 參考');

  // 4. 移除引用區塊內的 emoji（保留 ✅）
  content = content.replace(/^>\s+💡\s+/gm, '> ');

  // 5. 保留 ⭐ 在方法標題中（推薦標記）- 這些不需要處理

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 完成: ${filename}`);
}

// 主函數
function main() {
  console.log('🚀 開始標準化 API 文檔...\n');

  API_FILES.forEach(processFile);

  console.log('\n✨ 所有文檔已標準化完成！');
  console.log('\n📊 處理統計:');
  console.log(`   - 處理文件數: ${API_FILES.length}`);
  console.log(`   - 移除的 emoji 類型: ${EMOJI_REPLACEMENTS.length}`);
  console.log(`   - 保留 ⭐ emoji 用於推薦方法標記`);
}

main();
