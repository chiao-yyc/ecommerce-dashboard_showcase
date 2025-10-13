// Pinia 狀態管理入口
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export * from './auth'
export * from './permission'
export * from './notification'
