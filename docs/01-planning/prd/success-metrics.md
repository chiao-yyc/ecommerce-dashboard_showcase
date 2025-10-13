# 成功指標 (Success Metrics)

> 📌 **文檔性質說明**
> 本文檔為產品規劃階段（2025-05）的成功指標定義，實際實現的監控系統更完善。
> **請以實際代碼實現和 `02-development/architecture/dashboard-system.md` 為準。**
> 實際系統已支援：業務健康度 7 維度雷達圖、即時監控面板、系統警報整合。

| 指標類型 | 量測方式 | 目標值 |
|----------|----------|--------|
| **活躍度** | DAU / WAU (Supabase Auth 日誌) | DAU ≥ 50 % 使用者 |
| **數據新鮮度** | 後端 → 前端推播延遲 | ≤ 2 秒 |
| **客服效率** | 平均回覆時間 | < 5 分鐘 |
| **導覽完成率** | Onboarding Tour 完成 / 啟動 | ≥ 90 % |
| **部署穩定度** | CI/CD pipeline 成功率 | 100 % |
| **錯誤率** | Sentry JS error / session | < 0.1 % |

> 成功指標會在 Phase 2 引入儀表板自我監控 (self‑dogfooding)。
