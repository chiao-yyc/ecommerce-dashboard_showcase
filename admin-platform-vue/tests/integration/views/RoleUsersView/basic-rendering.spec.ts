import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import RoleUsersView from '@/views/RoleUsersView.vue'
import { createTestWrapper } from '../../setup'
import { scenarios } from '../../../mocks'

// 使用統一 Mock 場景：基本頁面測試
scenarios.basicPage('roleUsers')

describe('RoleUsersView - Basic Rendering', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(RoleUsersView, {
      global: {
        stubs: {
          RoleUserList: {
            name: 'RoleUserList',
            template: '<div data-testid="role-users-list">Mock RoleUserList</div>'
          },
          ScrollArea: {
            name: 'ScrollArea',
            template: '<div class="scroll-area"><slot /></div>'
          }
        }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('應該正確渲染頁面標題', async () => {
    // 等待組件完全掛載
    await wrapper.vm.$nextTick()

    const title = wrapper.find('h1')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('systemSetting.userList.pageTitle')
  })

  it('應該渲染 RoleUserList 組件', () => {
    const roleUserList = wrapper.findComponent({ name: 'RoleUserList' })
    expect(roleUserList.exists()).toBe(true)
  })

  it('應該正確設置初始狀態', () => {
    // RoleUsersView 是一個簡單的包裝組件，沒有 pageTitle 屬性
    // 驗證組件成功掛載即可
    expect(wrapper.vm).toBeDefined()
    expect(wrapper.exists()).toBe(true)
  })

  it('應該包含所有必要的 UI 元素', async () => {
    // 等待組件完全掛載
    await wrapper.vm.$nextTick()

    // 驗證頁面結構
    const title = wrapper.find('h1')
    const roleUserList = wrapper.findComponent({ name: 'RoleUserList' })

    expect(title.exists()).toBe(true)
    expect(roleUserList.exists()).toBe(true)
    expect(title.text()).toBe('systemSetting.userList.pageTitle')
  })
})
