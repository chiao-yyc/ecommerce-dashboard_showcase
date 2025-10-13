---
outline: deep
---

# Runtime API 範例

> 📘 **VitePress 官方範例** - 展示 VitePress Runtime API 的使用方式
>
> - **文檔性質**: VitePress 框架參考範例
> - **技術框架**: VitePress
> - **語言**: 保留原始英文內容以符合官方文檔

## 概述

本頁面展示 VitePress 提供的部分 Runtime API 使用方式。

主要的 `useData()` API 可用於訪問當前頁面的 site、theme 和 page 數據。它可以在 `.md` 和 `.vue` 文件中使用：

```md
<script setup>
import { useData } from 'vitepress'

const { theme, page, frontmatter } = useData()
</script>

## Results

### Theme Data
<pre>{{ theme }}</pre>

### Page Data
<pre>{{ page }}</pre>

### Page Frontmatter
<pre>{{ frontmatter }}</pre>
```

<script setup>
import { useData } from 'vitepress'

const { site, theme, page, frontmatter } = useData()
</script>

## Results

### Theme Data
<pre>{{ theme }}</pre>

### Page Data
<pre>{{ page }}</pre>

### Page Frontmatter
<pre>{{ frontmatter }}</pre>

## More

Check out the documentation for the [full list of runtime APIs](https://vitepress.dev/reference/runtime-api#usedata).
