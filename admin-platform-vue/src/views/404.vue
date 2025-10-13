<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FileQuestion, Home, ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'

const router = useRouter()

function goHome() {
  router.push({ name: 'home' })
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center p-4">
    <div class="mx-auto max-w-md px-6">
      <Card class="border-0 shadow-lg">
        <CardContent class="pt-8 pb-8 text-center">
          <!-- 品牌 Logo -->
          <!-- <div class="mb-6 flex justify-center">
            <img :src="logo" alt="Logo" class="h-12 w-auto" />
          </div> -->

          <!-- 錯誤圖標 -->
          <div class="mb-6 flex justify-center">
            <div class="rounded-full bg-muted p-6">
              <FileQuestion class="h-16 w-16 text-muted-foreground" />
            </div>
          </div>

          <!-- 錯誤標題 -->
          <h1 class="mb-4 text-xl font-bold tracking-tight">
            404
          </h1>

          <!-- 錯誤說明 -->
          <p class="mb-8 text-md text-muted-foreground">
            抱歉，您訪問的頁面不存在
          </p>
          <p class="mb-8 text-sm text-muted-foreground">
            該頁面可能已被移動、刪除或您輸入了錯誤的網址
          </p>

          <!-- 操作按鈕 -->
          <div class="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <Button @click="goHome" class="flex-1">
              <Home class="mr-2 h-4 w-4" />
              返回首頁
            </Button>
            <Button @click="goBack" variant="outline" class="flex-1">
              <ArrowLeft class="mr-2 h-4 w-4" />
              返回上頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
