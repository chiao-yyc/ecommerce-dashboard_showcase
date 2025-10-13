<script setup lang="ts">
import { onBeforeMount } from 'vue'
import DevFloatingWidget from '@/components/dev-tools/DevFloatingWidget.vue'
import { useAuthStore } from '@/store/auth'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

const authStore = useAuthStore()

onBeforeMount(() => {
  authStore.cleanupAuthListener()
})
</script>

<template>
  <div>
    <!-- 由於 Supabase 會話在 main.ts 中已預初始化，可直接渲染主要內容 -->
    <RouterView />
    
    <!-- Toast 和 DevWidget -->
    <Toaster theme="light" richColors position="bottom-right" />
    <DevFloatingWidget />
  </div>
</template>
