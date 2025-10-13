<script setup lang="ts">
import { ref, computed } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import AppSidebar from '@/components/layouts/AppSidebar.vue'
import RightSidebar from '@/components/layouts/RightSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth'
import { useRouter, useRoute } from 'vue-router'
import { PanelRight, SunMoon, Sun, Moon, Globe } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import Notification from '@/components/notify/Notification.vue'
import EventCalendar from '@/components/notify/EventCalendar.vue'
import NotificationBadge from '@/components/notify/NotificationBadge.vue'
import { ScrollArea } from '@/components/ui/scroll-area'

const mode = useColorMode({
  disableTransition: false,
  onChanged: (newMode, _defaultHandler) => {
    // 取得要套用 class 的元素，unovis 要套用 <body> 元素才能正確顯示
    const html = document.documentElement
    const body = document.body

    // 清除舊的 class
    html.classList.remove('dark')
    body.classList.remove('theme-dark')

    // 根據新的模式，新增對應的 class
    if (newMode === 'dark') {
      html.classList.add('dark')
      body.classList.add('theme-dark')
    }
  }
})
// const mode = useColorMode({
//   initialValue: 'light', // 預設為 light 模式
//   storageKey: 'theme', // 儲存到 localStorage 的鍵名
//   storage: localStorage, // 使用 localStorage 儲存
// })
const toggleTheme = () => {
  // 切換兩種模式 light, dark
  mode.value = mode.value === 'light' ? 'dark' : 'light'
}

// 設定語系
const { locale } = useI18n()
// TODO: 設定預設語系
// 點擊後切換語系
function setLanguage(lang: 'en' | 'zh-TW') {
  locale.value = lang
}

const rightSidebarOpen = ref(false)
const toggleRightSidebar = () => {
  rightSidebarOpen.value = !rightSidebarOpen.value
}

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const breadcrumbs = computed(() => {
  // 過濾掉沒有 breadcrumb meta 的
  const filtered = route.matched.filter((r) => !!r.meta?.breadcrumb)
  // 去除 path 重複的情況
  const seen = new Set()
  return filtered
    .filter((r) => {
      if (seen.has(r.path)) return false
      seen.add(r.path)
      return true
    })
    .map((r) => ({
      label: r.meta.breadcrumb,
      path: r.path.startsWith('/') ? r.path : '/' + r.path,
    }))
})
</script>
<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <SidebarProvider>
      <AppSidebar :user="auth.user" />
      <SidebarInset class="flex flex-1 flex-col overflow-hidden">
        <header
          class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div class="flex items-center gap-2 px-4">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <template v-for="(crumb, idx) in breadcrumbs" :key="crumb.path">
                  <BreadcrumbItem>
                    <BreadcrumbLink v-if="idx < breadcrumbs.length - 1" :href="crumb.path"
                      @click.prevent="router.push(crumb.path)">
                      {{ crumb.label }}
                    </BreadcrumbLink>
                    <BreadcrumbPage v-else>
                      {{ crumb.label }}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator v-if="idx < breadcrumbs.length - 1" />
                </template>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div class="ml-auto flex items-center gap-2 px-4">
            <Separator orientation="vertical" class="ml-2 data-[orientation=vertical]:h-4" />
            <!-- i18n -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-7 w-7">
                  <Globe />
                  <!-- <Icon icon="radix-icons:moon" class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Icon icon="radix-icons:sun" class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:scale-100" /> -->
                  <span class="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="setLanguage('en')" class="flex items-center space-x-1">
                  <p class="text-muted-foreground h-5 w-6 text-center align-middle font-mono text-xs leading-5">
                    EN
                  </p>
                  <p>English</p>
                </DropdownMenuItem>
                <DropdownMenuItem @click="setLanguage('zh-TW')" class="flex items-center space-x-1">
                  <p class="text-muted-foreground h-5 w-6 text-center align-middle font-mono text-xs leading-5">
                    ZH
                  </p>
                  <p>中文</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <!-- Theme -->
            <Button variant="ghost" size="icon" class="header-icon-button h-7 w-7" @click="toggleTheme">
              <Sun v-if="mode === 'light'" />
              <Moon v-else-if="mode === 'dark'" />
              <SunMoon v-else />
              <span class="sr-only">Toggle Theme</span>
            </Button>
            <!-- Notification -->
            <NotificationBadge :userId="auth.user?.id" />
            <!-- Sidebar Right -->
            <Button variant="ghost" size="icon" class="header-icon-button h-7 w-7" @click="toggleRightSidebar">
              <PanelRight />
              <span class="sr-only">Toggle Sidebar</span>
            </Button>
          </div>
        </header>
        <ScrollArea class="overflow-auto pb-2">
          <RouterView class="px-6 py-4" />
        </ScrollArea>
      </SidebarInset>
      <RightSidebar :open="rightSidebarOpen" @close="rightSidebarOpen = false">
        <EventCalendar class="mt-2" />
        <SidebarGroup>
          <SidebarGroupLabel class="my-2">Core Entity Notifications</SidebarGroupLabel>
          <Notification />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel class="my-2">Platform</SidebarGroupLabel>
        </SidebarGroup>
      </RightSidebar>
    </SidebarProvider>
  </div>
</template>
