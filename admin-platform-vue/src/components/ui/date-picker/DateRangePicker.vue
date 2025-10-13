<script setup lang="ts">
import {
  CalendarDate,
  type DateValue,
  isEqualMonth,
  today,
  getLocalTimeZone,
} from '@internationalized/date'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { type DateRange, RangeCalendarRoot, useDateFormatter } from 'reka-ui'
import { createMonth, type Grid, toDate } from 'reka-ui/date'
import { type Ref, ref, watch, computed } from 'vue'
import { cn } from '@/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
} from '@/components/ui/range-calendar'

export interface DatePreset {
  label: string
  range: DateRange
}

interface Props {
  modelValue?: DateRange
  placeholder?: string
  showPresets?: boolean
  presets?: DatePreset[]
  showSelectedPreset?: boolean // 新增：是否顯示選中的預設標籤
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '選擇日期範圍',
  showPresets: true,
  showSelectedPreset: true, // 預設顯示預設標籤
  presets: () => [
    {
      label: '最近 7 天',
      range: {
        start: today(getLocalTimeZone()).subtract({ days: 6 }),
        end: today(getLocalTimeZone()),
      },
    },
    {
      label: '最近 30 天',
      range: {
        start: today(getLocalTimeZone()).subtract({ days: 29 }),
        end: today(getLocalTimeZone()),
      },
    },
    {
      label: '最近 60 天',
      range: {
        start: today(getLocalTimeZone()).subtract({ days: 59 }),
        end: today(getLocalTimeZone()),
      },
    },
    {
      label: '最近 90 天',
      range: {
        start: today(getLocalTimeZone()).subtract({ days: 89 }),
        end: today(getLocalTimeZone()),
      },
    },
    {
      label: '最近 3 個月',
      range: {
        start: today(getLocalTimeZone()).subtract({ months: 3 }),
        end: today(getLocalTimeZone()),
      },
    },
    {
      label: '最近 6 個月',
      range: {
        start: today(getLocalTimeZone()).subtract({ months: 6 }),
        end: today(getLocalTimeZone()),
      },
    },
    {
      label: '今年',
      range: {
        start: new CalendarDate(new Date().getFullYear(), 1, 1),
        end: today(getLocalTimeZone()),
      },
    },
  ],
})

const emit = defineEmits<{
  'update:modelValue': [value: DateRange]
  'update:selectedPreset': [label: string | null] // 新增：發出選中的預設標籤
}>()

const isOpen = ref(false)

// 追蹤選中的預設標籤
const selectedPresetLabel = ref<string | null>(null)

// Default to last 30 days if no modelValue provided
const defaultRange = {
  start: today(getLocalTimeZone()).subtract({ days: 29 }),
  end: today(getLocalTimeZone()),
}

const value = computed({
  get: () => props.modelValue || defaultRange,
  set: (val: DateRange) => {
    emit('update:modelValue', val)
    // Close popover if both dates are selected
    if (val.start && val.end) {
      isOpen.value = false
    }
    // 檢查是否匹配預設範圍
    checkMatchingPreset(val)
  },
})

// 檢查當前日期範圍是否匹配某個預設
function checkMatchingPreset(range: DateRange) {
  if (!range.start || !range.end) {
    selectedPresetLabel.value = null
    emit('update:selectedPreset', null)
    return
  }

  const startDate = toDate(range.start)
  const endDate = toDate(range.end)

  // 檢查每個預設是否匹配
  for (const preset of props.presets) {
    if (preset.range.start && preset.range.end) {
      const presetStart = toDate(preset.range.start)
      const presetEnd = toDate(preset.range.end)
      
      // 比較日期（忽略時間部分）
      if (
        startDate.toDateString() === presetStart.toDateString() &&
        endDate.toDateString() === presetEnd.toDateString()
      ) {
        selectedPresetLabel.value = preset.label
        emit('update:selectedPreset', preset.label)
        return
      }
    }
  }

  // 沒有匹配的預設，顯示自定義
  selectedPresetLabel.value = null
  emit('update:selectedPreset', null)
}

// 顯示的預設標籤文字
const displayPresetLabel = computed(() => {
  if (selectedPresetLabel.value) {
    return selectedPresetLabel.value
  }
  if (value.value.start && value.value.end) {
    return '自定義期間'
  }
  return null
})

const locale = ref('zh-TW')
const formatter = useDateFormatter(locale.value)

const firstPlaceholder = ref(
  value.value.start || today(getLocalTimeZone()),
) as Ref<DateValue>
const secondMonthPlaceholder = ref(
  value.value.end || today(getLocalTimeZone()).add({ months: 1 }),
) as Ref<DateValue>

const firstMonth = ref(
  createMonth({
    dateObj: firstPlaceholder.value,
    locale: locale.value,
    fixedWeeks: true,
    weekStartsOn: 0,
  }),
) as Ref<Grid<DateValue>>

const secondMonth = ref(
  createMonth({
    dateObj: secondMonthPlaceholder.value,
    locale: locale.value,
    fixedWeeks: true,
    weekStartsOn: 0,
  }),
) as Ref<Grid<DateValue>>

function updateMonth(reference: 'first' | 'second', months: number) {
  if (reference === 'first') {
    firstPlaceholder.value = firstPlaceholder.value.add({ months })
  } else {
    secondMonthPlaceholder.value = secondMonthPlaceholder.value.add({
      months,
    })
  }
}

watch(firstPlaceholder, (_placeholder) => {
  firstMonth.value = createMonth({
    dateObj: _placeholder,
    weekStartsOn: 0,
    fixedWeeks: false,
    locale: locale.value,
  })
  if (isEqualMonth(secondMonthPlaceholder.value, _placeholder)) {
    secondMonthPlaceholder.value = secondMonthPlaceholder.value.add({
      months: 1,
    })
  }
})

watch(secondMonthPlaceholder, (_secondMonthPlaceholder) => {
  secondMonth.value = createMonth({
    dateObj: _secondMonthPlaceholder,
    weekStartsOn: 0,
    fixedWeeks: false,
    locale: locale.value,
  })
  if (isEqualMonth(_secondMonthPlaceholder, firstPlaceholder.value))
    firstPlaceholder.value = firstPlaceholder.value.subtract({ months: 1 })
})

function selectPreset(preset: DatePreset) {
  value.value = preset.range
  firstPlaceholder.value = preset.range.start || today(getLocalTimeZone())
  secondMonthPlaceholder.value = (preset.range.end || today(getLocalTimeZone())).add({
    months: 1,
  })
  // 記錄選中的預設標籤
  selectedPresetLabel.value = preset.label
  emit('update:selectedPreset', preset.label)
}

// 初始化時檢查是否匹配預設
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    checkMatchingPreset(newValue)
  }
}, { immediate: true })
</script>

<template>
  <div class="grid gap-2">
    <div class="flex flex-col gap-2">
      <Popover v-model:open="isOpen">
        <PopoverTrigger as-child>
          <Button
            id="date"
            variant="outline"
            :class="
              cn(
                'w-[300px] justify-start text-left font-normal',
                !value.start && 'text-muted-foreground',
              )
            "
          >
            <Calendar class="mr-2 h-4 w-4" />
            <template v-if="value.start">
              <template v-if="value.end">
                {{
                  formatter.custom(toDate(value.start), { dateStyle: 'medium' })
                }}
                -
                {{ formatter.custom(toDate(value.end), { dateStyle: 'medium' }) }}
              </template>
              <template v-else>
                {{
                  formatter.custom(toDate(value.start), { dateStyle: 'medium' })
                }}
              </template>
            </template>
            <template v-else>
              {{ placeholder }}
            </template>
          </Button>
        </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <div class="flex">
          <div>
            <RangeCalendarRoot
              v-slot="{ weekDays }"
              v-model="value"
              v-model:placeholder="firstPlaceholder"
              class="p-3"
            >
              <div
                class="mt-4 flex flex-col gap-y-4 sm:flex-row sm:gap-x-4 sm:gap-y-0"
              >
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <button
                      :class="
                        cn(
                          buttonVariants({ variant: 'outline' }),
                          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                        )
                      "
                      @click="updateMonth('first', -1)"
                    >
                      <ChevronLeft class="h-4 w-4" />
                    </button>
                    <div :class="cn('text-sm font-medium')">
                      {{ formatter.fullMonthAndYear(toDate(firstMonth.value)) }}
                    </div>
                    <button
                      :class="
                        cn(
                          buttonVariants({ variant: 'outline' }),
                          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                        )
                      "
                      @click="updateMonth('first', 1)"
                    >
                      <ChevronRight class="h-4 w-4" />
                    </button>
                  </div>
                  <RangeCalendarGrid>
                    <RangeCalendarGridHead>
                      <RangeCalendarGridRow>
                        <RangeCalendarHeadCell
                          v-for="day in weekDays"
                          :key="day"
                          class="w-full"
                        >
                          {{ day }}
                        </RangeCalendarHeadCell>
                      </RangeCalendarGridRow>
                    </RangeCalendarGridHead>
                    <RangeCalendarGridBody>
                      <RangeCalendarGridRow
                        v-for="(weekDates, index) in firstMonth.rows"
                        :key="`weekDate-${index}`"
                        class="mt-2 w-full"
                      >
                        <RangeCalendarCell
                          v-for="weekDate in weekDates"
                          :key="weekDate.toString()"
                          :date="weekDate"
                        >
                          <RangeCalendarCellTrigger
                            :day="weekDate"
                            :month="firstMonth.value"
                          />
                        </RangeCalendarCell>
                      </RangeCalendarGridRow>
                    </RangeCalendarGridBody>
                  </RangeCalendarGrid>
                </div>
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <button
                      :class="
                        cn(
                          buttonVariants({ variant: 'outline' }),
                          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                        )
                      "
                      @click="updateMonth('second', -1)"
                    >
                      <ChevronLeft class="h-4 w-4" />
                    </button>
                    <div :class="cn('text-sm font-medium')">
                      {{
                        formatter.fullMonthAndYear(toDate(secondMonth.value))
                      }}
                    </div>
                    <button
                      :class="
                        cn(
                          buttonVariants({ variant: 'outline' }),
                          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                        )
                      "
                      @click="updateMonth('second', 1)"
                    >
                      <ChevronRight class="h-4 w-4" />
                    </button>
                  </div>
                  <RangeCalendarGrid>
                    <RangeCalendarGridHead>
                      <RangeCalendarGridRow>
                        <RangeCalendarHeadCell
                          v-for="day in weekDays"
                          :key="day"
                          class="w-full"
                        >
                          {{ day }}
                        </RangeCalendarHeadCell>
                      </RangeCalendarGridRow>
                    </RangeCalendarGridHead>
                    <RangeCalendarGridBody>
                      <RangeCalendarGridRow
                        v-for="(weekDates, index) in secondMonth.rows"
                        :key="`weekDate-${index}`"
                        class="mt-2 w-full"
                      >
                        <RangeCalendarCell
                          v-for="weekDate in weekDates"
                          :key="weekDate.toString()"
                          :date="weekDate"
                        >
                          <RangeCalendarCellTrigger
                            :day="weekDate"
                            :month="secondMonth.value"
                          />
                        </RangeCalendarCell>
                      </RangeCalendarGridRow>
                    </RangeCalendarGridBody>
                  </RangeCalendarGrid>
                </div>
              </div>
            </RangeCalendarRoot>
          </div>
          <div
            v-if="showPresets"
            class="flex flex-col space-y-2 border-l px-3 py-4"
          >
            <div class="px-3 text-sm font-medium">預設範圍</div>
            <div class="grid gap-1">
              <Button
                v-for="preset in presets"
                :key="preset.label"
                variant="ghost"
                class="h-auto justify-start p-2 text-sm"
                @click="() => selectPreset(preset)"
              >
                {{ preset.label }}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
      <!-- 顯示選中的預設標籤 -->
      <div v-if="showSelectedPreset && displayPresetLabel" class="flex items-center gap-2">
        <Badge variant="secondary" class="text-xs">
          {{ displayPresetLabel }}
        </Badge>
      </div>
    </div>
  </div>
</template>
