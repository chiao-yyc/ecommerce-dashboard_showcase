<script setup lang="ts">
import { cn } from '@/utils'
import { Check } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { type HTMLAttributes, computed } from 'vue'

interface DataTableCheckboxProps {
  rowId: string
  selectedIds: string[]
  // class?: HTMLAttributes['class']
}

export interface TableOptionsMeta {
  selectedIds: string[]
  changeRowSelect?: (ids: string[]) => void
  batchDelete?: (ids: string[]) => void
  batchExport?: (data: { ids: string[], type: 'list' | 'detail', format?: 'csv' | 'xlsx' | 'json' }) => void
  deleteRow?: (id: string) => void
  editRow?: (data: any) => void
  viewDetail?: (id: string) => void
  exportDetail?: (id: string) => void
  setRowStatus?: (data: any) => void
}

const emit = defineEmits(['changeRowSelect'])

const props = defineProps<
  DataTableCheckboxProps & { class?: HTMLAttributes['class'] }
>()

// Compute checked state from rowId and selectedIds
const checked = computed(() => props.selectedIds.includes(props.rowId))

const handleSelected = (value: boolean) => {
  const set = new Set(props.selectedIds)
  if (value) {
    set.add(props.rowId)
  } else {
    set.delete(props.rowId)
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
        modelValue: checked,
        'onUpdate:modelValue': (value) => handleSelected(typeof value === 'boolean' ? value : false),
      }"
      :class="
        cn(
          'peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        )
      "
      aria-label="Select row"
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
