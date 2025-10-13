#!/usr/bin/env node
/**
 * 文檔 Emoji 清理腳本 - 通用版
 * 功能：移除 Markdown 文檔章節標題中的 emoji
 *
 * 使用方式：
 * - 全面清理：node tools/clean-doc-emojis.js
 * - 指定目錄：node tools/clean-doc-emojis.js --dir=04-guides
 * - 指定 emoji：node tools/clean-doc-emojis.js --emojis="📊,📋,🎯"
 */

const fs = require('fs');
const path = require('path');

// 配置
const DOCS_ROOT = path.join(__dirname, '../docs');
const EXCLUDE_DIRS = ['node_modules', '.vitepress', 'future-features', 'scripts', 'auto-generated'];
const EXCLUDE_FILES = ['CHANGELOG.md'];

// 所有需要移除的章節 emoji（從最常用到最少用）
const ALL_HEADING_EMOJIS = [
  '📊', '🎯', '📋', '🔧', '🚀', '🏗️', '🏗', '📚', '⚠️', '⚠',
  '🔗', '📝', '🛠️', '🛠', '💡', '🎨', '🗄️', '🗄', '📅', '🗂️',
  '🗂', '🔒', '🔌', '🔔', '📄', '🤝', '🧩', '📡', '🌐', '💻',
  '🎪', '🎭', '🎬', '🎤', '🎧', '🎹', '🎸', '🎺', '🎻', '🥁'
];

// 保留的 emoji（有特殊意義的）
const PRESERVED_EMOJIS = ['⭐', '✅', '❌', '🆕', '🔴', '🟡', '🟢'];

// 統計資料
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  totalReplacements: 0,
  emojiCount: {},
  processedPaths: []
};

/**
 * 檢查是否應該處理此文件
 */
function shouldProcessFile(filePath) {
  const relativePath = path.relative(DOCS_ROOT, filePath);
  const basename = path.basename(filePath);

  // 排除特定文件
  if (EXCLUDE_FILES.includes(basename)) {
    return false;
  }

  // 排除特定目錄
  for (const excludeDir of EXCLUDE_DIRS) {
    if (relativePath.includes(excludeDir)) {
      return false;
    }
  }

  return true;
}

/**
 * 生成 emoji 替換正則表達式
 */
function createEmojiReplacements(emojisToRemove) {
  return emojisToRemove.map(emoji => ({
    emoji,
    // 匹配 ## emoji 或 ### emoji 等
    pattern: new RegExp(`^(#{2,6})\\s*${emoji}\\s+`, 'gm'),
    replacement: '$1 '
  }));
}

/**
 * 處理單個文件
 */
function processFile(filePath, emojiReplacements) {
  if (!shouldProcessFile(filePath)) {
    stats.skippedFiles++;
    return;
  }

  stats.totalFiles++;

  let content = fs.readFileSync(filePath, 'utf8');
  let fileReplacements = 0;
  let originalContent = content;

  // 執行所有 emoji 替換
  emojiReplacements.forEach(({ emoji, pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      const count = matches.length;
      fileReplacements += count;
      stats.emojiCount[emoji] = (stats.emojiCount[emoji] || 0) + count;
      content = content.replace(pattern, replacement);
    }
  });

  // 如果有變更，寫入文件
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    stats.processedFiles++;
    stats.totalReplacements += fileReplacements;
    stats.processedPaths.push({
      path: path.relative(DOCS_ROOT, filePath),
      replacements: fileReplacements
    });
  }
}

/**
 * 遞迴掃描目錄
 */
function scanDirectory(dir, emojiReplacements) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 檢查是否應該掃描此目錄
      const relativePath = path.relative(DOCS_ROOT, fullPath);
      const shouldScan = !EXCLUDE_DIRS.some(exclude =>
        relativePath.includes(exclude)
      );

      if (shouldScan) {
        scanDirectory(fullPath, emojiReplacements);
      }
    } else if (stat.isFile() && item.endsWith('.md')) {
      processFile(fullPath, emojiReplacements);
    }
  });
}

/**
 * 生成清理報告
 */
function generateReport() {
  console.log('\n📊 清理報告');
  console.log('='.repeat(60));
  console.log(`總掃描文件: ${stats.totalFiles}`);
  console.log(`已處理文件: ${stats.processedFiles}`);
  console.log(`跳過文件: ${stats.skippedFiles}`);
  console.log(`總移除 emoji 數: ${stats.totalReplacements}`);
  console.log('');

  // Emoji 移除統計
  const emojiEntries = Object.entries(stats.emojiCount)
    .sort((a, b) => b[1] - a[1]);

  if (emojiEntries.length > 0) {
    console.log('📋 Emoji 移除統計 (Top 10):');
    emojiEntries.slice(0, 10).forEach(([emoji, count]) => {
      console.log(`   ${emoji}  ${count} 次`);
    });
    console.log('');
  }

  // 處理文件列表（顯示前 20 個）
  if (stats.processedPaths.length > 0) {
    console.log('📝 處理的文件 (前 20 個):');
    stats.processedPaths.slice(0, 20).forEach(({ path, replacements }) => {
      console.log(`   ✓ ${path} (${replacements} 個 emoji)`);
    });

    if (stats.processedPaths.length > 20) {
      console.log(`   ... 還有 ${stats.processedPaths.length - 20} 個文件`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('✨ 清理完成！');
}

/**
 * 解析命令列參數
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    targetDir: DOCS_ROOT,
    emojis: ALL_HEADING_EMOJIS
  };

  args.forEach(arg => {
    if (arg.startsWith('--dir=')) {
      const dirName = arg.split('=')[1];
      config.targetDir = path.join(DOCS_ROOT, dirName);
    } else if (arg.startsWith('--emojis=')) {
      const emojiStr = arg.split('=')[1];
      config.emojis = emojiStr.split(',').map(e => e.trim());
    }
  });

  return config;
}

/**
 * 主函數
 */
function main() {
  console.log('🚀 開始清理文檔 emoji...\n');

  const config = parseArgs();

  console.log('📁 掃描目錄:', path.relative(process.cwd(), config.targetDir));
  console.log('🎯 移除 emoji 數量:', config.emojis.length);
  console.log('✨ 保留 emoji:', PRESERVED_EMOJIS.join(', '));
  console.log('');

  // 創建 emoji 替換規則
  const emojiReplacements = createEmojiReplacements(config.emojis);

  // 開始掃描
  if (fs.existsSync(config.targetDir)) {
    scanDirectory(config.targetDir, emojiReplacements);
    generateReport();
  } else {
    console.error(`❌ 錯誤: 目錄不存在 - ${config.targetDir}`);
    process.exit(1);
  }
}

main();
