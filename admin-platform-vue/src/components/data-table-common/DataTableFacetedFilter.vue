<script setup lang="ts">
import type { Component } from 'vue'
import { cn } from '@/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

import { CheckIcon } from 'lucide-vue-next'
import { CirclePlus } from 'lucide-vue-next'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global

interface DataTableFacetedFilter {
  selected?: (string | boolean)[]
  title?: string
  options: {
    label: string
    value: string | boolean
    icon?: Component
  }[]
}

const props = withDefaults(defineProps<DataTableFacetedFilter>(), {
  selected: () => [],
})
const emit = defineEmits(['update:selected'])

const handleSelect = (value: string | boolean) => {
  const set = new Set(props.selected)
  const isSelected = set.has(value)
  if (isSelected) {
    set.delete(value)
  } else {
    set.add(value)
  }
  const filterValues = Array.from(set)
  emit('update:selected', filterValues.length ? filterValues : undefined)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 border-dashed" data-testid="filter-btn">
        <CirclePlus class="mr-2 h-4 w-4" />
        {{ title }}
        <template v-if="props.selected.length > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {{ props.selected.length }}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            <Badge
              v-if="props.selected.length > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{
                t('components.dataTable.selected', {
                  count: props.selected.length,
                })
              }}
            </Badge>

            <template v-else>
              <Badge
                v-for="option in options.filter((option) =>
                  props.selected.includes(option.value),
                )"
                :key="String(option.value)"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ option.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command>
        <CommandInput :placeholder="title" />
        <CommandList>
          <CommandEmpty>{{ t('components.dataTable.noResults') }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="String(option.value)"
              :value="option"
              @select="handleSelect(option.value)"
            >
              <div
                :class="
                  cn(
                    'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                    props.selected.includes(option.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible',
                  )
                "
              >
                <CheckIcon :class="cn('h-4 w-4')" />
              </div>
              <component
                :is="option.icon"
                v-if="option.icon"
                class="text-muted-foreground mr-2 h-4 w-4"
              />
              <span>{{ option.label }}</span>
            </CommandItem>
          </CommandGroup>

          <template v-if="props.selected.length > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                :value="{ label: t('components.dataTable.clearFilters') }"
                class="justify-center text-center"
                @select="emit('update:selected', undefined)"
              >
                {{ t('components.dataTable.clearFilters') }}
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
