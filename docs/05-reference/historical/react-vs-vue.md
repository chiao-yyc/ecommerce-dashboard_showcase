# React 與 Vue 差異對照表

> 🔖 **歷史參考文檔** - 早期技術選型時的框架對比表，僅供參考。當前專案使用 Vue 3。
>
> - **文檔性質**: 歷史參考
> - **最後更新**: 2025-10-07 (標記為歷史文檔)

| 主題           | React                             | Vue                                   |
|----------------|-----------------------------------|---------------------------------------|
| 元件語法       | JSX                               | SFC（.vue 檔）                        |
| 狀態管理       | useState, Context, Redux, Zustand | Pinia, Vuex, reactive/ref             |
| 組件溝通       | props, context, events            | props, emit, provide/inject           |
| 路由           | react-router-dom                  | Vue Router                            |
| 生命週期       | useEffect, class lifecycle        | setup(), onMounted, onUnmounted 等    |
| 資料流         | 單向資料流                        | 單向資料流 + provide/inject           |
| 生態系建構工具 | CRA, Vite, Next.js                | Vue CLI, Vite, Nuxt                   |
| 樣式方案       | CSS-in-JS, styled-components      | SFC style, CSS Modules, Tailwind      |
| 生態系套件     | MUI, AntD, React Query 等         | Element Plus, Naive UI, Vue Query 等  |
| 組件重用       | Hooks, HOC, Render Props          | Composables, mixins                   |

> 可依實際專案補充細節與團隊經驗
