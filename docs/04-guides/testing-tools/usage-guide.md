# Demo Tools 使用指南

本專案提供兩大 Demo 輔助：

1. **🛠 Generate Test Data**  
2. **🎓 Onboarding Tour**

---

## 1. 產生假資料按鈕

- 位置：Dashboard 右上 `DevTools` Dropdown  
- 權限：`admin` 角色可見  
- 行為：
  1. 點擊後彈出確認 Dialog
  2. 執行 `generateAll()`，插入 Users→Products→Orders→Messages
  3. Toast 顯示「已建立 390 筆測試資料」

<!-- ![button](../04-uiux/wireframes/generate-data-btn.png) -->

### 注意事項
- 在 **Production** 環境自動隱藏
- `is_test_data=true` 以便 `truncate` 清除
- 產生過程出錯會 Rollback 並顯示 error toast

---

## 2. Onboarding Tour

- 觸發：首次登入或在 `Settings → Onboarding`  
- 步驟：Welcome → 產生資料 → KPI → Realtime → Chat → Done  
- 重置：清除 `localStorage.hasTour` 標誌即可重新體驗

---

## ⚙️ 本地開發快捷指令

| 指令                       | 說明                           |
|----------------------------|--------------------------------|
| `pnpm seed`                | 以 Node script 直接寫入假資料  |
| `supabase db reset`        | 清空資料庫（本地）            |
| `supabase functions serve` | 本地測試 Edge Function        |

---

## Q & A

> **Q:** Demo 時資料會衝突嗎？  
> **A:** 生成前自動刪除 `is_test_data=true` 的紀錄，避免重複。

> **Q:** 可以僅產生訂單不產生使用者嗎？  
> **A:** 下次迭代將加入「類別選擇」選項，當前版本以全部生成為主。

---

Happy Demo! 🚀