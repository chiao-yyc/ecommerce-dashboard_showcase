# GCP Console 手動建置配置指引

## 問題說明

Docker 建置時需要環境變數（`VITE_*`），否則建置出的應用無法連接 Supabase。

## 解決方案：配置 Cloud Build 替代變數

### 方法 1：使用 cloudbuild.yaml（推薦）

在專案根目錄創建 `cloudbuild.yaml`：

```yaml
steps:
  # 建置 Docker 映像
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'admin-platform-vue/Dockerfile'
      - '--build-arg'
      - 'VITE_SUPABASE_URL=${_VITE_SUPABASE_URL}'
      - '--build-arg'
      - 'VITE_SUPABASE_ANON_KEY=${_VITE_SUPABASE_ANON_KEY}'
      - '--build-arg'
      - 'VITE_SUPABASE_BUCKET_NAME=${_VITE_SUPABASE_BUCKET_NAME}'
      - '--build-arg'
      - 'VITE_BASE_URL=${_VITE_BASE_URL}'
      - '--build-arg'
      - 'NODE_ENV=production'
      - '-t'
      - 'gcr.io/$PROJECT_ID/admin-vue:$COMMIT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/admin-vue:latest'
      - './admin-platform-vue'

  # 推送映像
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/admin-vue:$COMMIT_SHA']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/admin-vue:latest']

  # 部署到 Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'admin-vue'
      - '--image'
      - 'gcr.io/$PROJECT_ID/admin-vue:$COMMIT_SHA'
      - '--region'
      - 'asia-east1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

substitutions:
  _VITE_SUPABASE_URL: 'https://orqawopqwqmxyxlixqfv.supabase.co'
  _VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycWF3b3Bxd3FteHl4bGl4cWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDYxNDUsImV4cCI6MjA3NTEyMjE0NX0.gPApSjpiaomagJzegUQGxWtXH_N0tXEQvgg3HZRemtg'
  _VITE_SUPABASE_BUCKET_NAME: 'product-images'
  _VITE_BASE_URL: 'https://ecadmin.yachiaoyang.dev'

images:
  - 'gcr.io/$PROJECT_ID/admin-vue:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/admin-vue:latest'
```

**使用方式**：
1. 在 GCP Cloud Build 中選擇「Cloud Build 配置檔案」
2. 路徑輸入：`cloudbuild.yaml`
3. 點擊「建置」

---

### 方法 2：GCP Console 介面配置（不推薦）

**問題**：GCP Console 的「從來源建置」功能**無法**直接配置 Docker Build Args。

**限制**：
- 只能配置替代變數（substitutions）用於 Cloud Build 步驟
- 無法傳遞 Build Args 給 Dockerfile

**如果堅持使用 Console**：必須使用方法 1 的 cloudbuild.yaml

---

### 方法 3：使用 GitHub Actions（最推薦）

**優點**：
- ✅ 完全自動化
- ✅ 支援 Secrets 管理
- ✅ 每次 push 自動部署
- ✅ 已配置完成（`.github/workflows/deploy-cloud-run.yml`）

**設置步驟**：

1. **前往 GitHub Repository Settings → Secrets and variables → Actions**

2. **添加以下 Secrets**：
   ```
   GCP_PROJECT_ID = adept-eon-473905-v2
   GCP_SERVICE_ACCOUNT_KEY = <服務帳戶 JSON key>
   VITE_SUPABASE_URL = https://orqawopqwqmxyxlixqfv.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_BUCKET_NAME = product-images
   VITE_BASE_URL = https://ecadmin.yachiaoyang.dev
   ```

3. **Push 到 main 分支**：
   ```bash
   git push origin main
   ```

4. **自動部署**：GitHub Actions 自動建置並部署到 Cloud Run

---

## 立即修復當前錯誤

**步驟**：

1. **Commit 最新的 Dockerfile 修改**：
   ```bash
   git add admin-platform-vue/Dockerfile .github/workflows/deploy-cloud-run.yml
   git commit -m "fix: Add Docker build args for environment variables"
   git push origin main
   ```

2. **選擇部署方式**：
   - **方式 A**：創建 `cloudbuild.yaml` → GCP Console 手動建置
   - **方式 B**：設置 GitHub Secrets → 自動部署（推薦）

3. **驗證修復**：訪問部署的 URL，檢查 Console 是否還有錯誤

---

## 驗證環境變數

部署後，可以在瀏覽器 Console 執行：

```javascript
// 檢查環境變數是否正確載入
console.log(import.meta.env.VITE_SUPABASE_URL)
// 應該輸出: https://orqawopqwqmxyxlixqfv.supabase.co
```

如果輸出 `undefined`，表示環境變數未正確傳遞。
