# Supabase Storage 初始資料設定指南

## 概述

本指南說明如何在 Supabase Storage 中設定預設頭像等初始檔案，支援系統的檔案管理需求。

## Storage 檔案結構

### 建議的目錄結構
```
supabase/storage/
└── default_avatar/          # 預設頭像檔案
    ├── avatar01.jpg
    ├── avatar02.jpg
    ├── avatar03.jpg
    ├── ...
    └── avatar15.jpg
```

## ⚙️ 設定方法

### 1. 建立 Storage 目錄
```bash
# 在 supabase 目錄下創建 storage 資料夾
mkdir -p supabase/storage/default_avatar
```

### 2. 準備頭像檔案
將 15 個預設頭像檔案放置在 `supabase/storage/default_avatar/` 目錄中：
- 檔案命名：`avatar01.jpg` 到 `avatar15.jpg`
- 建議規格：正方形、200x200px、檔案大小 < 50KB
- 格式支援：JPG, PNG

### 3. 更新 config.toml 設定

在 `supabase/config.toml` 中取消註解並修改以下設定：

```toml
# Storage 設定
[storage]
enabled = true
file_size_limit = "50MiB"

# 預設頭像 bucket 設定
[storage.buckets.default_avatar]
public = true
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/jpg"]
objects_path = "./storage/default_avatar"
```

### 4. 執行自動上傳

**Development 環境**:
```bash
# 重置資料庫時會自動上傳檔案
supabase db reset

# 或單獨執行 Storage seed
npx supabase@beta seed buckets --linked
```

**Production 環境**:
```bash
# 在 CI/CD 管線中執行
npx supabase@beta seed buckets --linked
```

## 🔐 Storage Bucket 權限設定

### RLS 政策範例
```sql
-- 允許所有用戶讀取預設頭像
CREATE POLICY "Anyone can view default avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'default_avatar');

-- 允許認證用戶上傳自己的頭像
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user_avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 使用方式

### 1. 在資料庫中參考檔案
種子資料中已包含對應的檔案路徑：
```sql
-- seed-core.sql 中已包含
INSERT INTO default_avatars (id, file_path) VALUES
  (1, 'default_avatar/avatar01.jpg'),
  (2, 'default_avatar/avatar02.jpg'),
  -- ...
```

### 2. 在前端應用中使用
```javascript
// 取得 Storage URL
import { supabase } from '@/lib/supabase'

const getAvatarUrl = (filePath) => {
  const { data } = supabase.storage
    .from('default_avatar')
    .getPublicUrl(filePath)
  return data.publicUrl
}

// 使用範例
const avatarUrl = getAvatarUrl('avatar01.jpg')
```

### 3. 用戶註冊時隨機分配
系統會自動從 `default_avatars` 表中隨機選擇：
```sql
-- 已在 get_random_avatar_path() 函數中實現
SELECT file_path FROM default_avatars ORDER BY random() LIMIT 1;
```

## 🚨 注意事項

### 檔案管理
1. **檔案大小**: 建議每個頭像檔案 < 50KB，避免影響載入速度
2. **版本控制**: 不建議將大型圖片檔案納入 Git 版本控制
3. **CDN 支援**: Supabase Storage 已整合 CDN，無需額外設定

### 部署考量
1. **環境區分**: 開發和生產環境使用不同的 Storage bucket
2. **權限設定**: 確保 bucket 權限設定符合安全要求
3. **備份策略**: 重要檔案應納入備份計劃

### 效能優化
1. **圖片壓縮**: 上傳前先進行適當的圖片壓縮
2. **快取設定**: 設定適當的 HTTP 快取標頭
3. **載入策略**: 使用懶載入或預載入策略

## 相關資源

- [Supabase Storage 官方文檔](https://supabase.com/docs/guides/storage)
- [種子資料管理指南](seed-data-management.md)
- [設定檔案說明](../../03-operations/deployment/supabase-integration.md)