# Styles (樣式系統)

此目錄包含完整的 Tailwind CSS 配置和自定義樣式系統。

## 📁 目錄結構

```
styles/
├── tailwind.css        # Tailwind 基礎配置
├── animations.scss     # 自定義動畫
├── components/         # 組件專用樣式
├── utilities/          # 工具類樣式
└── themes/            # 主題變數
```

## 🎨 技術棧

### Tailwind CSS
- **版本**: ^3.4
- **JIT 模式**: 即時編譯，極小的 bundle size
- **自定義配置**: 企業級色彩系統、間距、斷點

### SCSS/SASS
- **模組化**: 使用 `@use` 和 `@forward` 組織樣式
- **變數**: CSS 自定義屬性 + SCSS 變數混合使用
- **Mixins**: 可重用的樣式模式

## 🎯 核心特性

### 1. 響應式設計系統
```scss
// breakpoints.scss
$breakpoints: (
  'sm': 640px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1280px,
  '2xl': 1536px
);

@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

### 2. 主題系統
```css
/* themes/default.css */
:root {
  /* Brand Colors */
  --color-primary: 220 70% 50%;
  --color-secondary: 150 60% 50%;

  /* Semantic Colors */
  --color-success: 142 71% 45%;
  --color-warning: 38 92% 50%;
  --color-error: 0 84% 60%;
  --color-info: 199 89% 48%;

  /* Neutral Scale */
  --color-background: 0 0% 100%;
  --color-foreground: 222 47% 11%;
  --color-muted: 210 40% 96%;
}

[data-theme="dark"] {
  --color-background: 222 47% 11%;
  --color-foreground: 0 0% 100%;
  /* ... 深色模式變數 */
}
```

### 3. 動畫系統
```scss
// animations.scss
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

### 4. 組件樣式組織
```
components/
├── button.scss         # 按鈕樣式變體
├── card.scss          # 卡片容器樣式
├── data-table.scss    # 表格專用樣式
├── form.scss          # 表單元素樣式
└── chart.scss         # 圖表容器樣式
```

## 🔧 Tailwind 配置亮點

### 自定義色彩系統
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary))',
        success: 'hsl(var(--color-success))',
        // ... 語義化色彩
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        // 擴展間距尺度
      }
    }
  }
}
```

### 自定義工具類
```css
/* utilities/custom.css */
.text-balance {
  text-wrap: balance;
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--color-muted) transparent;
}
```

## 📊 性能優化

### Tailwind JIT 優勢
- **極小 bundle size**: 只包含使用的 class
- **快速編譯**: 即時生成需要的樣式
- **動態值支援**: `w-[137px]` 動態尺寸

### CSS 模組化策略
```scss
// 使用 @layer 組織樣式優先級
@layer base {
  h1 { @apply text-2xl font-bold; }
}

@layer components {
  .btn { @apply px-4 py-2 rounded; }
}

@layer utilities {
  .text-shadow { text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
}
```

## 🎨 設計系統一致性

### 間距尺度
- 使用 Tailwind 的 4px 基準間距系統
- `space-y-4` (16px), `gap-6` (24px)

### 字體系統
```css
.text-xs    { font-size: 0.75rem; }   /* 12px */
.text-sm    { font-size: 0.875rem; }  /* 14px */
.text-base  { font-size: 1rem; }      /* 16px */
.text-lg    { font-size: 1.125rem; }  /* 18px */
.text-xl    { font-size: 1.25rem; }   /* 20px */
```

### 陰影系統
```css
.shadow-sm  { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow     { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
.shadow-md  { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.shadow-lg  { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
```

## 🔍 Demo 展示重點

- ✅ Tailwind JIT 模式配置與優化
- ✅ CSS 自定義屬性主題系統
- ✅ SCSS 模組化架構
- ✅ 響應式設計模式
- ✅ 動畫與過渡效果
- ✅ 設計系統一致性管理
