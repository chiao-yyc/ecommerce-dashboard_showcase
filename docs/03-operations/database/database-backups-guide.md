# 歷史備份

本目錄包含系統的歷史備份文件。

## 💾 備份列表

- **[pre-jsonb-migration.sql](pre-jsonb-migration.sql)** - JSONB 遷移前的完整資料庫備份

## 使用說明

### 恢復歷史資料
```bash
# 使用 psql 恢復
psql -h localhost -p 54322 -U postgres -d postgres -f docs/backups/pre-jsonb-migration.sql

# 或在 Supabase Studio 中執行
```

## 注意事項

- 這些備份文件是特定時間點的快照
- 恢復前請確保了解備份的時間和狀態
- 建議在測試環境中先行驗證
- 恢復操作會覆蓋現有資料，請謹慎操作

## 備份資訊

| 備份文件 | 備份時間 | 描述 |
|---------|---------|------|
| pre-jsonb-migration.sql | 2025-07-13 | JSONB 系統遷移前的完整資料庫狀態 |