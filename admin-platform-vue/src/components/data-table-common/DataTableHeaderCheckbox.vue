<script setup lang="ts">
import { cn } from '@/utils'
import { Check } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

interface DataTableCheckboxProps {
  // table: Table<Order>
  rowIds: string[]
  selectedIds: string[]
  // class?: HTMLAttributes['class']
}

const emit = defineEmits(['changeRowSelect'])

const props = defineProps<
  DataTableCheckboxProps & { class?: HTMLAttributes['class'] }
>()

const modelValue = computed(() => {
  const rowIds = props.rowIds ?? []
  const set = new Set(props.selectedIds)
  const isAllSelected = set.size > 0 && rowIds.every((id) => set.has(id))
  const isSomeSelected = rowIds.some((id) => set.has(id))

  if (isAllSelected) {
    return true
  } else if (isSomeSelected) {
    return 'indeterminate'
  } else {
    return false
  }
})

const handleSelected = (value: boolean) => {
  const rowIds = props.rowIds ?? []
  const set = new Set(props.selectedIds)
  if (value) {
    rowIds.forEach((id) => set.add(id))
  } else {
    rowIds.forEach((id) => set.delete(id))
  }
  emit('changeRowSelect', Array.from(set))
}
</script>

<template>
  <label class="relative inline-flex items-center">
    <!-- 擴大點擊範圍 -->
    <span @click.stop class="absolute -inset-2 z-10 cursor-pointer"></span>

    <CheckboxRoot
      @click.stop
      data-slot="checkbox"
      v-bind="{
        modelValue,
        'onUpdate:modelValue': (value) => {
          handleSelected(typeof value === 'boolean' ? value : false)
        },
      }"
      :class="
        cn(
          'peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        )
      "
      aria-label="Select all"
    >
      <CheckboxIndicator
        data-slot="checkbox-indicator"
        class="flex items-center justify-center text-current transition-none"
      >
        <slot>
          <Check class="size-3.5" />
        </slot>
      </CheckboxIndicator>
    </CheckboxRoot>
  </label>
</template>
