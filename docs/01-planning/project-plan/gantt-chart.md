
# 專案時程 Gantt 圖

```mermaid
gantt
    title Growth‑Commerce Dashboard Timeline (2025)
    dateFormat  YYYY-MM-DD
    excludes    weekends

    section Phase 1 · MVP 基礎
    PRD & Tech Spec          :done,   p1_docs,   2025-05-01, 5d
    Login & Dashboard KPI    :active, p1_dev ,   2025-05-06, 7d
    Faker Seed Button        :        p1_seed,   2025-05-10, 3d

    section Phase 2 · 訂單＋庫存＋Realtime
    Orders CRUD              :        p2_order,  2025-05-15, 10d
    Inventory Module         :        p2_inv,    2025-05-18, 10d
    WebSocket Push           :        p2_ws ,    2025-05-22, 5d

    section Phase 3 · 客服中心＋RFM
    Chat & Tickets           :        p3_chat,   2025-06-01, 10d
    RFM View & Charts        :        p3_rfm ,   2025-06-05, 8d

    section Phase 4 · CI/CD & Cloud
    Docker Multi‑Stage       :        p4_docker, 2025-06-13, 4d
    GitHub Actions Pipeline  :        p4_cicd ,  2025-06-15, 3d
    AWS Fargate Deploy       :        p4_deploy, 2025-06-17, 3d

    section Phase 5 · Onboarding + i18n
    Joyride Tour             :        p5_tour ,  2025-06-21, 4d
    Multi‑language           :        p5_i18n ,  2025-06-24, 3d

    section Phase 6 · Polish & Showcase
    Lighthouse / Perf Tuning :        p6_perf ,  2025-06-27, 4d
    Storybook / Snapshot     :        p6_story,  2025-06-29, 3d
    Demo Video & Docs        :        p6_demo ,  2025-07-01, 5d
```


| Phase | 功能模組                     | 期間 (起迄)      |
|-------|-----------------------------|------------------|
| P1    | PRD & Tech Spec             | 5/1 – 5/5        |
|       | Login + KPI Dashboard       | 5/6 – 5/12       |
|       | Faker Seed Button           | 5/10 – 5/12      |
| P2    | Orders CRUD                 | 5/15 – 5/24      |
|       | Inventory Module            | 5/18 – 5/28      |
|       | Realtime WebSocket          | 5/22 – 5/27      |
| P3    | Chat & Ticketing            | 6/1 – 6/10       |
|       | RFM View & Charts           | 6/5 – 6/13       |
| P4    | Docker & CI/CD Pipeline     | 6/13 – 6/18      |
|       | AWS Fargate Deployment      | 6/17 – 6/19      |
| P5    | Onboarding Tour             | 6/21 – 6/24      |
|       | i18n (en / zh‑TW)           | 6/24 – 6/26      |
| P6    | Performance & Storybook     | 6/27 – 7/02      |
|       | Demo Video & Documentation  | 7/01 – 7/05      |
