<script setup lang="ts">
import { ref } from 'vue'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { useElementSize } from '@vueuse/core'

defineProps<{
  title?: string
  description?: string
  titleAbsolute?: boolean
}>()

const chartContentRef = ref(null)
const { width: chartContentWidth, height: chartContentHeight } =
  useElementSize(chartContentRef)
</script>

<template>
  <Card class="relative flex h-full flex-col py-4">
    <CardHeader
      v-if="title || $slots.titleLegend"
      class="flex flex-shrink-0 items-center justify-between"
      :class="{ absolute: titleAbsolute }"
    >
      <div>
        <CardTitle v-if="title" class="flex items-center gap-2">
          <span>{{ title }}</span>
          <slot name="title-tooltip" />
        </CardTitle>
        <CardDescription v-if="description">{{ description }}</CardDescription>
      </div>
      <slot name="titleLegend"></slot>
    </CardHeader>
    <CardContent ref="chartContentRef" class="min-h-0 flex-1">
      <div class="h-full w-full items-center">
        <slot
          name="default"
          :width="chartContentWidth"
          :height="chartContentHeight"
        ></slot>
      </div>
    </CardContent>
    <CardFooter v-if="$slots.footer">
      <slot name="footer"></slot>
    </CardFooter>
  </Card>
</template>

<style scoped>
/* .chart-card {
  display: flex;
  flex-direction: column;
}

.chart-card-body {
  flex: 1;
} */
</style>
