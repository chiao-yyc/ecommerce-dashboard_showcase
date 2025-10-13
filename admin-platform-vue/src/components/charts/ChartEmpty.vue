<script setup lang="ts">
import { FileX } from 'lucide-vue-next'

defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center p-8 text-center">
    <div class="flex flex-col items-center space-y-4">
      <div class="bg-muted rounded-full p-3">
        <FileX class="text-muted-foreground h-8 w-8" />
      </div>
      <div class="space-y-2">
        <h3 class="text-foreground text-lg font-medium">No Data Available</h3>
        <p class="text-muted-foreground text-sm">
          {{ message || 'No chart data to display at the moment.' }}
        </p>
      </div>
    </div>
  </div>
</template>
