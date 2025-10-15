# 通知系統部署指南

本文件提供 Vue 通知系統的完整部署指南，包括前端配置、後端設置、資料庫部署和監控配置。

## 目錄

1. [系統需求](#系統需求)
2. [環境配置](#環境配置)
3. [資料庫部署](#資料庫部署)
4. [前端部署](#前端部署)
5. [後端部署](#後端部署)
6. [監控配置](#監控配置)
7. [測試部署](#測試部署)
8. [故障排除](#故障排除)
9. [性能優化](#性能優化)
10. [安全配置](#安全配置)

## 系統需求

### 最低系統需求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **PostgreSQL**: >= 14.0 (推薦使用 Supabase)
- **Redis**: >= 6.0 (可選，用於快取)
- **記憶體**: >= 2GB RAM
- **磁碟空間**: >= 5GB

### 推薦系統需求

- **Node.js**: >= 20.0.0
- **PostgreSQL**: >= 15.0
- **Redis**: >= 7.0
- **記憶體**: >= 4GB RAM
- **磁碟空間**: >= 10GB
- **CPU**: 多核心處理器

## 環境配置

### 開發環境

```bash
# clone 倉庫
git clone <repository-url>
cd admin-platform-vue

# 安裝依賴
npm install

# 複製環境變數檔案
cp .env.example .env.local

# 配置環境變數
vim .env.local
```

### 環境變數配置

創建 `.env.local` 檔案：

```env
# 基本配置
NODE_ENV=development
VITE_APP_TITLE=通知系統管理平台
VITE_APP_VERSION=1.0.0

# API 配置
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 監控配置
VITE_ENABLE_MONITORING=true
VITE_LOG_LEVEL=debug
VITE_PERFORMANCE_MONITORING=true

# 通知配置
VITE_NOTIFICATION_REFRESH_INTERVAL=30000
VITE_MAX_NOTIFICATIONS_PER_PAGE=20
VITE_ENABLE_REAL_TIME_NOTIFICATIONS=true

# 安全配置
VITE_ENABLE_CSP=true
VITE_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 生產環境變數

```env
# 基本配置
NODE_ENV=production
VITE_APP_TITLE=通知系統管理平台
VITE_APP_VERSION=1.0.0

# API 配置
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 監控配置
VITE_ENABLE_MONITORING=true
VITE_LOG_LEVEL=info
VITE_PERFORMANCE_MONITORING=true

# 安全配置
VITE_ENABLE_CSP=true
VITE_CORS_ORIGINS=https://yourdomain.com
```

## 資料庫部署

### Supabase 設置

1. **創建 Supabase 專案**

```bash
# 使用 Supabase CLI
npx supabase init
npx supabase start
```

2. **執行資料庫遷移**

```bash
# 切換到 SQL 目錄
cd notify-sql

# 按順序執行 SQL 檔案
psql -h your-db-host -U postgres -d postgres -f 01_notifications_core_schema.sql
psql -h your-db-host -U postgres -d postgres -f 02_notifications_initial_data.sql
psql -h your-db-host -U postgres -d postgres -f 03_notifications_test_data.sql
psql -h your-db-host -U postgres -d postgres -f 04_notification_templates.sql
psql -h your-db-host -U postgres -d postgres -f 05_notification_categories.sql
psql -h your-db-host -U postgres -d postgres -f 06_notification_groups_schema.sql
psql -h your-db-host -U postgres -d postgres -f 07_notification_auto_triggers.sql
psql -h your-db-host -U postgres -d postgres -f 08_notification_preferences.sql
psql -h your-db-host -U postgres -d postgres -f 09_notification_completion_suggestions.sql
psql -h your-db-host -U postgres -d postgres -f 10_notification_rls_policies.sql
psql -h your-db-host -U postgres -d postgres -f 11_notification_indexes.sql
psql -h your-db-host -U postgres -d postgres -f 12_notification_functions.sql
psql -h your-db-host -U postgres -d postgres -f 13_notification_triggers.sql
psql -h your-db-host -U postgres -d postgres -f 14_notification_views.sql
psql -h your-db-host -U postgres -d postgres -f 15_notification_final_setup.sql
```

3. **驗證資料庫設置**

```sql
-- 檢查表格是否正確創建
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%notification%';

-- 檢查 RLS 政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE '%notification%';

-- 檢查索引
SELECT indexname, tablename FROM pg_indexes
WHERE tablename LIKE '%notification%';
```

### 資料庫優化配置

```sql
-- 設置適當的連接池大小
ALTER SYSTEM SET max_connections = '200';

-- 配置記憶體使用
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- 優化查詢性能
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';

-- 重新載入配置
SELECT pg_reload_conf();
```

## 前端部署

### 本地開發

```bash
# 啟動開發伺服器
npm run dev

# 或使用特定埠
npm run dev -- --port 5173
```

### 建置生產版本

```bash
# 建置應用程式
npm run build

# 預覽建置結果
npm run preview
```

### Docker 部署

創建 `Dockerfile`：

```dockerfile
# 多階段建置
FROM node:20-alpine AS builder

# 設置工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 建置應用程式
RUN npm run build

# 生產階段
FROM nginx:alpine

# 複製建置結果
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露埠號
EXPOSE 80

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]
```

創建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip 壓縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # 處理 SPA 路由
        location / {
            try_files $uri $uri/ /index.html;
        }

        # 快取靜態資源
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 安全標頭
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # CSP 標頭
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; font-src 'self';" always;
    }
}
```

### 使用 Docker Compose

創建 `docker-compose.yml`：

```yaml
version: "3.8"

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped
    networks:
      - notification-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - notification-network

volumes:
  redis_data:

networks:
  notification-network:
    driver: bridge
```

### Vercel 部署

創建 `vercel.json`：

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Netlify 部署

創建 `netlify.toml`：

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

## 後端部署

### API 伺服器配置

如果您有獨立的 API 伺服器，請確保以下配置：

```typescript
// express 伺服器配置範例
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// 安全中間件
app.use(helmet());

// CORS 配置
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],
    credentials: true,
  })
);

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制每個 IP 100 次請求
  message: "Too many requests from this IP",
});
app.use("/api/", limiter);

// 通知 API 路由
app.use("/api/notifications", notificationRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/groups", groupNotificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 監控配置

### 應用程式監控

1. **初始化監控系統**

```typescript
// 在 main.ts 中
import { initializeNotificationMonitoring } from "@/utils/monitoring";

// 初始化監控
initializeNotificationMonitoring();
```

2. **配置監控儀表板**

```vue
<!-- 在管理頁面中添加監控組件 -->
<template>
  <div>
    <NotificationMonitoringDashboard />
  </div>
</template>

<script setup>
import NotificationMonitoringDashboard from "@/components/notify/NotificationMonitoringDashboard.vue";
</script>
```

### 外部監控工具

#### Sentry 配置

```bash
npm install @sentry/vue @sentry/tracing
```

```typescript
// sentry.ts
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry(app: App) {
  Sentry.init({
    app,
    dsn: process.env.VITE_SENTRY_DSN,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      }),
    ],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}
```

#### LogRocket 配置

```bash
npm install logrocket logrocket-vuex
```

```typescript
// logrocket.ts
import LogRocket from "logrocket";
import createPlugin from "logrocket-vuex";

export function initLogRocket() {
  LogRocket.init(process.env.VITE_LOGROCKET_APP_ID);

  // 與 Pinia 整合
  const logRocketPlugin = createPlugin(LogRocket);
  return logRocketPlugin;
}
```

## 測試部署

### 單元測試

```bash
# 運行所有測試
npm run test

# 運行測試並產生覆蓋率報告
npm run test:coverage

# 監視模式運行測試
npm run test:watch
```

### 整合測試

```bash
# 運行整合測試
npm run test:integration

# 運行端到端測試
npm run test:e2e
```

### 性能測試

```bash
# 使用 Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# (進階選項)使用 WebPageTest
npm install -g webpagetest
webpagetest test https://your-domain.com
```

## 故障排除

### 常見問題

1. **通知不顯示**

```bash
# 檢查 Supabase 連接
curl -X GET "https://your-project.supabase.co/rest/v1/notifications" \
  -H "apikey: YOUR_ANON_KEY"

# 檢查 RLS 政策
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

2. **群組通知失敗**

```sql
-- 檢查用戶角色配置
SELECT u.id, u.email, ur.role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id;

-- 檢查通知模板
SELECT * FROM notification_templates WHERE is_active = true;
```

3. **性能問題**

```sql
-- 檢查慢查詢
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE query LIKE '%notification%'
ORDER BY mean_time DESC
LIMIT 10;

-- 檢查索引使用情況
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename LIKE '%notification%';
```

### 日誌收集

```bash
# 收集瀏覽器日誌
console.log(notificationLogger.getLogs())

# 收集監控指標
console.log(notificationMonitor.exportMetrics())

# 檢查網路請求
# 使用瀏覽器開發者工具的 Network 標籤
```

## 性能優化

### 前端優化

1. **代碼分割**

```typescript
// 動態導入組件
const NotificationList = defineAsyncComponent(
  () => import("@/components/notify/NotificationList.vue")
);
```

2. **快取策略**

```typescript
// 使用 Vue 快取
import { enableCache } from "@/utils/cache";

// 設置通知快取
const cachedNotifications = useCachedData("notifications", fetchNotifications, {
  ttl: 5 * 60 * 1000, // 5 分鐘
});
```

3. **圖片優化**

```vue
<!-- 使用 lazy loading -->
<img loading="lazy" :src="imageUrl" alt="notification" />

<!-- 使用 WebP 格式 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="notification">
</picture>
```

### 資料庫優化

```sql
-- 創建複合索引
CREATE INDEX CONCURRENTLY idx_notifications_user_status_created
ON notifications(user_id, status, created_at DESC);

-- 分區表（適用於大量資料）
CREATE TABLE notifications_2024 PARTITION OF notifications
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 定期清理舊資料
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND status IN ('read', 'archived');
END;
$$ LANGUAGE plpgsql;

-- 創建定時任務
SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');
```

## 安全配置

### 內容安全政策 (CSP)

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' https:;
  font-src 'self';
  frame-ancestors 'none';
"
/>
```

### 環境變數保護

```bash
# 使用環境變數管理敏感資訊
export SUPABASE_SERVICE_ROLE_KEY="your-secret-key"
export SENTRY_DSN="your-sentry-dsn"

# 在生產環境中使用密鑰管理服務
# AWS Secrets Manager, Azure Key Vault, etc.
```

### API 安全

```typescript
// 實作請求簽名驗證
import crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}
```

## 部署檢查清單

### 部署前檢查

- [ ] 所有環境變數都已正確配置
- [ ] 資料庫遷移已完成
- [ ] SSL 證書已配置
- [ ] 監控系統已設置
- [ ] 備份策略已實施
- [ ] 安全掃描已通過
- [ ] 性能測試已完成
- [ ] 錯誤處理已測試

### 部署後驗證

- [ ] 應用程式可正常訪問
- [ ] 所有功能都正常運作
- [ ] 通知系統正常發送
- [ ] 群組通知功能正常
- [ ] 監控指標正常收集
- [ ] 錯誤日誌正常記錄
- [ ] 備份系統正常運行
- [ ] 性能指標在可接受範圍內

## 維護和監控

### 定期維護任務

1. **每日任務**

   - 檢查錯誤日誌
   - 監控性能指標
   - 驗證備份完整性

2. **每週任務**

   - 更新安全補丁
   - 檢查磁碟空間
   - 分析用戶反饋

3. **每月任務**
   - 性能優化分析
   - 安全審計
   - 容量規劃評估

### 升級策略

```bash
# 滾動升級腳本
#!/bin/bash

# 1. 備份現有版本
kubectl create backup current-version

# 2. 部署新版本到測試環境
kubectl apply -f deployment-test.yaml

# 3. 運行煙霧測試
npm run test:smoke

# 4. 逐步部署到生產環境
kubectl set image deployment/notification-app app=new-version

# 5. 監控部署狀態
kubectl rollout status deployment/notification-app

# 6. 如果失敗，回滾
# kubectl rollout undo deployment/notification-app
```

## 支援和文件

### 技術支援

- **開發團隊聯絡方式**: dev-team@company.com
- **運維團隊聯絡方式**: ops-team@company.com
- **緊急聯絡方式**: emergency@company.com

### 相關文件

- [API 文件](./API.md)
- [資料庫架構](./DATABASE.md)
- [監控指南](./MONITORING.md)
- [故障排除指南](./TROUBLESHOOTING.md)

---

**注意**: 請根據您的具體環境和需求調整本部署指南。在生產環境部署前，請確保已充分測試所有配置和流程。
